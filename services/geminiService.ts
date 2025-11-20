
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { BrandProfile, ToolRoute, ResonanceFeedback, MarketSignalReport, SeoContentBlueprint, AdCreativeBlueprint, ViralVideoBlueprint, SocialPostContent } from "../types";


// A custom error class to hold a user-friendly message that can be displayed directly in the UI.
// This ensures that technical details are logged but not exposed to the end-user.
class SynapseAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SynapseAIError';
  }
}

// Centralized, user-friendly error messages.
const QUOTA_EXCEEDED_MESSAGE = "You've reached your current generation limit. Your quota will reset shortly. For immediate, unlimited access, please consider upgrading your plan.";
const INVALID_API_KEY_MESSAGE = "The API Key is invalid or missing permissions. Please check your configuration in the settings and try again.";
const VEO_KEY_ERROR_MESSAGE = 'Your API key may be invalid or lacks permissions for video generation. Please re-select your key from the provided dialog.';
const UNEXPECTED_EMPTY_RESPONSE_MESSAGE = "The AI returned an empty response. This can be caused by an overly restrictive prompt or an internal safety filter. Please try rephrasing your request.";
const INTERNAL_SERVICE_ERROR_MESSAGE = 'The AI service is currently experiencing issues. Please wait a few moments and try again.';


/**
 * A robust, generic async function wrapper that implements exponential backoff with jitter for retries.
 * This function is specifically designed to handle transient, retriable errors like 5xx server issues
 * or network timeouts, while allowing client-side errors (4xx) to fail immediately.
 * @param apiCall The async function to execute.
 * @param maxRetries Maximum number of retry attempts.
 * @param initialDelay The base delay in ms for the first retry.
 * @returns The result of the successful API call.
 * @throws The error from the API call if it's not retriable or if all retries are exhausted.
 */
async function withRetry<T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await apiCall();
        } catch (error: any) {
            const errorStr = (error.message || JSON.stringify(error)).toLowerCase();
            
            // Only retry on transient server-side errors (5xx) or network issues.
            // Client-side errors like 429 (Quota Exceeded) should fail immediately and be handled by handleGeminiError.
            const isRetriableError = errorStr.includes('500') ||
                                     errorStr.includes('internal') ||
                                     errorStr.includes('503') ||
                                     errorStr.includes('unavailable') ||
                                     errorStr.includes('overloaded') ||
                                     errorStr.includes('network error') ||
                                     errorStr.includes('timeout');

            if (isRetriableError && attempt < maxRetries - 1) {
                attempt++;
                // Exponential backoff with jitter to prevent thundering herd problem
                const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
                console.warn(`Transient API error detected. Retrying in ${Math.round(delay/1000)}s... (Attempt ${attempt}/${maxRetries - 1})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // For non-retriable errors (e.g., 4xx quota errors) or after the last retry, re-throw.
                throw error;
            }
        }
    }
    // This is unreachable but required by TypeScript's control flow analysis.
    throw new Error("Exhausted all retries without a successful call.");
}

/**
 * Centralized validator for generateContent API responses. It checks for non-obvious failures
 * like safety blocks, premature finish reasons, or empty content, which don't throw HTTP errors.
 * @param response The GenerateContentResponse from the Gemini API.
 * @param context A string describing the operation (e.g., "Image generation").
 * @throws {SynapseAIError} if the response is invalid or deemed a failure.
 */
function validateGenerateContentResponse(response: GenerateContentResponse, context: string) {
    if (response.promptFeedback?.blockReason) {
        let reason = `Reason: ${response.promptFeedback.blockReason}.`;
        const blockedRating = response.promptFeedback.safetyRatings?.find(r => r.blocked);
        if (blockedRating) {
            reason = `The prompt was blocked for containing content related to ${blockedRating.category.replace('HARM_CATEGORY_', '').replace(/_/g, ' ').toLowerCase()}.`;
        }
        throw new SynapseAIError(`Your request for ${context} was blocked by safety filters. ${reason} Please adjust your prompt and try again.`);
    }

    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (finishReason && finishReason !== 'STOP' && finishReason !== 'UNSPECIFIED') {
        throw new SynapseAIError(`The AI stopped generating for ${context} unexpectedly. Reason: ${finishReason}. This can happen if the request is too long or the prompt is unclear. Please try simplifying your request.`);
    }
    
    const hasText = response.text && response.text.trim() !== '';
    const hasInlineData = candidate?.content?.parts?.some(part => part.inlineData);

    if (!hasText && !hasInlineData) {
        throw new SynapseAIError(UNEXPECTED_EMPTY_RESPONSE_MESSAGE);
    }
}

/**
 * Centralized error handler for all Gemini API calls. It catches technical errors,
 * logs them for debugging, and throws a user-friendly SynapseAIError to be displayed in the UI.
 * This function STOPS the generation process by throwing an error.
 * @param error The original error object caught in the service function.
 * @param context A string describing the operation (e.g., "text generation").
 * @throws {SynapseAIError} A custom error with a user-friendly message, halting the process.
 */
function handleGeminiError(error: any, context: string): never {
    console.error(`Error during ${context}:`, error);

    // If it's an error we've already processed, just pass it up.
    if (error instanceof SynapseAIError) {
        throw error;
    }

    const errorMessage = (error.message || String(error)).toLowerCase();

    // Handle specific, common Gemini API errors with tailored messages.
    if (errorMessage.includes('quota') || errorMessage.includes('resource_exhausted') || errorMessage.includes('429')) {
        throw new SynapseAIError(QUOTA_EXCEEDED_MESSAGE);
    }
    if (errorMessage.includes('api key not valid')) {
        throw new SynapseAIError(INVALID_API_KEY_MESSAGE);
    }
    if (errorMessage.includes('requested entity was not found')) {
         throw new SynapseAIError(VEO_KEY_ERROR_MESSAGE);
    }
    // Specific handling for Overloaded/503 errors
    if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
        throw new SynapseAIError("System busy: Our AI engines are experiencing high traffic. Please try again in a moment.");
    }

    if (error instanceof SyntaxError && context.includes('structured content')) {
        throw new SynapseAIError("The AI returned a malformed JSON response that could not be understood. Please try generating again.");
    }
    if (errorMessage.includes('invalid argument')) {
        throw new SynapseAIError(`The request was invalid for ${context}. Please check your prompt and settings and try again.`);
    }
    if (errorMessage.includes('500') || errorMessage.includes('internal')) {
        throw new SynapseAIError(INTERNAL_SERVICE_ERROR_MESSAGE);
    }
    
    // Fallback for any other unexpected errors.
    throw new SynapseAIError(`An unexpected error occurred during ${context}. Please try again. (Details: ${error.message || 'Unknown error'})`);
}


export async function generateContent(prompt: string): Promise<string> {
  if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.7, topP: 1, topK: 1 }
    }));

    validateGenerateContentResponse(response, "Text generation");
    return response.text.trim();
  } catch (error: any) {
    handleGeminiError(error, 'text generation');
  }
}

export async function* generateContentStream(prompt: string): AsyncGenerator<string, void, unknown> {
  if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const responseStream = await withRetry<any>(() => ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.7, topP: 1, topK: 1 }
    }));

    let hadOutput = false;
    for await (const chunk of responseStream) {
        if (chunk.promptFeedback?.blockReason) {
             let reason = `Reason: ${chunk.promptFeedback.blockReason}.`;
             const blockedRating = chunk.promptFeedback.safetyRatings?.find(r => r.blocked);
             if (blockedRating) {
                reason = `Blocked for ${blockedRating.category.replace('HARM_CATEGORY_', '').replace(/_/g, ' ').toLowerCase()}.`;
             }
             throw new SynapseAIError(`Streamed generation failed due to safety filters. ${reason} Please modify your prompt.`);
        }
        
        if (chunk.text) {
            hadOutput = true;
            yield chunk.text;
        }
    }
    if (!hadOutput) {
        throw new SynapseAIError(UNEXPECTED_EMPTY_RESPONSE_MESSAGE);
    }
  } catch (error: any) {
      handleGeminiError(error, 'streamed text generation');
  }
}

export async function generateStructuredContent(prompt: string, schema: any): Promise<any> {
  if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema },
    }));
    
    validateGenerateContentResponse(response, "Structured content generation");
    return JSON.parse(response.text.trim());
  } catch (error: any) {
    handleGeminiError(error, 'structured content generation');
  }
}

export async function analyzeBrandFromInput(input: string): Promise<Partial<BrandProfile>> {
    const prompt = `
        You are an expert Brand Strategist. Your task is to analyze the following raw user input, which could be a URL, a business description, or a tagline, and extract a professional Brand Profile.

        **User Input:** "${input}"

        **Analysis Task:**
        1.  **Brand Name:** Infer the brand name. If not explicitly stated, suggest a professional placeholder or derive it from the context.
        2.  **Product/Service Description:** Create a concise, compelling 1-2 sentence description of what the business offers.
        3.  **Target Audience:** specific, detailed description of who the ideal customer is.
        4.  **Tone of Voice:** Determine the most appropriate tone of voice (e.g., "Professional", "Witty", "Empathetic", "Bold").
        5.  **Messaging Pillars:** Identify 3 core value propositions or themes.

        **CRITICAL RULES:**
        - Return ONLY the structured JSON.
        - Be specific and professional. Avoid generic fluff.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            brandName: { type: Type.STRING, description: "The inferred name of the brand." },
            productDescription: { type: Type.STRING, description: "A concise, professional description of the product or service." },
            targetAudience: { type: Type.STRING, description: "A specific description of the ideal customer persona." },
            toneOfVoice: { type: Type.STRING, description: "The ideal marketing tone (e.g. Professional, Casual, Witty, Enthusiastic, Bold).", enum: ["Professional", "Casual", "Witty", "Enthusiastic", "Bold"] },
            messagingPillars: { type: Type.STRING, description: "3 core value props." }
        }
    };

    return await generateStructuredContent(prompt, schema);
}

export async function getResonanceFeedback(content: string, brandProfile: BrandProfile, context: { contentGoal?: string, platform?: string, emotion?: string } = {}): Promise<ResonanceFeedback> {
    const prompt = `
        You are an expert Audience Psychology Analyst. Your job is to predict how a specific target audience will react to a piece of marketing content.

        **Target Audience:** ${brandProfile.targetAudience}
        **Brand Voice:** ${brandProfile.toneOfVoice}
        **Goal:** ${context.contentGoal || 'Raise Awareness'}
        **Platform:** ${context.platform || 'General'}
        **Desired Emotion:** ${context.emotion || 'Curiosity'}

        **Content to Analyze:**
        "${content}"

        Provide a detailed resonance analysis with the following structured feedback:
        1.  **First Impresion:** What is the immediate, gut-level reaction of the audience?
        2.  **Clarity Score (0-10):** How easy is it to understand?
        3.  **Clarity Reasoning:** Why did you give that score?
        4.  **Persuasion Score (0-10):** How likely are they to take action?
        5.  **Persuasion Reasoning:** Why did you give that score?
        6.  **Key Questions:** What doubts or questions will the audience have?
        7.  **Suggested Improvement:** One concrete way to make it better.
        8.  **Goal Alignment:** Does it achieve the stated goal?
        9.  **Emotion Analysis:** Does it evoke the desired emotion?
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            firstImpression: { type: Type.STRING },
            clarityScore: { type: Type.NUMBER },
            clarityReasoning: { type: Type.STRING },
            persuasionScore: { type: Type.NUMBER },
            persuasionReasoning: { type: Type.STRING },
            keyQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedImprovement: { type: Type.STRING },
            goalAlignment: { type: Type.STRING },
            emotionAnalysis: { type: Type.STRING }
        }
    };

    return await generateStructuredContent(prompt, schema);
}

export async function getMarketSignalAnalysis(topic: string, targetAudience: string, industry: string, analysisGoal: string, brandProfile: BrandProfile): Promise<MarketSignalReport> {
    if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");

    const prompt = `
        You are an expert Market Research Analyst. Perform a deep-dive analysis on the topic: "${topic}".
        
        Context:
        - Target Audience: ${targetAudience}
        - Industry: ${industry}
        - Analysis Goal: ${analysisGoal}
        
        Brand Context:
        - Brand Name: ${brandProfile.brandName}
        - Product: ${brandProfile.productDescription}

        Generate a comprehensive market signal report with the following sections:

        1.  **Trending Sub-Topics:** Identify 4 specific, high-momentum sub-topics related to the main topic that are currently buzzing. Assign a "Buzz Score" (0-10) based on estimated current interest.
        2.  **Audience Questions:** List 5 specific, burning questions the target audience is asking about this topic right now.
        3.  **Competitor Angles:** Analyze 3 common angles competitors are using, and identify 1 "Untapped Angle" that represents a blue-ocean opportunity.
        4.  **Content Playbook:** Recommend 3 specific pieces of content to create immediately to capitalize on these signals. varied formats (e.g., Blog Post, Short Video, Social Media Post).

        **CRITICAL INSTRUCTION FOR 'Content Playbook':**
        - For 'Social Media Post', the 'title' must be a **short topic description** (e.g., "The impact of AI on agency margins"), NOT the actual post copy. **Do NOT include hashtags.**
        - For 'Blog Post', the 'title' should be a headline.
        - For 'Short Video', the 'title' should be the video concept.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            trendingSubTopics: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING, description: "The sub-topic name." },
                        reason: { type: Type.STRING, description: "Why it is trending now." },
                        buzzScore: { type: Type.NUMBER, description: "0-10 score." }
                    }
                }
            },
            audienceQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            competitorAngles: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        angle: { type: Type.STRING },
                        isUntapped: { type: Type.BOOLEAN }
                    }
                }
            },
            contentRecommendations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        format: { type: Type.STRING, description: "e.g., Blog Post, Short Video, Social Media Post" },
                        title: { type: Type.STRING, description: "The TOPIC or CONCEPT or HEADLINE. Do NOT include hashtags or full body copy." }
                    }
                }
            }
        }
    };

    return await generateStructuredContent(prompt, schema);
}

export async function generateSeoContentBlueprint(params: { topic: string, targetAudience: string, contentGoal: string, tone: string }): Promise<SeoContentBlueprint> {
    const prompt = `
        You are an expert SEO Strategist and Content Architect. Create a comprehensive content blueprint for the topic: "${params.topic}".

        Target Audience: ${params.targetAudience}
        Content Goal: ${params.contentGoal}
        Tone of Voice: ${params.tone}

        The blueprint must include:
        1.  **Title Suggestions:** 3 SEO-optimized titles with different angles (e.g., How-to, Listicle, Contrarian).
        2.  **Target Keywords:** 1 Primary Keyword and 4 Secondary Keywords.
        3.  **Hook:** A compelling opening paragraph (hook) that grabs attention immediately.
        4.  **Article Outline:** A detailed outline with H2 headings and bullet points for each section.
        5.  **Call to Action:** A strong closing CTA relevant to the goal.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            titleSuggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING, description: "e.g., 'Guide', 'Listicle', 'Opinion'" }
                    }
                }
            },
            targetKeywords: {
                type: Type.OBJECT,
                properties: {
                    primaryKeyword: { type: Type.STRING },
                    secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            },
            hook: { type: Type.STRING },
            fullArticleOutline: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        heading: { type: Type.STRING },
                        talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            },
            callToAction: { type: Type.STRING }
        }
    };

    return await generateStructuredContent(prompt, schema);
}


export async function generateAdCreativeBlueprint(params: { productDescription: string, targetAudience: string, platform: string, tone: string }): Promise<AdCreativeBlueprint> {
     const prompt = `
        You are an expert Creative Director. Develop a complete Ad Creative Blueprint for the following product:
        
        Product: "${params.productDescription}"
        Target Audience: ${params.targetAudience}
        Platform: ${params.platform}
        Tone: ${params.tone}

        The blueprint must include:
        1.  **Copy Variations:** 3 distinct ad copy variations (Headline + Body), each focusing on a different marketing angle (e.g., Pain Point, Benefit, Social Proof).
        2.  **Visual Concept:** A detailed, descriptive prompt for an AI image generator to create the perfect visual for this ad.
        3.  **Targeting:** 3 suggested interest groups or demographics to target.
        4.  **CTA Ideas:** 3 short, punchy Call-to-Action button text options.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            copyVariations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        angle: { type: Type.STRING, description: "The marketing angle used." },
                        headline: { type: Type.STRING },
                        body: { type: Type.STRING }
                    }
                }
            },
            imagePrompt: { type: Type.STRING, description: "Detailed prompt for AI image generator." },
            targetingSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            ctaSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };

    return await generateStructuredContent(prompt, schema);
}

export async function generateViralVideoBlueprint(params: { topic: string, hookStyle: string, tone: string, platform: string }): Promise<ViralVideoBlueprint> {
    const prompt = `
       You are a Viral Content Strategist for short-form video (TikTok/Reels/Shorts). Create a blueprint for a video about: "${params.topic}".

       Platform: ${params.platform}
       Hook Style: ${params.hookStyle} (e.g., "Stop doing this", "Here's a secret", "Storytime")
       Tone: ${params.tone}

       The blueprint must include:
       1.  **Hook Text:** The exact text to display/say in the first 3 seconds. Must be scroll-stopping.
       2.  **Script Outline:** A step-by-step bulleted list of what happens in the video (visuals + narration).
       3.  **Visual Concept:** Description of the setting, lighting, and main subject.
       4.  **Pacing & Style:** Description of the editing style (e.g., "Fast cuts", "Slow zoom", "Chaos edit").
       5.  **Audio Suggestion:** Type of background music or sound effect vibe.
       6.  **Call to Action:** What the viewer should do at the end.
   `;

   const schema = {
       type: Type.OBJECT,
       properties: {
           hookText: { type: Type.STRING },
           scriptOutline: { type: Type.ARRAY, items: { type: Type.STRING } },
           visualConcept: { type: Type.STRING },
           pacingAndStyle: { type: Type.STRING },
           audioSuggestion: { type: Type.STRING },
           callToAction: { type: Type.STRING }
       }
   };

   return await generateStructuredContent(prompt, schema);
}


export async function routeUserIntent(command: string): Promise<ToolRoute> {
    // This function acts as a router, deciding which tool to use based on natural language.
    const prompt = `
        You are an intelligent intent router for a marketing AI platform. 
        Map the user's command to the most appropriate tool ID from the list below.
        Also, extract the core "topic" and any "platform" preferences to pre-fill the tool.

        **Available Tools:**
        - "SocialMediaPost": For writing posts for Twitter, LinkedIn, Facebook.
        - "MarketingEmail": For writing emails, newsletters, cold outreach.
        - "AIImageGenerator": For generating images from scratch.
        - "AIImageEditor": For editing existing images.
        - "CampaignBuilder": For planning full marketing campaigns.
        - "MarketSignalAnalyzer": For research, trends, and competitor analysis.
        - "SeoContentBlueprint": For blog post outlines and SEO strategy.
        - "AIAdCreativeStudio": For ad copy and ad visuals.
        - "ViralVideoBlueprint": For short-form video scripts (TikTok/Reels).
        - "MarketingVideoAd": For generating actual video files (mp4).
        - "ResonanceEngine": For analyzing/grading existing copy (if user pastes text to check).

        **User Command:** "${command}"

        **Output JSON Schema:**
        {
            "toolId": "string",
            "prefill": {
                "topic": "string", // The core subject matter extracted from command
                "platform": "string" // Optional: "Twitter", "LinkedIn", "Facebook" if relevant
            }
        }
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            toolId: { type: Type.STRING },
            prefill: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING },
                    platform: { type: Type.STRING }
                }
            }
        }
    };
    
    return await generateStructuredContent(prompt, schema);
}


export async function generateCampaignStrategy(goal: string, brandProfile: BrandProfile): Promise<any> {
    const prompt = `
        You are a Senior Marketing Strategist. Develop a multi-phase marketing campaign strategy to achieve the following goal: "${goal}".

        **Brand Context:**
        - Brand: ${brandProfile.brandName}
        - Product: ${brandProfile.productDescription}
        - Audience: ${brandProfile.targetAudience}
        - Tone: ${brandProfile.toneOfVoice}

        **Requirements:**
        1.  **Campaign Title:** A creative name for the campaign.
        2.  **Phases:** Break the campaign into 3 logical phases (e.g., "Tease", "Launch", "Sustain" OR "Awareness", "Consideration", "Conversion").
        3.  **Assets per Phase:** For each phase, define 2-3 specific marketing assets to create.
            - Allowed Asset Types: 'Social Media Post', 'Marketing Email', 'Ad Copy', 'Blog Post Ideas'.
            - For each asset, provide a specific 'description' of what that piece of content should be about (e.g., "A tweet announcing the 50% discount", "An email explaining the new feature").
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            campaignTitle: { type: Type.STRING },
            phases: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        assets: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    contentType: { type: Type.STRING, enum: ['Social Media Post', 'Marketing Email', 'Ad Copy', 'Blog Post Ideas'] },
                                    description: { type: Type.STRING, description: "Specific instruction for what this asset is." }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    return await generateStructuredContent(prompt, schema);
}


export async function generateCampaignAsset(description: string, contentType: string, brandProfile: BrandProfile): Promise<any> {
    const prompt = `
        You are an expert content creator. Generate the content for the following campaign asset.

        **Asset Type:** ${contentType}
        **Task:** ${description}

        **Brand Context:**
        - Brand: ${brandProfile.brandName}
        - Tone: ${brandProfile.toneOfVoice}
        - Product: ${brandProfile.productDescription}

        **Requirements:**
        - Return a structured JSON object appropriate for the content type.
    `;
    
    let schema;
    if (contentType === 'Social Media Post') {
         schema = {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "Must be 'social'" },
                platform: { type: Type.STRING, description: "Twitter, LinkedIn, or Facebook" },
                copy: { type: Type.STRING },
                hashtags: { type: Type.STRING },
                imagePrompt: { type: Type.STRING }
            },
            required: ["type", "platform", "copy", "hashtags", "imagePrompt"]
        };
    } else if (contentType === 'Marketing Email') {
        schema = {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "Must be 'email'" },
                subject: { type: Type.STRING },
                body: { type: Type.STRING },
                cta: { type: Type.STRING }
            },
            required: ["type", "subject", "body", "cta"]
        };
    } else if (contentType === 'Ad Copy') {
        schema = {
             type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "Must be 'ad'" },
                headline: { type: Type.STRING },
                body: { type: Type.STRING }
            },
            required: ["type", "headline", "body"]
        };
    } else if (contentType === 'Blog Post Ideas') {
         schema = {
             type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "Must be 'blog'" },
                ideas: {
                    type: Type.ARRAY,
                    items: {
                         type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    }
                }
            },
            required: ["type", "ideas"]
        };
    } else {
        // Fallback for unknown types, though the UI limits this.
         return { type: 'unknown', content: "Error: Unsupported content type." };
    }

    return await generateStructuredContent(prompt, schema);
}

export async function generateAgentPlan(goal: string, persona: string, brandProfile: BrandProfile): Promise<any> {
    const prompt = `
        You are an Autonomous Marketing Agent with the persona: "${persona}".
        Your high-level goal is: "${goal}".

        **Brand Context:**
        - Product: ${brandProfile.productDescription}
        - Audience: ${brandProfile.targetAudience}

        Create a tactical plan consisting of 3-5 concrete tasks to achieve this goal.
        Each task must result in a specific content asset (Social Post, Email, Ad Copy, Blog Ideas).
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING, description: "e.g. 'Draft a LinkedIn announcement post'" },
                contentType: { type: Type.STRING, enum: ['Social Media Post', 'Marketing Email', 'Ad Copy', 'Blog Post Ideas'] }
            },
            required: ["description", "contentType"]
        }
    };

    return await generateStructuredContent(prompt, schema);
}

export async function generateImage(prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1', style: string = 'Photorealistic'): Promise<string> {
  if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");

  // Enhance the prompt with style instructions
  const enhancedPrompt = `${prompt} . Style: ${style}, high resolution, professional quality.`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await withRetry<any>(() => ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio,
        outputMimeType: 'image/jpeg', // Changed to image/jpeg as per documentation recommendation for general use
      }
    }), 2, 2000); // Fewer retries for image gen as it's more expensive/slower

    if (response.generatedImages && response.generatedImages.length > 0) {
         const base64Image = response.generatedImages[0].image.imageBytes;
         return `data:image/jpeg;base64,${base64Image}`;
    } else {
        throw new SynapseAIError("No image was returned by the generator.");
    }
  } catch (error: any) {
      handleGeminiError(error, 'image generation');
  }
}

export async function editImage(imageBase64: string, mimeType: string, editInstruction: string): Promise<string> {
  if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: editInstruction,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    }), 2, 2000);

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(part => part.inlineData);
    
    if (imagePart && imagePart.inlineData) {
         return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } else {
         // Sometimes the model refuses to edit and returns text explaining why.
         if (response.text) {
             throw new SynapseAIError(`The AI could not edit the image. Message: ${response.text}`);
         }
         throw new SynapseAIError("No edited image was returned.");
    }
  } catch (error: any) {
      handleGeminiError(error, 'image editing');
  }
}

export async function generateVideo(prompt: string, startImage: { data: string, mimeType: string } | null, config: { aspectRatio: string, resolution: string }): Promise<any> {
    if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let requestConfig: any = {
            numberOfVideos: 1,
            aspectRatio: config.aspectRatio || '16:9',
            resolution: config.resolution || '720p',
        };
        
        let requestParams: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: requestConfig
        };

        if (startImage) {
             requestParams.image = {
                imageBytes: startImage.data,
                mimeType: startImage.mimeType,
            };
        }
        
        const operation = await withRetry<any>(() => ai.models.generateVideos(requestParams), 2, 2000);
        return operation;

    } catch (error: any) {
         handleGeminiError(error, 'video generation');
    }
}

export async function getVideosOperation(operation: any): Promise<any> {
    if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await ai.operations.getVideosOperation({ operation });
}

export async function generateSocialPost(params: { topic: string, tone: string, platform: 'Twitter' | 'LinkedIn' | 'Facebook', numOutputs: number }): Promise<SocialPostContent[]> {
    const prompt = `
        You are an expert Social Media Manager. Create ${params.numOutputs} distinct social media post variations for the following topic.

        Topic: "${params.topic}"
        Platform: ${params.platform}
        Tone: ${params.tone}

        Each variation must include:
        1.  **Copy:** The main text of the post, optimized for the platform's best practices (length, style, formatting).
        2.  **Hashtags:** 3-5 relevant hashtags.
        3.  **Image Prompt:** A detailed description to generate a matching image for this post.
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['social'] },
                platform: { type: Type.STRING, enum: ['Twitter', 'LinkedIn', 'Facebook'] },
                copy: { type: Type.STRING },
                hashtags: { type: Type.STRING },
                imagePrompt: { type: Type.STRING }
            },
            required: ["type", "platform", "copy", "hashtags", "imagePrompt"]
        }
    };
    
    // Ensure the type is forced to 'social' and platform matches input in the response
    const results = await generateStructuredContent(prompt, schema);
    return results.map((r: any) => ({ ...r, type: 'social', platform: params.platform }));
}

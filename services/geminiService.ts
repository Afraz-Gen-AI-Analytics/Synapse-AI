import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { BrandProfile, ToolRoute, ResonanceFeedback, MarketSignalReport, SeoContentBlueprint, AdCreativeBlueprint, ViralVideoBlueprint } from "../types";


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

export async function* generateContentStream(prompt: string) {
  if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const responseStream = await withRetry<AsyncGenerator<GenerateContentResponse>>(() => ai.models.generateContentStream({
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

export async function getResonanceFeedback(content: string, brandProfile: BrandProfile, options: { contentGoal: string; platform: string; emotion: string; }): Promise<ResonanceFeedback> {
    const prompt = `
        You are an AI embodiment of a specific target audience. Your personality, skepticism, and needs perfectly match this description: "${brandProfile.targetAudience}".
        Your task is to analyze the following piece of marketing content based on a specific set of objectives.

        **Marketing Content to Analyze:**
        ---
        ${content}
        ---

        **Content Objectives:**
        - **Goal:** This content is intended to **${options.contentGoal}**.
        - **Platform:** It will be published as a **${options.platform}**.
        - **Desired Emotion:** It should make the audience feel **${options.emotion}**.

        Based on your persona and these objectives, provide structured feedback.

        **CRITICAL RULES:**
        1.  **Evaluate Against Objectives:** Your entire analysis must be through the lens of the stated Goal, Platform, and Desired Emotion.
        2.  **Score honestly (1-10):** 1 is terrible, 10 is perfect for achieving the goal.
        3.  **Be specific in your reasoning:** Don't just say "it's good," explain *why* from your persona's perspective.
        4.  **Provide actionable suggestions.**
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            firstImpression: { type: Type.STRING, description: "Your immediate, gut reaction in one sentence." },
            clarityScore: { type: Type.NUMBER, description: "On a scale of 1-10, how clear is the message?" },
            clarityReasoning: { type: Type.STRING, description: "Explain your clarity score. What was confusing or clear?" },
            persuasionScore: { type: Type.NUMBER, description: "On a scale of 1-10, how likely are you to take the action defined by the 'Goal'?" },
            persuasionReasoning: { type: Type.STRING, description: "Explain your persuasion score. What made it effective or ineffective for the goal?" },
            keyQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List 2-3 questions or doubts that immediately come to mind." },
            suggestedImprovement: { type: Type.STRING, description: "What is the single most important change that would make this more compelling?" },
            goalAlignment: { type: Type.STRING, description: "In 1-2 sentences, analyze how well the content aligns with its stated Goal. Provide specific reasons." },
            emotionAnalysis: { type: Type.STRING, description: "In 1-2 sentences, analyze if the content successfully evokes the Desired Emotion. Explain why or why not." }
        },
        required: ["firstImpression", "clarityScore", "clarityReasoning", "persuasionScore", "persuasionReasoning", "keyQuestions", "suggestedImprovement", "goalAlignment", "emotionAnalysis"]
    };

    return await generateStructuredContent(prompt, schema) as ResonanceFeedback;
}

export async function getMarketSignalAnalysis(topic: string, targetAudience: string, industry: string, analysisGoal: string, brandProfile: BrandProfile): Promise<MarketSignalReport> {
    const prompt = `
        You are an expert market research analyst for a leading marketing intelligence firm. Your task is to analyze a given topic and target audience to uncover actionable insights for content creation.

        **Brand Context:**
        - Brand Name: ${brandProfile.brandName}
        - Product/Service: ${brandProfile.productDescription}

        **Analysis Request:**
        - **Topic:** "${topic}"
        - **Target Audience:** "${targetAudience}"
        - **Industry/Niche:** "${industry}"
        - **Primary Goal of this Analysis:** "${analysisGoal}"

        Based on this, generate a structured report. Your analysis and recommendations should be highly relevant to the specified Industry and tailored to achieve the Primary Goal.

        **CRITICAL RULES:**
        1.  **Trending Sub-Topics:** Identify 3-4 niche sub-topics that are currently gaining traction online. For each topic, provide a 'buzzScore' from 1-10 indicating its current level of online discussion (1=very niche, 10=mainstream buzz). Explain *why* each is relevant now.
        2.  **Audience Questions:** List 3-4 real, specific questions the target audience is asking on platforms like Google, Reddit, or Quora. These should be "long-tail" questions.
        3.  **Competitor Angles:** Analyze 2 common angles competitors are taking on this topic. Then, identify 1 unique, "Untapped Angle" that provides a fresh perspective. You MUST provide exactly three angles in total, and one MUST be marked as untapped.
        4.  **Content Recommendations:** Suggest 3 concrete content ideas (e.g., Blog Post, Short Video, LinkedIn Carousel) with catchy, SEO-friendly titles that directly leverage your findings and align with the primary analysis goal.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            trendingSubTopics: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING, description: "The specific trending sub-topic." },
                        reason: { type: Type.STRING, description: "A brief explanation of why this sub-topic is currently relevant." },
                        buzzScore: { type: Type.NUMBER, description: "A score from 1-10 representing the current online buzz." }
                    },
                    required: ["topic", "reason", "buzzScore"]
                }
            },
            audienceQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of questions the target audience is asking online."
            },
            competitorAngles: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        angle: { type: Type.STRING, description: "A common or untapped content angle." },
                        isUntapped: { type: Type.BOOLEAN, description: "True if this is the unique, untapped angle." }
                    },
                    required: ["angle", "isUntapped"]
                }
            },
            contentRecommendations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        format: { type: Type.STRING, description: "The recommended content format (e.g., Blog Post, Short Video)." },
                        title: { type: Type.STRING, description: "A catchy, SEO-friendly title for the content piece." }
                    },
                    required: ["format", "title"]
                }
            }
        },
        required: ["trendingSubTopics", "audienceQuestions", "competitorAngles", "contentRecommendations"]
    };

    return await generateStructuredContent(prompt, schema) as MarketSignalReport;
}

export async function generateSeoContentBlueprint(options: { topic: string, targetAudience: string, contentGoal: string, tone: string }): Promise<SeoContentBlueprint> {
    const prompt = `
        You are an expert SEO Content Strategist. Your task is to generate a comprehensive, actionable content blueprint for a blog post based on the user's requirements.

        **Request Details:**
        - **Main Topic:** "${options.topic}"
        - **Target Audience:** "${options.targetAudience}"
        - **Primary Content Goal:** "${options.contentGoal}"
        - **Tone of Voice:** "${options.tone}"

        Generate a structured JSON response following these critical rules.

        **CRITICAL RULES:**
        1.  **Title Suggestions:** Provide exactly three distinct title options. Each title must have a 'category' explaining its strategic angle (e.g., 'SEO-Optimized', 'Click-Worthy', 'Question-Based').
        2.  **Target Keywords:** Identify one clear 'primaryKeyword' that the article should rank for. Also provide 3-5 'secondaryKeywords' (LSI keywords) that should be naturally included.
        3.  **The Hook:** Write a compelling, fully-formed opening paragraph (the 'hook') designed to immediately grab the reader's attention and reduce bounce rate. It must align with the specified tone.
        4.  **Full Article Outline:** Create a hierarchical outline with at least three main sections, each with a suggested H2 heading. Under each heading, provide 3-5 specific 'talkingPoints' (as a bulleted list or array of strings) that should be covered in that section.
        5.  **Call to Action (CTA):** Suggest a short, powerful call-to-action for the end of the article that is directly aligned with the user's stated 'Content Goal'.
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            titleSuggestions: {
                type: Type.ARRAY,
                description: "An array of 3 distinct title suggestions.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A compelling, SEO-friendly title." },
                        category: { type: Type.STRING, description: "The strategic angle of the title (e.g., 'SEO-Optimized', 'Click-Worthy')." }
                    },
                    required: ["title", "category"]
                }
            },
            targetKeywords: {
                type: Type.OBJECT,
                properties: {
                    primaryKeyword: { type: Type.STRING, description: "The main keyword to target." },
                    secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of related LSI keywords." }
                },
                required: ["primaryKeyword", "secondaryKeywords"]
            },
            hook: { type: Type.STRING, description: "A powerful, fully-written opening paragraph." },
            fullArticleOutline: {
                type: Type.ARRAY,
                description: "A complete article outline with H2 headings and talking points.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        heading: { type: Type.STRING, description: "The suggested H2 heading for the section." },
                        talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bullet points to cover in this section." }
                    },
                    required: ["heading", "talkingPoints"]
                }
            },
            callToAction: { type: Type.STRING, description: "A suggested call-to-action aligned with the content goal." }
        },
        required: ["titleSuggestions", "targetKeywords", "hook", "fullArticleOutline", "callToAction"]
    };

    return await generateStructuredContent(prompt, schema) as SeoContentBlueprint;
}

export async function generateAdCreativeBlueprint(options: { productDescription: string; targetAudience: string; platform: string; tone: string; }): Promise<AdCreativeBlueprint> {
    const prompt = `
        You are an expert direct-response copywriter and ad strategist. Your task is to generate a complete ad creative package for a specific platform.

        **Request Details:**
        - **Product/Service:** "${options.productDescription}"
        - **Target Audience:** "${options.targetAudience}"
        - **Ad Platform:** "${options.platform}"
        - **Tone of Voice:** "${options.tone}"

        Generate a structured JSON response containing a complete creative package.

        **CRITICAL RULES:**
        1.  **Copy Variations:** Provide exactly three distinct copy variations. Each variation must have a unique 'angle' (e.g., "Problem/Solution", "Benefit-Driven", "Social Proof"), a compelling 'headline', and benefit-focused 'body' text.
        2.  **Platform Specificity:** Headlines and body text must be appropriate for the specified **Ad Platform**. E.g., concise for Google Ads, professional for LinkedIn.
        3.  **Image Prompt:** Create one highly detailed, professional prompt for an AI image generator. The prompt should describe a visually stunning and contextually relevant image that would capture the target audience's attention and complement the ad copy.
        4.  **Targeting Suggestions:** Provide three specific, actionable audience targeting recommendations suitable for the chosen **Ad Platform**.
        5.  **CTA Suggestions:** List three short, punchy, and relevant Call-to-Action phrases.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            copyVariations: {
                type: Type.ARRAY,
                description: "An array of 3 distinct ad copy variations, each with a strategic angle.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        angle: { type: Type.STRING, description: "The marketing angle for this copy (e.g., 'Problem/Solution')." },
                        headline: { type: Type.STRING, description: "A compelling, platform-appropriate headline." },
                        body: { type: Type.STRING, description: "Benefit-focused body text." }
                    },
                    required: ["angle", "headline", "body"]
                }
            },
            imagePrompt: {
                type: Type.STRING,
                description: "A detailed prompt for an AI image generator to create the ad visual."
            },
            targetingSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of 3 specific audience targeting recommendations for the ad platform."
            },
            ctaSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of 3 compelling Call-to-Action phrases."
            }
        },
        required: ["copyVariations", "imagePrompt", "targetingSuggestions", "ctaSuggestions"]
    };

    return await generateStructuredContent(prompt, schema) as AdCreativeBlueprint;
}

export async function generateViralVideoBlueprint(options: { topic: string, hookStyle: string, tone: string, platform: string }): Promise<ViralVideoBlueprint> {
    const prompt = `
        You are an expert viral video strategist for short-form content on platforms like TikTok, Instagram Reels, and YouTube Shorts.
        Your task is to create a complete, actionable blueprint for a viral video based on the user's requirements.

        **Request Details:**
        - **Main Topic:** "${options.topic}"
        - **Hook Style:** "${options.hookStyle}"
        - **Tone of Voice:** "${options.tone}"
        - **Target Platform:** "${options.platform}"

        Generate a structured JSON response following these critical rules:

        **CRITICAL RULES:**
        1.  **Hook Text:** Create one powerful, scroll-stopping opening line that fits the requested style and tone. It must be concise and attention-grabbing.
        2.  **Script Outline:** Provide a sequence of 3-5 brief, clear steps for the video's narrative flow. This should guide the creator from start to finish.
        3.  **Visual Concept:** Describe the overall visual style in one sentence. E.g., "Fast-paced cuts with energetic text overlays," or "A cinematic, slow-motion shot with a moody color grade."
        4.  **Pacing and Style:** Provide 1-2 sentences of actionable advice on editing style. E.g., "Use quick, dynamic cuts. Add text overlays to emphasize key points. A zoom effect can highlight the final reveal."
        5.  **Audio Suggestion:** Suggest a type of audio that would pair well. Be descriptive, not specific to a copyrighted song. E.g., "Upbeat trending pop song with a strong beat," or "Dramatic, royalty-free cinematic music."
        6.  **Call to Action (CTA):** Write a short, powerful call-to-action for the end of the video that encourages engagement. E.g., "Follow for more life hacks!" or "Comment your thoughts below!".
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            hookText: { type: Type.STRING, description: "The single, powerful opening line for the video." },
            scriptOutline: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 3-5 strings, describing the script's step-by-step narrative flow." },
            visualConcept: { type: Type.STRING, description: "A one-sentence description of the video's visual style." },
            pacingAndStyle: { type: Type.STRING, description: "1-2 sentences of advice on editing, pacing, and visual style." },
            audioSuggestion: { type: Type.STRING, description: "A suggestion for the type of background audio or music." },
            callToAction: { type: Type.STRING, description: "A short, engaging call-to-action for the end of the video." },
        },
        required: ["hookText", "scriptOutline", "visualConcept", "pacingAndStyle", "audioSuggestion", "callToAction"]
    };

    return await generateStructuredContent(prompt, schema) as ViralVideoBlueprint;
}


export async function generateAgentPlan(goal: string, persona: string, brandProfile: BrandProfile): Promise<any> {
    const prompt = `
        You are an expert marketing strategist tasked with creating a detailed, actionable plan.
        **Brand Context:**
        - Brand Name: ${brandProfile.brandName}
        - Product/Service: ${brandProfile.productDescription}
        - Target Audience: ${brandProfile.targetAudience}
        - Tone of Voice: ${brandProfile.toneOfVoice}
        **Agent Persona:** ${persona}
        **Primary Goal:** "${goal}"
        Based on the goal and brand, generate a strategic plan of EXACTLY 4 tasks.
        CRITICAL RULE: Each task MUST have a different and unique 'contentType' from 'Social Media Post', 'Marketing Email', 'Ad Copy', 'Blog Post Ideas'.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            plan: {
                type: Type.ARRAY,
                description: "An array of 4 distinct strategic marketing tasks.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: "A clear, concise description of the task." },
                        contentType: { type: Type.STRING, description: "The type of content to produce. Must be one of: 'Social Media Post', 'Marketing Email', 'Ad Copy', 'Blog Post Ideas'." },
                    },
                    required: ["description", "contentType"]
                }
            }
        },
        required: ["plan"]
    };

    const structuredResult = await generateStructuredContent(prompt, schema);
    return structuredResult.plan;
}

export async function generateCampaignStrategy(goal: string, brandProfile: BrandProfile): Promise<any> {
    const prompt = `
        You are an expert marketing strategist. Create a high-level, multi-phase campaign strategy. Do not generate the content itself, only the plan.
        **Brand Context:**
        - Brand: ${brandProfile.brandName}, Product: ${brandProfile.productDescription}, Audience: ${brandProfile.targetAudience}, Tone: ${brandProfile.toneOfVoice}
        **Primary Campaign Goal:** "${goal}"
        Generate a strategic plan with 2-3 logical phases. For each phase, provide a name, objective, and a list of 3 diverse marketing assets to be created.
        Ensure asset variety. If suggesting multiple 'Social Media Post' assets in a phase, they MUST be for different platforms (e.g., Twitter, LinkedIn).
        For each asset, provide a 'contentType' and a concise, actionable 'description' for an AI to generate the content.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            strategy: {
                type: Type.OBJECT, properties: {
                    campaignTitle: { type: Type.STRING, description: "A creative title for the campaign." },
                    phases: {
                        type: Type.ARRAY, items: {
                            type: Type.OBJECT, properties: {
                                name: { type: Type.STRING, description: "Name of the phase (e.g., 'Phase 1: Pre-Launch Hype')." },
                                description: { type: Type.STRING, description: "The phase's objective." },
                                assets: {
                                    type: Type.ARRAY, items: {
                                        type: Type.OBJECT, properties: {
                                            contentType: { type: Type.STRING, description: "Must be one of: 'Social Media Post', 'Marketing Email', 'Ad Copy', 'Blog Post Ideas'." },
                                            description: { type: Type.STRING, description: "An actionable instruction for an AI to generate this asset." }
                                        }, required: ["contentType", "description"]
                                    }
                                }
                            }, required: ["name", "description", "assets"]
                        }
                    }
                }, required: ["campaignTitle", "phases"]
            }
        }, required: ["strategy"]
    };

    const structuredResult = await generateStructuredContent(prompt, schema);
    return structuredResult.strategy;
}

export async function generateCampaignAsset(taskDescription: string, contentType: string, brandProfile: BrandProfile): Promise<any> {
    let prompt = `
        You are an AI Agent with the persona of a skilled marketer. Your task is: "${taskDescription}".
        Brand info:
        - Brand Name: ${brandProfile.brandName}, Tone: ${brandProfile.toneOfVoice}, Product: ${brandProfile.productDescription}
        Generate the required content in a structured JSON format.
    `;
    let schema;

    if (contentType === 'Social Media Post') {
        prompt = `
            You are an AI social media manager executing a single task from a larger campaign.
            **Task:** "${taskDescription}"
            **Brand Info:**
            - Tone: ${brandProfile.toneOfVoice}
            - Product: ${brandProfile.productDescription}
            
            Based on the task, choose the MOST appropriate platform ('Twitter', 'LinkedIn', 'Facebook') and generate the content for it.

            **PLATFORM-SPECIFIC CONTENT RULES:**
            - If you choose **Twitter**, the 'copy' must be concise and under 280 characters.
            - If you choose **LinkedIn**, the 'copy' must be professional and longer, around 4-6 sentences.
            - If you choose **Facebook**, the 'copy' must be engaging and conversational, 2-3 short paragraphs.
            
            Generate the required content in the structured JSON format.
        `;
         schema = {
            type: Type.OBJECT, properties: {
                type: { type: Type.STRING, description: "Must be 'social'" }, platform: { type: Type.STRING, enum: ['Twitter', 'LinkedIn', 'Facebook'] },
                copy: { type: Type.STRING, description: "The main body of the post." }, hashtags: { type: Type.STRING, description: "3-4 relevant hashtags." },
                imagePrompt: { type: Type.STRING, description: "A detailed prompt for an AI image generator." }
            }, required: ["type", "platform", "copy", "hashtags", "imagePrompt"]
        };
    } else if (contentType === 'Marketing Email') {
         schema = {
            type: Type.OBJECT, properties: {
                type: { type: Type.STRING, description: "Must be 'email'" }, subject: { type: Type.STRING, description: "A catchy email subject line." },
                body: { type: Type.STRING, description: "The full email body text, formatted with newlines (\\n)." },
                cta: { type: Type.STRING, description: "A short call-to-action phrase." }
            }, required: ["type", "subject", "body", "cta"]
        };
    } else if (contentType === 'Ad Copy') {
        schema = {
           type: Type.OBJECT, properties: {
               type: { type: Type.STRING, description: "Must be 'ad'" }, headline: { type: Type.STRING, description: "A short, punchy headline." },
               body: { type: Type.STRING, description: "The main description/body text." },
           }, required: ["type", "headline", "body"]
       };
   } else if (contentType === 'Blog Post Ideas') {
        schema = {
           type: Type.OBJECT, properties: {
               type: { type: Type.STRING, description: "Must be 'blog'" },
               ideas: {
                   type: Type.ARRAY, items: {
                       type: Type.OBJECT, properties: {
                           title: { type: Type.STRING, description: "A creative and SEO-friendly title." },
                           description: { type: Type.STRING, description: "A one-sentence summary." }
                       }, required: ["title", "description"]
                   }
               }
           }, required: ["type", "ideas"]
       };
   } else {
       throw new SynapseAIError(`Unsupported content type for structured generation: ${contentType}`);
   }
    
    return await generateStructuredContent(prompt, schema);
}

export async function generateImage(prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4', style: string): Promise<string> {
  if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let styleInstruction = `**Style:** Embody a ${style.toLowerCase()} aesthetic.`;
    if (style.toLowerCase() === 'studio level') {
        styleInstruction = `
      **Style: Studio Level Product Photography**
      - **Goal:** Create a premium "hero shot" suitable for a high-end advertisement or product landing page.
      - **Lighting:** Employ professional studio lighting techniques. Think softboxes for clean highlights, rim lighting to define edges, and controlled, soft shadows to create depth. Avoid flat, boring light.
      - **Background:** Use a clean, professional studio background. This could be a solid color (often light gray, white, or black), a subtle gradient, or a simple, elegant texture. The background must not distract from the subject.
      - **Focus & Detail:** The subject must be in sharp, perfect focus, with every detail rendered crisply. Use a shallow depth of field if appropriate to make the subject pop.
      - **Composition:** The subject should be the undeniable focal point. Use classic composition rules (like rule of thirds) to create a visually pleasing and impactful image.
        `;
    }

    const fullPrompt = `
      You are a world-class AI visual designer and commercial photographer specializing in creating stunning, high-impact marketing imagery. Your goal is to transform user prompts into professional, high-quality visuals ready for a major campaign.

      **Core Principles:**
      - **Professionalism:** Generate images that look like they were made by a top-tier advertising agency.
      - **Marketing Focus:** The final image must be compelling and suitable for use in an ad, on a website, or in a social media campaign.
      - **Creativity:** If the prompt is simple (e.g., "a watch"), creatively interpret it as a luxury product photoshoot. Add appropriate context to elevate the subject.
      - **Clarity:** Ensure the subject is clearly and attractively presented.

      ${styleInstruction}

      **User Request:**
      "${prompt}"

      **General Execution Details:**
      - **Quality:** Ultra-high resolution, photorealistic details, cinematic lighting, sharp focus.
      - **Composition:** Apply principles of professional photography and graphic design.
    `;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: fullPrompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    }));

    validateGenerateContentResponse(response, "Image generation");

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
    }

    throw new SynapseAIError("Image generation succeeded, but no image data was found in the response.");
  } catch (error: any) {
    handleGeminiError(error, 'image generation');
  }
}

export async function editImage(base64ImageData: string, mimeType: string, prompt: string): Promise<string> {
  if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullPrompt = `
      You are an expert AI photo editor and retoucher. Your task is to apply professional-level edits to the provided image based on the user's request. Always aim for a clean, high-quality result suitable for marketing materials.

      **User's Edit Request:**
      "${prompt}"
    `;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { data: base64ImageData, mimeType } }, { text: fullPrompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    }));

    validateGenerateContentResponse(response, "Image editing");
    
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
    }
    
    throw new SynapseAIError("Image editing succeeded, but no new image was returned.");
  } catch (error: any) {
    handleGeminiError(error, 'image editing');
  }
}

export async function generateVideo(prompt: string, image: { data: string; mimeType: string; } | null, config: any): Promise<any> {
    if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const operation = await withRetry(() => ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            image: image ? { imageBytes: image.data, mimeType: image.mimeType } : undefined,
            config: { numberOfVideos: 1, ...config }
        }), 2, 5000); // Fewer retries for long-running ops
        return operation;
    } catch (error: any) {
        handleGeminiError(error, 'video generation');
    }
}

export async function getVideosOperation(operation: any): Promise<any> {
    if (!process.env.API_KEY) throw new SynapseAIError("API Key is not configured.");
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        return await withRetry(() => ai.operations.getVideosOperation({ operation }), 3, 3000);
    } catch (error: any) {
        handleGeminiError(error, 'video status check');
    }
}

export async function routeUserIntent(command: string): Promise<ToolRoute> {
  const prompt = `
    You are an intelligent routing system for an AI platform. Analyze the user's command and determine the best tool and pre-fill information.
    Available Tool IDs: 'CampaignBuilder', 'ResonanceEngine', 'MarketSignalAnalyzer', 'AIImageGenerator', 'AIImageEditor', 'MarketingVideoAd', 'SocialMediaPost', 'VideoScriptHook', 'BlogPostIdeas', 'MarketingEmail', 'AIAdCreativeStudio'.
    
    **Tool Descriptions & Routing Logic:**
    - 'CampaignBuilder': For planning multi-step marketing campaigns. Keywords: "plan", "campaign", "strategy".
    - 'ResonanceEngine': For analyzing or getting feedback on existing content. Keywords: "analyze", "test", "feedback", "review this".
    - 'MarketSignalAnalyzer': For market research, finding trends, and audience questions. Keywords: "market research", "analyze topic", "trending topics", "what should I write about".
    - 'AIImageGenerator': For generating a new image from a description. Keywords: "image", "photo", "picture", "graphic", "generate an image".
    - 'AIImageEditor': For modifying an existing image. Keywords: "edit this image", "change the background", "add text to photo".
    - 'MarketingVideoAd': For creating a short video ad. Keywords: "video", "ad", "commercial".
    - 'SocialMediaPost': For specific social media content. Keywords: "tweet", "LinkedIn post", "Facebook update".
    - 'VideoScriptHook': For creating a short, catchy opening for a video. Keywords: "video hook", "TikTok intro", "Reel idea", "opening line".
    - 'BlogPostIdeas': For brainstorming blog titles. Keywords: "blog ideas", "article topics".
    - 'MarketingEmail': For writing email copy. Keywords: "email", "newsletter".
    - 'AIAdCreativeStudio': For text-based ads (e.g., Google Ads, Facebook Ads) or brainstorming ad concepts. Keywords: "ad copy", "headline", "google ad", "facebook ad".

    Analyze the user's command: "${command}" and extract the main topic and specific parameters (like platform for social media).
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      toolId: { type: Type.STRING, description: "The ID of the best tool for the user's command.", enum: ['CampaignBuilder', 'ResonanceEngine', 'MarketSignalAnalyzer', 'AIImageGenerator', 'AIImageEditor', 'MarketingVideoAd', 'SocialMediaPost', 'VideoScriptHook', 'BlogPostIdeas', 'MarketingEmail', 'AIAdCreativeStudio'] },
      prefill: {
        type: Type.OBJECT, properties: {
          topic: { type: Type.STRING, description: "The main subject extracted from the command." },
          platform: { type: Type.STRING, description: "The social media platform if specified (e.g., 'Twitter', 'LinkedIn').", nullable: true }
        }, required: ["topic"]
      }
    }, required: ["toolId", "prefill"]
  };

  return await generateStructuredContent(prompt, schema) as ToolRoute;
}
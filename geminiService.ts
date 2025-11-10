


import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { BrandProfile, ToolRoute } from "../types";


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
    const prompt = `
        You are an AI Agent with the persona of a skilled marketer. Your task is: "${taskDescription}".
        Brand info:
        - Brand Name: ${brandProfile.brandName}, Tone: ${brandProfile.toneOfVoice}, Product: ${brandProfile.productDescription}
        Generate the required content in a structured JSON format.
    `;
    let schema;

    if (contentType === 'Social Media Post') {
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
    const fullPrompt = `
      You are a world-class AI visual designer specializing in creating stunning, high-impact marketing imagery and advertisement posters. Your goal is to transform user prompts, even simple ones, into professional, high-quality visuals that are ready for a marketing campaign.

      **Core Principles:**
      - **Professionalism:** Generate images that look like they were made by a top-tier advertising agency. Think clean lighting, professional composition, and high resolution.
      - **Marketing Focus:** The final image must be suitable for use in an ad, on a website, or in a social media campaign.
      - **Creativity:** If the prompt is simple (e.g., "a watch"), creatively interpret it as a luxury product photoshoot. Add appropriate backgrounds, lighting, and context.
      - **Clarity:** Ensure the subject is clearly and attractively presented.

      **User Request:**
      "${prompt}"

      **Execution Details:**
      - **Style:** ${style.toLowerCase()}
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
    Available Tool IDs: 'CampaignBuilder', 'MarketingImage', 'MarketingImageEditor', 'MarketingVideoAd', 'SocialMediaPost', 'VideoScriptHook', 'BlogPostIdeas', 'MarketingEmail', 'AdCopy'.
    Analyze the user's command and extract the main topic and specific parameters (like platform for social media).
    User Command: "${command}"
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      toolId: { type: Type.STRING, description: "The ID of the best tool for the user's command.", enum: ['CampaignBuilder', 'MarketingImage', 'MarketingImageEditor', 'MarketingVideoAd', 'SocialMediaPost', 'VideoScriptHook', 'BlogPostIdeas', 'MarketingEmail', 'AdCopy'] },
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
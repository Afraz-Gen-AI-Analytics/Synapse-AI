import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ContentType, Template, HistoryItem, User, ToolRoute, BrandProfile } from '../types';
import { 
    generateContentStream, 
    generateImage, 
    editImage, 
    generateVideo, 
    getVideosOperation,
    routeUserIntent,
    getResonanceFeedback
} from '../services/geminiService';
import { 
    updateUserDoc,
    FREEMIUM_GENERATION_LIMIT,
    addHistoryDoc,
    getBrandProfile,
    isBrandProfileComplete
} from '../services/firebaseService';
import { useToast } from '../contexts/ToastContext';

import SocialIcon from './icons/SocialIcon';
import BlogIcon from './icons/BlogIcon';
import EmailIcon from './icons/EmailIcon';
import AdIcon from './icons/AdIcon';
import VideoIcon from './icons/VideoIcon';
import HistoryIcon from './icons/HistoryIcon';
import SynapseLogo from './icons/SynapseLogo';
import CopyIcon from './icons/CopyIcon';
import CampaignIcon from './icons/CampaignIcon';
import AgentIcon from './icons/AgentIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';
import SettingsIcon from './icons/SettingsIcon';
import HomeIcon from './icons/HomeIcon';
import ImageIcon from './icons/ImageIcon';
import EditImageIcon from './icons/EditImageIcon';
import FilmIcon from './icons/FilmIcon';
import SparklesIcon from './icons/SparklesIcon';
import HeadsetIcon from './icons/HeadsetIcon';
import ResonanceIcon from './icons/ResonanceIcon';
import Tooltip from './Tooltip';
import ProFeatureBadge from './ProFeatureBadge';

import UpgradeModal from './UpgradeModal';
import CampaignBuilder from './CampaignBuilder';
import AgentManager from './AgentManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import SettingsView from './SettingsView';
import UserProfile from './UserProfile';
import HomeDashboard from './HomeDashboard';
import LiveAgentView from './LiveAgentView';
import HistoryView from './HistoryView';

import TextGeneratorLayout from './layouts/TextGeneratorLayout';
import ImageEditorLayout from './layouts/ImageEditorLayout';
import VideoGeneratorLayout from './layouts/VideoGeneratorLayout';
import UsageUpgradeCard from './UsageUpgradeCard';
import BottomNavBar from './BottomNavBar';
import CommandBar from './CommandBar';
import CompleteProfilePrompt from './CompleteProfilePrompt';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const markdownToHtml = (text: string) => {
  if (!text) return '';
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Process unordered lists
  html = html.replace(/^( *\* .*(?:\n|$))+/gm, (match) => {
    const items = match.trim().split('\n').map(item => `<li>${item.replace(/^\* /, '').trim()}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Process ordered lists
  html = html.replace(/^( *\d+\. .*(?:\n|$))+/gm, (match) => {
    const items = match.trim().split('\n').map(item => `<li>${item.replace(/^\d+\. /, '').trim()}</li>`).join('');
    return `<ol>${items}</ol>`;
  });
  
  // Convert remaining newlines to <br>
  html = html.replace(/\n/g, '<br />');

  // Clean up <br> tags inside lists
  html = html.replace(/<li><br \/>/g, '<li>');
  html = html.replace(/<br \/>\s*<br \/>/g, '<br />');
  html = html.replace(/<br \/>\s*<(ul|ol|h[1-3])>/g, '<$1>');
  html = html.replace(/<\/(ul|ol|h[1-3])>\s*<br \/>/g, '</$1>');

  return html;
};

const compressImageForHistory = (base64DataUrl: string, maxSizeInBytes: number = 900000): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64DataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            let width = img.width;
            let height = img.height;
            const maxDimension = 800; // Max width/height for thumbnail to reduce size

            if (width > height) {
                if (width > maxDimension) {
                    height *= maxDimension / width;
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width *= maxDimension / height;
                    height = maxDimension;
                }
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Try JPEG at a high quality first, as it's usually smaller than PNG
            let quality = 0.9;
            let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            
            // If it's still too large, reduce quality until it fits
            while (compressedDataUrl.length > maxSizeInBytes && quality > 0.1) {
                quality -= 0.1;
                compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            
            if (compressedDataUrl.length > maxSizeInBytes) {
                console.warn(`Image could not be compressed enough for history. Final size: ${compressedDataUrl.length} bytes.`);
                return reject(new Error('Image is too large to save in history, even after compression.'));
            }

            resolve(compressedDataUrl);
        };
        img.onerror = (err) => {
            console.error("Image load error for compression:", err);
            reject(new Error('Failed to load image for compression'));
        };
    });
};

const templates: Template[] = [
  {
    id: ContentType.Campaign,
    name: "Campaign Builder",
    description: "Deploy a complete, multi-channel marketing strategy from a single goal.",
    icon: CampaignIcon,
    isPro: true,
  },
  {
    id: ContentType.ResonanceEngine,
    name: "Resonance Engine",
    description: "Simulate your audience's reaction and get predictive feedback before you publish.",
    icon: ResonanceIcon,
    isPro: true,
    placeholder: "Paste your social media post, email, or ad copy here to test its resonance with your target audience...",
    fields: [
      { name: "contentGoal", label: "Content Goal", options: ["Raise Awareness", "Drive Engagement", "Generate Leads", "Drive Sales", "Educate or Inform"], defaultValue: "Raise Awareness" },
      { name: "platform", label: "Platform / Format", options: ["Social Media (General)", "X / Twitter Post", "LinkedIn Post", "Email Subject Line", "Email Body", "Ad Headline", "Ad Body", "Landing Page Headline"], defaultValue: "Social Media (General)" },
      { name: "emotion", label: "Key Emotion to Evoke", options: ["Urgency", "Curiosity", "Trust", "Excitement", "FOMO", "Inspiration", "Joy"], defaultValue: "Curiosity" }
    ],
  },
  {
    id: ContentType.AIImage,
    name: "AI Ad Creative",
    description: "Generate high-impact ad creatives and marketing visuals in seconds.",
    icon: ImageIcon,
    placeholder: "e.g., A vibrant banner ad for a summer sale on sunglasses, 16:9 aspect ratio",
    fields: [
      { name: "aspectRatio", label: "Aspect Ratio", options: ["1:1", "16:9", "9:16", "4:3", "3:4"], defaultValue: "1:1" },
      { name: "style", label: "Image Style", options: ["Photorealistic", "3D Render", "Graphic Illustration", "Abstract", "Minimalist"], defaultValue: "Photorealistic" }
    ],
  },
   {
    id: ContentType.AIImageEditor,
    name: "AI Image Editor",
    description: "Edit and transform your images with simple text commands.",
    icon: EditImageIcon,
    placeholder: "e.g., Add the text '50% OFF' in a bold, modern font to the top left corner",
  },
  {
    id: ContentType.AIVideoGenerator,
    name: "Marketing Video Ad",
    description: "Create compelling video ads that capture attention and drive results.",
    icon: FilmIcon,
    placeholder: "e.g., A 5-second video ad showing a new perfume bottle with sparkles and light flares",
    fields: [
      { name: "aspectRatio", label: "Aspect Ratio", options: ["16:9", "9:16"], defaultValue: "16:9" },
      { name: "resolution", label: "Resolution", options: ["720p"], defaultValue: "720p" }
    ],
    isPro: true,
  },
  {
    id: ContentType.SocialMediaPost,
    name: "Social Media Post",
    description: "Craft engaging social media posts that build your audience.",
    icon: SocialIcon,
    placeholder: "e.g., Announcing a new AI-powered productivity app called 'Momentum'",
    fields: [
      { name: "platform", label: "Platform", options: ["Twitter", "LinkedIn", "Facebook"], defaultValue: "Twitter" }
    ],
    supportsVariations: true,
    prompt: ({ topic, tone, fields, numOutputs = 1 }) => {
        const platform = fields.platform || "Twitter";
        let platformInstruction = '';
        switch (platform) {
            case 'LinkedIn':
                platformInstruction = `Generate a professional, insightful, and ${tone} LinkedIn post of approximately 4-6 sentences. It should be suitable for a professional audience, encourage discussion, and use strategic hashtags.`;
                break;
            case 'Facebook':
                platformInstruction = `Generate an engaging, conversational, and ${tone} Facebook post of 2-3 short paragraphs. It should be designed to spark conversation, include 1-2 relevant emojis, and use popular hashtags.`;
                break;
            case 'Twitter':
            default:
                platformInstruction = `Generate a concise, impactful, and ${tone} tweet (under 280 characters). It must be attention-grabbing and include 2-3 highly relevant hashtags.`;
                break;
        }

        return `You are an expert social media manager. Your sole task is to generate social media content.
${platformInstruction}

**CRITICAL RULES:**
1.  **Direct Output Only:** Provide ONLY the direct post content. Do not include any introductory text, titles, conversational phrases like "Here is your post", or explanations.
2.  **Tone:** The post must strictly adhere to a ${tone} tone.
3.  **Formatting:** Use Markdown for emphasis (e.g., **bold text**).

${numOutputs > 1 ? `IMPORTANT: Generate ${numOutputs} distinct post variations, separated by "[---VARIATION_SEPARATOR---]" on a new line with nothing else on it.` : ''}

**Topic:** "${topic}"`
    }
  },
  {
    id: ContentType.VideoScriptHook,
    name: "Video Script Hook",
    description: "Create irresistible video hooks that stop the scroll and boost watch time.",
    icon: VideoIcon,
    placeholder: "e.g., A productivity hack that saves me 2 hours a day",
    fields: [
      { 
        name: "hookStyle", 
        label: "Hook Style", 
        options: ["General", "Question", "Bold Statement", "Storytelling", "Problem/Solution", "Statistic/Fact"], 
        defaultValue: "General" 
      }
    ],
    prompt: ({ topic, tone, fields }) => {
        const hookStyle = fields.hookStyle || 'General';
        let styleInstruction = '';
        if (hookStyle && hookStyle !== 'General') {
            styleInstruction = `**Hook Style:** The hooks MUST follow the **${hookStyle}** framework.`;
        } else {
            styleInstruction = '**Proven Frameworks:** Use different psychological triggers for each hook (e.g., ask a provocative question, state a surprising fact, challenge a common belief, promise a quick solution).';
        }

        return `You are a viral video scriptwriter specializing in creating high-retention short-form content. Your task is to generate 3 powerful video hooks for a TikTok or YouTube Short.

**CRITICAL RULES:**
1.  **Tone of Voice:** The hooks MUST strictly reflect the chosen tone: **${tone}**.
2.  **Value First:** Each hook must grab immediate attention by promising clear, tangible value or sparking intense curiosity.
3.  ${styleInstruction}
4.  **Brevity:** Each hook must be under 15 words.

Format the output as a Markdown numbered list.

**Topic:** "${topic}"`;
    }
  },
  {
    id: ContentType.BlogIdea,
    name: "Blog Post Ideas",
    description: "Discover viral blog ideas that attract readers and rank higher.",
    icon: BlogIcon,
    placeholder: "e.g., The future of renewable energy",
    supportsVariations: true,
    prompt: ({ topic, tone, numOutputs = 1 }) => `You are an expert content strategist and SEO specialist. Your task is to generate ${numOutputs} highly professional and engaging blog post idea${numOutputs > 1 ? 's' : ''}.

**CRITICAL RULES:**
1.  **Tone of Voice:** The ideas MUST strictly reflect the chosen tone: **${tone}**.
2.  **Value-Driven & Actionable:** Each idea MUST provide a clear, tangible benefit to the reader. Frame it as a solution, a guide, a list of secrets, or an actionable insight. Avoid generic or vague titles.
3.  **Engaging & SEO-Optimized Titles:** The title must be compelling, creative, and optimized for search engines. It should spark curiosity and clearly communicate the value proposition.
4.  **Formatting:** For each idea, provide:
    - An engaging **Title**.
    - A one-sentence **Description** that highlights the core benefit for the reader (e.g., "This post will teach you how to...", "Learn the framework for avoiding this common mistake...").

${numOutputs > 1 ? 'IMPORTANT: Use "[---VARIATION_SEPARATOR---]" on a new line with nothing else on it to separate each distinct blog idea.' : ''}

Format each idea using Markdown. Make the title **bold**.

**Topic:** "${topic}"`
  },
  {
    id: ContentType.EmailCopy,
    name: "Marketing Email",
    description: "Write powerful, persuasive emails that turn subscribers into customers.",
    icon: EmailIcon,
    placeholder: "e.g., A 20% discount offer for returning customers",
    supportsVariations: true,
    prompt: ({ topic, tone, numOutputs = 1 }) => `You are an expert marketing copywriter specializing in creating highly engaging and professional emails. Your sole task is to generate the direct email content. Do not include any extra conversational text, introductions, or explanations.

Write ${numOutputs} persuasive marketing email${numOutputs > 1 ? 's' : ''} for the following purpose.

**CRITICAL RULES:**
1.  **Tone of Voice:** The email's style, language, and feeling MUST strictly reflect the chosen tone: **${tone}**.
2.  **Emojis:** Incorporate 2-3 relevant emojis naturally within the email body. The emojis you choose must align perfectly with the selected tone. For example:
    - If the tone is 'Professional', use emojis like ✅, 🚀, 📈.
    - If the tone is 'Casual' or 'Enthusiastic', use emojis like 👋, 🎉, 😊, 🔥.
    - If the tone is 'Witty', use emojis like 😉, 💡, 😜.
3.  **Formatting:**
    - Start with a heading for the subject line (e.g., '## Subject: ...').
    - Use **bold text** for the primary call-to-action.

${numOutputs > 1 ? 'IMPORTANT: Use "[---VARIATION_SEPARATOR---]" on a new line with nothing else on it to separate each distinct email variation.' : ''}

**Purpose:** "${topic}"`
  },
  {
    id: ContentType.AdCopy,
    name: "Ad Copy",
    description: "Create compelling ad copy that drives clicks and boosts your ROI.",
    icon: AdIcon,
    placeholder: "e.g., High-performance running shoes for trail running enthusiasts",
    supportsVariations: true,
    prompt: ({ topic, tone, numOutputs = 1 }) => `You are an expert direct-response copywriter focused exclusively on generating high-converting ad copy that drives action. For the topic below, generate ${numOutputs} ad copy version${numOutputs > 1 ? 's' : ''}.

**CRITICAL RULES:**
1.  **Tone of Voice:** The copy MUST strictly reflect the chosen tone: **${tone}**.
2.  **Benefit-Driven:** Do not list features. Instead, focus entirely on the user's desired outcome and the value they will receive. Answer the question "What's in it for me?".
3.  **Clear & Concise:** Use short, punchy sentences. Every word must earn its place.

Each version MUST contain:
1.  **A Headline:** Grabs attention by addressing a core user pain point or a powerful desired outcome.
2.  **A Body:** Clearly explains the main benefit and how the product/service improves the user's life.

${numOutputs > 1 ? 'IMPORTANT: Use "[---VARIATION_SEPARATOR---]" on a new line with nothing else on it to separate each distinct ad copy variation.' : ''}

Format each version using Markdown, with '## Headline' and '## Body' sections.

**Topic:** "${topic}"`
  }
];

const tones = ["Professional", "Casual", "Witty", "Enthusiastic", "Bold"];

type UploadedFile = { data: string; mimeType: string; name: string; dataUrl: string };

type Tab = 'home' | 'tools' | 'live-agent' | 'agents' | 'history' | 'analytics' | 'settings';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [initialHistoryTab, setInitialHistoryTab] = useState<'tools' | 'campaigns'>('tools');
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[1]); // Default to Resonance Engine
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState(tones[0]);
  const [extraFields, setExtraFields] = useState<{ [key: string]: string }>({ aspectRatio: '1:1', resolution: '720p', style: 'Photorealistic' });
  
  const [generatedContents, setGeneratedContents] = useState<string[]>([]);
  const [activeVariation, setActiveVariation] = useState(0);
  const [numOutputs, setNumOutputs] = useState(1);
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);
  const { addToast } = useToast();
  
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null); // For Image Comparator
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVeoKeySelected, setIsVeoKeySelected] = useState(false);
  const [veoKeyCheckError, setVeoKeyCheckError] = useState('');

  // State for Command Bar
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);

  // State for features requiring brand profile
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);

  // State for redirecting after settings save
  const [navigationSource, setNavigationSource] = useState<Tab | null>(null);

  useEffect(() => {
    setCurrentUser(user);
    getBrandProfile(user.uid).then(profile => {
        setBrandProfile(profile);
        setIsProfileComplete(isBrandProfileComplete(profile));
    });
  }, [user]);

  useEffect(() => {
    const checkVeoKey = async () => {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
            setIsVeoKeySelected(true);
        }
    };
    checkVeoKey();
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'history') {
        // When user clicks the main history tab, always default to 'tools'
        setInitialHistoryTab('tools');
    }
    setGeneratedContents([]);
    setVideoUrl(null);
  }

  const handleNavigateToCampaignHistory = () => {
    setInitialHistoryTab('campaigns');
    setActiveTab('history');
  };

  const handleNavigateToSettings = (sourceTab: Tab) => {
    setNavigationSource(sourceTab);
    setActiveTab('settings');
  };

  const handleSettingsSaveSuccess = () => {
      if (navigationSource) {
          addToast(`Profile saved! Returning you to ${navigationSource}.`, 'success');
          setActiveTab(navigationSource);
          setNavigationSource(null);
      } else {
          // If user came to settings directly, redirect to home page.
          addToast('Profile saved successfully!', 'success');
          setActiveTab('home');
      }
  };


  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setTopic('');
    setGeneratedContents([]);
    setActiveVariation(0);
    setNumOutputs(1);
    setUploadedImage(null);
    setOriginalImageUrl(null);
    setVideoStatus('');
    setVideoUrl(null);
    setActiveTab('tools');
    setIsToolsDrawerOpen(false); // Close drawer on mobile after selection
    if (template.fields) {
        const initialFields = template.fields.reduce((acc, field) => {
          acc[field.name] = field.defaultValue || (field.options ? field.options[0] : '');
          return acc;
        }, {} as { [key: string]: string });
        setExtraFields(initialFields || {});
    } else {
        setExtraFields({});
    }
  }, []);
  
  const handleFileSelect = (file: UploadedFile | null) => {
    setUploadedImage(file);
    if (file && selectedTemplate.id === ContentType.AIImageEditor) {
        setOriginalImageUrl(file.dataUrl);
    } else {
        setOriginalImageUrl(null);
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setExtraFields(prev => ({ ...prev, [fieldName]: value }));
  };
  
  const handleGenerationResult = useCallback(async (result: string, genTopic: string, templateName: string) => {
    try {
        const isImageTemplate = templateName === "AI Ad Creative" || templateName === "AI Image Editor";
        let contentToSave = result;

        if (isImageTemplate && result.startsWith('data:image')) {
            try {
                contentToSave = await compressImageForHistory(result);
            } catch (compressionError: any) {
                console.error("Image compression failed for history:", compressionError);
                addToast("Image generated, but it's too large to save to history.", "info");
                
                // Still increment generation count even if history save fails
                const updatedUser = { ...currentUser, generationsUsed: currentUser.generationsUsed + 1 };
                setCurrentUser(updatedUser);
                await updateUserDoc(currentUser.uid, { generationsUsed: updatedUser.generationsUsed });
                
                return; // Exit without attempting to save the large item
            }
        } else if (!isImageTemplate) {
            const FIRESTORE_FIELD_MAX_BYTES = 1000000;
            const encoder = new TextEncoder();
            const encoded = encoder.encode(contentToSave);

            if (encoded.length > FIRESTORE_FIELD_MAX_BYTES) {
                const truncatedEncoded = encoded.slice(0, FIRESTORE_FIELD_MAX_BYTES);
                const decoder = new TextDecoder('utf-8', { fatal: false });
                contentToSave = decoder.decode(truncatedEncoded);
                
                if (contentToSave.endsWith('\uFFFD')) {
                    contentToSave = contentToSave.slice(0, -1);
                }
                
                contentToSave += "\n\n... [Content truncated to fit database limits]";
                addToast("Generated content was too long and has been truncated for history.", "info");
            }
        }

        await addHistoryDoc(currentUser.uid, {
            userId: currentUser.uid,
            templateName: templateName,
            content: contentToSave,
            topic: genTopic,
            timestamp: new Date().toISOString(),
        });
        
        const updatedUser = { ...currentUser, generationsUsed: currentUser.generationsUsed + 1 };
        setCurrentUser(updatedUser);
        
        await updateUserDoc(currentUser.uid, { generationsUsed: updatedUser.generationsUsed });

    } catch (err: any) {
        console.error("Failed to save history item:", err);
        if (err.message && err.message.includes('longer than 1048487 bytes')) {
            addToast("Failed to save: The generated content is too large for the database.", "error");
        } else {
             addToast("Could not save generation to history.", "error");
        }
    }
  }, [currentUser, addToast]);

  const handleGenerate = useCallback(async () => {
    if (!topic) {
      addToast("Please enter a topic or prompt to generate content.", "error");
      return;
    }
    
    if (currentUser.plan === 'freemium' && (currentUser.generationsUsed >= FREEMIUM_GENERATION_LIMIT || selectedTemplate.isPro)) {
        setShowUpgradeModal(true);
        return;
    }
    
    if (selectedTemplate.id === ContentType.AIImageEditor && !uploadedImage) {
        addToast("Please upload an image to edit.", "error");
        return;
    }

     if (selectedTemplate.id === ContentType.AIVideoGenerator && !isVeoKeySelected) {
        addToast('Please select an API key to use the video generator.', 'error');
        return;
    }

    setIsLoading(true);
    setGeneratedContents([]);
    setActiveVariation(0);
    setVideoUrl(null);
    setVideoStatus('');

    try {
      let fullResponse = "";
      switch (selectedTemplate.id) {
        case ContentType.ResonanceEngine:
            if (!brandProfile) throw new Error("Brand profile not loaded.");
            const feedback = await getResonanceFeedback(topic, brandProfile, {
                contentGoal: extraFields.contentGoal || 'Raise Awareness',
                platform: extraFields.platform || 'Social Media (General)',
                emotion: extraFields.emotion || 'Curiosity'
            });
            fullResponse = JSON.stringify(feedback);
            setGeneratedContents([fullResponse]);
            await handleGenerationResult(fullResponse, topic, selectedTemplate.name);
            break;
        case ContentType.AIImage:
            fullResponse = await generateImage(topic, (extraFields.aspectRatio || '1:1') as any, extraFields.style || 'Photorealistic');
            setGeneratedContents([fullResponse]);
            await handleGenerationResult(fullResponse, topic, selectedTemplate.name);
            break;
        case ContentType.AIImageEditor:
            if (!uploadedImage) throw new Error("No image uploaded.");
            fullResponse = await editImage(uploadedImage.data, uploadedImage.mimeType, topic);
            setGeneratedContents([fullResponse]);
            await handleGenerationResult(fullResponse, topic, selectedTemplate.name);
            break;
        case ContentType.AIVideoGenerator:
            setVideoStatus('Initializing...');
            const videoConfig = { aspectRatio: extraFields.aspectRatio, resolution: extraFields.resolution };
            let operation = await generateVideo(topic, uploadedImage, videoConfig);
            setVideoStatus('Processing request...');

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                setVideoStatus('Rendering frames...');
                operation = await getVideosOperation(operation);
            }
            setVideoStatus('Finalizing video...');

            if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                const downloadLink = operation.response.generatedVideos[0].video.uri;
                const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                const videoBlob = await videoResponse.blob();
                const localUrl = URL.createObjectURL(videoBlob);
                setVideoUrl(localUrl);
                await handleGenerationResult(`Generated video for prompt: "${topic}"`, topic, selectedTemplate.name);
            } else {
                throw new Error("Video generation completed, but no video URI was found.");
            }
            break;
        default:
          const prompt = selectedTemplate.prompt!({ topic, tone, fields: extraFields, numOutputs });
          const stream = generateContentStream(prompt);
          // Handle streaming text generation
          for await (const chunk of stream) {
              fullResponse += chunk;
              // Update state with the streaming content for a live effect
              setGeneratedContents(prev => {
                  const newContents = [...prev];
                  newContents[0] = (newContents[0] || '') + chunk;
                  return newContents;
              });
          }
          // Once streaming is complete, process for variations
          const finalVariations = fullResponse.split('[---VARIATION_SEPARATOR---]').map(v => v.trim()).filter(Boolean);
          setGeneratedContents(finalVariations.length > 0 ? finalVariations : [fullResponse]);
          await handleGenerationResult(fullResponse, topic, selectedTemplate.name);
      }
    } catch (e: any) {
        const errorMessage = e.message || "An unknown error occurred during generation.";
        addToast(errorMessage, 'error');

        if (selectedTemplate.id === ContentType.AIVideoGenerator && errorMessage.includes('Your API key is invalid')) {
            setVeoKeyCheckError('Your API key may be invalid. Please re-select it.');
            setIsVeoKeySelected(false);
        }
    } finally {
      setIsLoading(false);
      setVideoStatus('');
    }
  }, [topic, tone, selectedTemplate, extraFields, currentUser, brandProfile, handleGenerationResult, uploadedImage, isVeoKeySelected, numOutputs, addToast]);

  const generatedContent = useMemo(() => generatedContents[activeVariation] || '', [generatedContents, activeVariation]);

  const handleCopy = useCallback((content: string, templateName: string, itemTopic?: string) => {
    const currentTopic = itemTopic || topic;
    
    if (templateName.includes("Image") || templateName.includes("Video") || templateName.includes("Resonance")) {
        if(currentTopic) {
            navigator.clipboard.writeText(currentTopic);
            addToast('Prompt copied to clipboard!');
        }
    } else if (content) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = markdownToHtml(content).replace(/<br\s*\/?>/gi, '\n');
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      navigator.clipboard.writeText(plainText);
      addToast('Content copied to clipboard!');
    }
  }, [addToast, topic]);
  
  const handleReuse = useCallback((item: HistoryItem) => {
    const template = templates.find(t => t.name === item.templateName);
    if (!template) return;

    if (template.id === ContentType.Campaign || template.id === ContentType.AIVideoGenerator) {
        return;
    }

    // Common setup
    setActiveTab('tools');
    setTopic(item.topic);
    setSelectedTemplate(template);
    
    // Clear all content/file state first to avoid stale data from other tools
    setGeneratedContents([]);
    setUploadedImage(null);
    setOriginalImageUrl(null);
    
    // Apply the reused item's state based on template type
    if (template.id === ContentType.AIImageEditor) {
        const dataUrl = item.content;
        const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
        const base64Data = dataUrl.split(',')[1];
        const fileForEditing: UploadedFile = {
            data: base64Data, mimeType, name: `reused.jpg`, dataUrl
        };
        // Set the image for the file input to enable editing
        setUploadedImage(fileForEditing);
        // Also display the image in the output canvas, to match the reuse behavior of the Marketing Image tool.
        setGeneratedContents([item.content]);
    } else {
        const isTextTemplate = template.prompt !== undefined || template.id === ContentType.ResonanceEngine;
        const variations = item.content.split('[---VARIATION_SEPARATOR---]').map(v => v.trim()).filter(Boolean);
        
        if (isTextTemplate && variations.length > 1) {
            setGeneratedContents(variations);
            setNumOutputs(variations.length > 3 ? 3 : variations.length);
            setActiveVariation(0);
        } else {
            // This handles AIImage, single-variation text outputs, and old history items.
            const contentToShow = variations.length > 0 ? variations[0] : item.content;
            setGeneratedContents([contentToShow]);
            setNumOutputs(1);
            setActiveVariation(0);
        }
    }

    window.scrollTo(0, 0);
  }, [templates]);
  
  const handleEdit = useCallback((item: HistoryItem) => {
    const editTemplate = templates.find(t => t.id === ContentType.AIImageEditor);
    if (!editTemplate) return;

    // 1. Navigate to the editor tool
    setActiveTab('tools');
    setSelectedTemplate(editTemplate);

    // 2. Clear previous states to ensure a clean slate
    setTopic('');
    setGeneratedContents([]);
    
    // 3. Prepare and load the image from history
    const dataUrl = item.content;
    const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
    const base64Data = dataUrl.split(',')[1];
    const fileForEditing: UploadedFile = {
        data: base64Data, mimeType, name: `editing-${item.id.substring(0, 5)}.jpg`, dataUrl
    };
    
    // 4. Set the states required by the ImageEditorLayout
    setUploadedImage(fileForEditing);
    setOriginalImageUrl(fileForEditing.dataUrl); // This sets the 'before' image in the comparator

    window.scrollTo(0, 0);
  }, [templates]);


  const handleSelectVeoKey = async () => {
    if (window.aistudio) {
        try {
            await window.aistudio.openSelectKey();
            setIsVeoKeySelected(true); 
            setVeoKeyCheckError('');
        } catch (error) {
            console.error("Error opening API key selection:", error);
            addToast('Could not open the API key selector.', 'error');
        }
    }
  };

  const contentStats = useMemo(() => {
    if (!generatedContent || selectedTemplate.id === ContentType.AIImage || selectedTemplate.id === ContentType.AIImageEditor || selectedTemplate.id === ContentType.AIVideoGenerator || selectedTemplate.id === ContentType.ResonanceEngine) return { words: 0, chars: 0 };
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = markdownToHtml(generatedContent).replace(/<br\s*\/?>/gi, ' ');
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const chars = plainText.length;
    const words = plainText.trim().split(/\s+/).filter(Boolean).length;
    return { words, chars };
  }, [generatedContent, selectedTemplate]);

  const handleUpgrade = async () => {
    try {
        const updatedUserData = { ...currentUser, plan: 'pro' as const };
        await updateUserDoc(currentUser.uid, { plan: 'pro' });
        setCurrentUser(updatedUserData); // Update local state immediately for responsiveness
        setShowUpgradeModal(false);
        addToast("Upgrade successful! Welcome to the Pro plan.", "success");
    } catch (error) {
        console.error("Failed to upgrade plan:", error);
        addToast("Upgrade failed. Please try again.", "error");
        setShowUpgradeModal(false);
    }
  };

  const handleCommand = async (command: string) => {
    setCommandLoading(true);
    setCommandError(null);
    try {
        const result = await routeUserIntent(command);
        const targetTemplate = templates.find(t => t.name.replace(/\s/g, '') === result.toolId);

        if (targetTemplate) {
            handleTemplateSelect(targetTemplate);
            // Use a timeout to ensure state update from handleTemplateSelect has propagated
            setTimeout(() => {
                setTopic(result.prefill.topic);
                if (result.prefill.platform && targetTemplate.id === ContentType.SocialMediaPost) {
                    setExtraFields(prev => ({ ...prev, platform: result.prefill.platform || 'Twitter' }));
                }
            }, 50);

        } else {
            throw new Error(`Could not find a tool matching the ID: ${result.toolId}`);
        }
    } catch (e: any) {
        setCommandError(e.message || "Failed to understand your command. Please try rephrasing.");
    } finally {
        setCommandLoading(false);
    }
  };
  
  const ToolsPanel = ({ isMobile = false }) => (
    <aside className={`p-6 flex flex-col flex-shrink-0 bg-slate-900/80 backdrop-blur-sm ${isMobile ? 'w-64' : 'w-64'} h-full`}>
        <h2 className="text-xl font-bold text-white mb-6">Tools</h2>
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 -mr-2">
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className={`flex items-center w-full p-3 rounded-lg text-left transition-colors duration-200 text-slate-300 hover:bg-slate-800/60 relative ${
              selectedTemplate.id === template.id && activeTab === 'tools' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            {selectedTemplate.id === template.id && activeTab === 'tools' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-r-full"></div>}
            <template.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">{template.name}</span>
                {template.isPro && <ProFeatureBadge />}
            </div>
          </button>
        ))}
        </nav>
        <div className="mt-auto flex-shrink-0 pt-6 border-t border-slate-800">
            <UsageUpgradeCard user={currentUser} onUpgrade={() => setShowUpgradeModal(true)} />
        </div>
    </aside>
  );

  const renderToolLayout = () => {
    // Profile check for features that need it
    if ((selectedTemplate.id === ContentType.ResonanceEngine || selectedTemplate.id === ContentType.Campaign) && !isProfileComplete) {
        if (isProfileComplete === null) {
             return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gradient-end)]"></div></div>;
        }
        return <CompleteProfilePrompt featureName={selectedTemplate.name} onNavigate={() => handleNavigateToSettings('tools')} />;
    }
      
    switch (selectedTemplate.id) {
        case ContentType.AIImage:
        case ContentType.SocialMediaPost:
        case ContentType.VideoScriptHook:
        case ContentType.BlogIdea:
        case ContentType.EmailCopy:
        case ContentType.AdCopy:
        case ContentType.ResonanceEngine:
            return <TextGeneratorLayout 
                selectedTemplate={selectedTemplate}
                topic={topic} setTopic={setTopic}
                tone={tone} setTone={setTone}
                tones={tones}
                extraFields={extraFields} handleFieldChange={handleFieldChange}
                isLoading={isLoading}
                handleGenerate={handleGenerate}
                generatedContent={generatedContent}
                contentStats={contentStats}
                handleCopy={handleCopy}
                // Variation props
                numOutputs={numOutputs}
                setNumOutputs={setNumOutputs}
                generatedContents={generatedContents}
                activeVariation={activeVariation}
                setActiveVariation={setActiveVariation}
            />;
        case ContentType.AIImageEditor:
             return <ImageEditorLayout 
                selectedTemplate={selectedTemplate}
                topic={topic} setTopic={setTopic}
                isLoading={isLoading}
                handleGenerate={handleGenerate}
                generatedContent={generatedContent} // Image editor only produces one output
                handleCopy={handleCopy}
                uploadedImage={uploadedImage}
                handleFileSelect={handleFileSelect}
                originalImageUrl={originalImageUrl}
            />;
        case ContentType.AIVideoGenerator:
            return <VideoGeneratorLayout
                selectedTemplate={selectedTemplate}
                user={currentUser}
                topic={topic} setTopic={setTopic}
                extraFields={extraFields} handleFieldChange={handleFieldChange}
                isLoading={isLoading}
                handleGenerate={handleGenerate}
                videoStatus={videoStatus} videoUrl={videoUrl}
                handleCopy={handleCopy}
                uploadedImage={uploadedImage}
                handleFileSelect={handleFileSelect}
                isVeoKeySelected={isVeoKeySelected}
                handleSelectVeoKey={handleSelectVeoKey}
                veoKeyCheckError={veoKeyCheckError}
            />;
        case ContentType.Campaign:
             return <CampaignBuilder 
                template={selectedTemplate} 
                user={currentUser}
                onUpgrade={() => setShowUpgradeModal(true)}
                onNavigateToSettings={() => handleNavigateToSettings('tools')}
                onNavigateToHistory={handleNavigateToCampaignHistory}
            />
        default:
            return <div>Selected template not configured.</div>
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeDashboard 
                    user={currentUser} 
                    onSelectTemplate={handleTemplateSelect} 
                    templates={templates} 
                    onUpgrade={() => setShowUpgradeModal(true)}
                    onTabChange={handleTabChange}
                />;
      case 'tools':
        return (
            <div className="flex flex-col gap-6 md:flex-1 md:h-full">
                <CommandBar onCommand={handleCommand} isLoading={commandLoading} error={commandError} />
                <div className="md:flex-1 md:min-h-0">
                    {renderToolLayout()}
                </div>
            </div>
        );
      case 'live-agent':
        return <LiveAgentView user={currentUser} />;
      case 'agents':
        return <AgentManager user={currentUser} onUpgrade={() => setShowUpgradeModal(true)} onNavigateToSettings={() => handleNavigateToSettings('agents')} />;
      case 'analytics':
        return <AnalyticsDashboard user={currentUser} />;
      case 'settings':
        return <SettingsView user={currentUser} onUserUpdate={setCurrentUser} onSaveSuccess={handleSettingsSaveSuccess} />;
      case 'history':
        return <HistoryView user={currentUser} onReuse={handleReuse} onCopy={handleCopy} onEdit={handleEdit} initialTab={initialHistoryTab} />;
      default:
        return null;
    }
  };


  return (
    <div className="flex h-screen bg-[#0D1117] text-white overflow-hidden">
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} />}
      
      {/* Main Navigation Rail - Desktop */}
      <aside className="hidden md:flex w-20 bg-slate-900/80 backdrop-blur-sm p-2 border-r border-slate-800/50 flex-col items-center flex-shrink-0 z-20">
          <div className="my-2">
            <SynapseLogo className="w-9 h-9" />
          </div>
          <nav className="flex-1 flex flex-col items-center gap-4 mt-8">
            <Tooltip text="Home">
                <button onClick={() => handleTabChange('home')} className={`p-3 rounded-lg transition-colors ${activeTab === 'home' ? 'bg-gradient-to-t from-[var(--gradient-start)] to-[var(--gradient-end)] text-white' : 'text-slate-400 hover:bg-slate-800'}`} aria-label="Home">
                <HomeIcon className="w-6 h-6"/>
                </button>
            </Tooltip>
             <Tooltip text="Tools">
                <button onClick={() => handleTabChange('tools')} className={`p-3 rounded-lg transition-colors ${activeTab === 'tools' ? 'bg-gradient-to-t from-[var(--gradient-start)] to-[var(--gradient-end)] text-white' : 'text-slate-400 hover:bg-slate-800'}`} aria-label="Tools">
                <SparklesIcon className="w-6 h-6" />
                </button>
            </Tooltip>
            <Tooltip text="AI Command">
                <button onClick={() => handleTabChange('live-agent')} className={`p-3 rounded-lg transition-colors ${activeTab === 'live-agent' ? 'bg-gradient-to-t from-[var(--gradient-start)] to-[var(--gradient-end)] text-white' : 'text-slate-400 hover:bg-slate-800'}`} aria-label="AI Command">
                <HeadsetIcon className="w-6 h-6"/>
                </button>
            </Tooltip>
             <Tooltip text="Agents">
                <button onClick={() => handleTabChange('agents')} className={`p-3 rounded-lg transition-colors ${activeTab === 'agents' ? 'bg-gradient-to-t from-[var(--gradient-start)] to-[var(--gradient-end)] text-white' : 'text-slate-400 hover:bg-slate-800'}`} aria-label="Agents">
                <AgentIcon className="w-6 h-6"/>
                </button>
            </Tooltip>
             <Tooltip text="Analytics">
                <button onClick={() => handleTabChange('analytics')} className={`p-3 rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-gradient-to-t from-[var(--gradient-start)] to-[var(--gradient-end)] text-white' : 'text-slate-400 hover:bg-slate-800'}`} aria-label="Analytics">
                <AnalyticsIcon className="w-6 h-6"/>
                </button>
            </Tooltip>
            <Tooltip text="History">
                <button onClick={() => handleTabChange('history')} className={`p-3 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-gradient-to-t from-[var(--gradient-start)] to-[var(--gradient-end)] text-white' : 'text-slate-400 hover:bg-slate-800'}`} aria-label="History">
                <HistoryIcon className="w-6 h-6"/>
                </button>
            </Tooltip>
          </nav>
          <div className="mt-auto mb-2 relative">
             <UserProfile user={currentUser} onLogout={onLogout} onSettingsClick={() => handleTabChange('settings')} />
          </div>
      </aside>

      {/* Mobile Tools Drawer */}
      <div className={`fixed inset-0 z-40 transition-opacity md:hidden ${isToolsDrawerOpen ? 'bg-black/60' : 'bg-transparent pointer-events-none'}`} onClick={() => setIsToolsDrawerOpen(false)}>
        <div className={`fixed inset-y-0 left-0 border-r border-slate-800/50 transition-transform transform ${isToolsDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
            <ToolsPanel isMobile={true}/>
        </div>
      </div>

      {/* Sub Navigation Panel (for Tools) - Desktop */}
      {activeTab === 'tools' && (
        <div className="hidden md:flex border-r border-slate-800/50">
            <ToolsPanel />
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col overflow-y-auto pb-24 md:pb-8">
        {renderContent()}
      </main>

      <BottomNavBar 
        user={currentUser} 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onToggleToolsDrawer={() => setIsToolsDrawerOpen(true)}
        onLogout={onLogout}
      />
    </div>
  );
};

export default Dashboard;
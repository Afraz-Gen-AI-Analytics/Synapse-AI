
import React, { useState, useCallback, useMemo, useEffect, useContext } from 'react';
import { ContentType, Template, HistoryItem, User, ToolRoute, BrandProfile, ContentRecommendation, ViralVideoBlueprint } from '../types';
import { 
    generateContentStream, 
    generateImage, 
    editImage, 
    generateVideo, 
    getVideosOperation,
    routeUserIntent,
    getResonanceFeedback,
    getMarketSignalAnalysis,
    generateSocialPost
} from '../services/geminiService';
import { 
    updateUserDoc,
    FREEMIUM_CREDIT_LIMIT,
    PRO_CREDIT_LIMIT,
    addHistoryDoc,
    getBrandProfile,
    isBrandProfileComplete,
    deductCredits,
    addCredits
} from '../services/firebaseService';
import { useToast } from '../contexts/ToastContext';
import { AuthContext } from '../App';
import OnboardingWizard from './OnboardingWizard';

import SocialIcon from './icons/SocialIcon';
import BlogIcon from './icons/BlogIcon';
import EmailIcon from './icons/EmailIcon';
import PaintBrushIcon from './icons/PaintBrushIcon';
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
import SignalIcon from './icons/SignalIcon';
import ViralVideoIdeaIcon from './icons/ViralVideoIdeaIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import Tooltip from './Tooltip';

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
import AnalyzerLayout from './layouts/AnalyzerLayout';
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
                return reject(new Error('Image is too large to save to history, even after compression.'));
            }

            resolve(compressedDataUrl);
        };
        img.onerror = (err) => {
            console.error("Image load error for compression:", err);
            reject(new Error('Failed to load image for compression'));
        };
    });
};

const tones = ["Professional", "Casual", "Witty", "Enthusiastic", "Bold"];

const templates: Template[] = [
  {
    id: ContentType.Campaign,
    name: "Campaign Builder",
    description: "Deploy a complete, multi-channel marketing strategy from a single goal.",
    icon: CampaignIcon,
    isPro: true,
    creditCost: 25,
  },
  {
    id: ContentType.ResonanceEngine,
    name: "Resonance Engine",
    description: "Simulate audience reactions and get predictive feedback before publishing.",
    icon: ResonanceIcon,
    isPro: true,
    placeholder: "Paste your social media post, email, or ad copy here to test its resonance with your target audience...",
    fields: [
      { name: "contentGoal", label: "Content Goal", options: ["Raise Awareness", "Drive Engagement", "Generate Leads", "Drive Sales", "Educate or Inform"], defaultValue: "Raise Awareness" },
      { name: "platform", label: "Platform / Format", options: ["Social Media (General)", "X / Twitter Post", "LinkedIn Post", "Email Subject Line", "Email Body", "Ad Headline", "Ad Body", "Landing Page Headline"], defaultValue: "Social Media (General)" },
      { name: "emotion", label: "Key Emotion to Evoke", options: ["Urgency", "Curiosity", "Trust", "Excitement", "FOMO", "Inspiration", "Joy"], defaultValue: "Curiosity" }
    ],
    creditCost: 20,
  },
   {
    id: ContentType.MarketSignalAnalyzer,
    name: "Market Signal Analyzer",
    description: "Research trends, audience questions, and competitor angles for any topic.",
    icon: SignalIcon,
    isPro: true,
    placeholder: "Enter a topic to find trends, audience questions & content gaps. e.g., 'sustainable travel in Southeast Asia'",
    fields: [
      { name: "targetAudience", label: "Target Audience", placeholder: "e.g., B2B SaaS founders" },
      { name: "industry", label: "Industry / Niche", options: ["General", "Technology / SaaS", "E-commerce / Retail", "Health & Wellness", "Finance & Fintech", "Education", "Marketing & Advertising"], defaultValue: "General" },
      { name: "analysisGoal", label: "Primary Goal for this Analysis", options: ["Find content ideas", "Understand competitors", "Identify customer pain points", "Explore new market opportunities"], defaultValue: "Find content ideas" },
    ],
    creditCost: 20,
  },
  {
    id: ContentType.BlogIdea,
    name: "SEO Content Strategist",
    description: "Generate a complete SEO blueprint: titles, keywords, outline, and more.",
    icon: BrainCircuitIcon,
    placeholder: "e.g., 'How to start a successful podcast in 2024'",
    fields: [
      { name: "targetAudience", label: "Target Audience", placeholder: "e.g., 'Beginner podcasters and content creators'" },
      { name: "contentGoal", label: "Content Goal", options: ["Rank on Google (SEO)", "Drive Social Shares", "Convert Readers (Lead Gen)", "Build Thought Leadership"], defaultValue: "Rank on Google (SEO)" },
      { name: "tone", label: "Tone of Voice", options: tones, defaultValue: "Professional" }
    ],
    creditCost: 15,
  },
  {
    id: ContentType.AIAdCreativeStudio,
    name: "AI Ad Creative Studio",
    description: "Brainstorm marketing angles and generate complete ad creative packages.",
    icon: PaintBrushIcon,
    placeholder: "e.g., 'A high-performance running shoe for trail enthusiasts'",
    fields: [
      { name: "platform", label: "Ad Platform", options: ["Facebook/Instagram", "Google Ads", "LinkedIn Ads"], defaultValue: "Facebook/Instagram" },
      { name: "targetAudience", label: "Target Audience", placeholder: "e.g., 'Millennial urban commuters'" },
      { name: "tone", label: "Tone of Voice", options: tones, defaultValue: "Professional" },
    ],
    isPro: false,
    creditCost: 15,
  },
  {
    id: ContentType.AIImage,
    name: "AI Image Generator",
    description: "Generate high-impact images for ads, social media, and websites.",
    icon: ImageIcon,
    placeholder: "e.g., A vibrant banner ad for a summer sale on sunglasses, 16:9 aspect ratio",
    fields: [
      { name: "aspectRatio", label: "Aspect Ratio", options: ["1:1", "16:9", "9:16", "4:3", "3:4"], defaultValue: "1:1" },
      { name: "style", label: "Image Style", options: ["Photorealistic", "Studio Level", "3D Render", "Graphic Illustration", "Minimalist"], defaultValue: "Photorealistic" }
    ],
    creditCost: 10,
  },
   {
    id: ContentType.AIImageEditor,
    name: "AI Image Editor",
    description: "Edit and transform your images with simple text commands.",
    icon: EditImageIcon,
    placeholder: "e.g., Add the text '50% OFF' in a bold, modern font to the top left corner",
    creditCost: 5,
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
    creditCost: 50,
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
    creditCost: 2,
  },
  {
    id: ContentType.VideoScriptHook,
    name: "Viral Video Blueprint",
    description: "Generate a complete strategic blueprint for a viral short-form video, including hook, script, visuals, and audio.",
    icon: ViralVideoIdeaIcon,
    placeholder: "e.g., How to save money on groceries",
    fields: [
      { name: "platform", label: "Target Platform", options: ["TikTok", "Instagram Reels", "YouTube Shorts"], defaultValue: "TikTok" },
      { name: "hookStyle", label: "Hook Style", options: ["Controversial", "Question", "Storytelling", "Problem/Agitator", "Secret/Hack"], defaultValue: "Controversial" },
      { name: "tone", label: "Tone of Voice", options: tones, defaultValue: "Casual" },
    ],
    isPro: false,
    creditCost: 15,
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

${numOutputs > 1 ? `IMPORTANT: Use "[---VARIATION_SEPARATOR---]" on a new line with nothing else on it to separate each distinct email variation.'` : ''}

**Purpose:** "${topic}"`,
    creditCost: 2,
  },
];

type UploadedFile = { data: string; mimeType: string; name: string; dataUrl: string };

type Tab = 'home' | 'tools' | 'live-agent' | 'agents' | 'history' | 'analytics' | 'settings';

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { user, setUser } = useContext(AuthContext);

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);
  const { addToast } = useToast();
  
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null); // For Image Comparator
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // State for Command Bar
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);

  // State for features requiring brand profile
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);

  // State for redirecting after settings save
  const [navigationSource, setNavigationSource] = useState<Tab | null>(null);

  // State for reusing analyzer reports
  const [reusedReportData, setReusedReportData] = useState<any | null>(null);

  const spendCredits = useCallback(async (amount: number): Promise<boolean> => {
      if (!user || !setUser) return false;
      
      // 1. Immediate client-side check
      if (user.credits < amount) {
          setShowUpgradeModal(true);
          return false;
      }
      
      // 2. Optimistic UI update to make the app feel fast
      const previousCredits = user.credits;
      const optimisticNewCredits = user.credits - amount;
      setUser({ ...user, credits: optimisticNewCredits });

      try {
          // 3. Perform atomic transaction on server
          const newBalance = await deductCredits(user.uid, amount);
          
          // 4. Sync with authoritative server balance
          setUser(prev => prev ? ({ ...prev, credits: newBalance }) : null);
          return true;
      } catch (error: any) {
          console.error("Credit deduction failed:", error);
          
          // 5. Revert UI on failure
          setUser(prev => prev ? ({ ...prev, credits: previousCredits }) : null);
          
          if (error.message === 'Insufficient credits') {
             setShowUpgradeModal(true);
             addToast("Not enough credits. Please top up.", "error");
          } else {
             addToast("Transaction failed. Please try again.", "error");
          }
          return false;
      }
  }, [user, setUser, addToast]);


  useEffect(() => {
    if (user) {
        getBrandProfile(user.uid).then(profile => {
            setBrandProfile(profile);
            setIsProfileComplete(isBrandProfileComplete(profile));
        });
    }
  }, [user]);

  // Effect to pre-fill extraFields when brandProfile loads if they are currently empty
  useEffect(() => {
      if (brandProfile) {
          setExtraFields(prev => {
               // If targetAudience is missing in the current fields but exists in the profile, add it.
               if (!prev.targetAudience && brandProfile.targetAudience) {
                   return { ...prev, targetAudience: brandProfile.targetAudience };
               }
               return prev;
          });
      }
  }, [brandProfile]);

  const handleOnboardingComplete = useCallback(async () => {
    if (!user || !setUser) return;
    try {
        const profile = await getBrandProfile(user.uid);
        const profileIsComplete = isBrandProfileComplete(profile);

        if (profileIsComplete && !user.brandProfileBonusClaimed) {
            const BONUS_CREDITS = 10;
            
            // Explicitly update planCreditLimit to maintain robustness
            await addCredits(user.uid, BONUS_CREDITS, undefined, user.planCreditLimit + BONUS_CREDITS);
            
            await updateUserDoc(user.uid, { 
                onboardingCompleted: true,
                brandProfileBonusClaimed: true 
            });
            
            // Optimistic update
             setUser(prev => prev ? ({ 
                ...prev, 
                onboardingCompleted: true,
                credits: prev.credits + BONUS_CREDITS,
                planCreditLimit: prev.planCreditLimit + BONUS_CREDITS,
                brandProfileBonusClaimed: true, 
            }) : null);

            addToast(`Setup complete! We've added ${BONUS_CREDITS} bonus credits for finishing your profile. ✨`, "success");
        } else {
            await updateUserDoc(user.uid, { onboardingCompleted: true });
            setUser({ ...user, onboardingCompleted: true });
            addToast("Setup complete! Welcome to your command center.", "success");
        }
    } catch (error) {
        console.error("Onboarding error:", error);
        addToast("There was an error completing your setup. Please try again.", "error");
    }
  }, [user, setUser, addToast]);

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

  const handleSettingsSaveSuccess = async () => {
      if (!user) return;
      
      // Re-fetch brand profile to get the latest data
      try {
          const updatedProfile = await getBrandProfile(user.uid);
          if (updatedProfile) {
              setBrandProfile(updatedProfile);
              setIsProfileComplete(isBrandProfileComplete(updatedProfile));
          }
      } catch (error) {
          console.error("Failed to re-fetch brand profile after save:", error);
          addToast("Could not refresh brand profile data.", "error");
      }
      
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
    setReusedReportData(null);
    setActiveTab('tools');
    setIsToolsDrawerOpen(false); // Close drawer on mobile after selection
    
    // Set initial fields
    let initialFields: { [key: string]: string } = {};
    if (template.fields) {
        initialFields = template.fields.reduce((acc, field) => {
          acc[field.name] = field.defaultValue || (field.options ? field.options[0] : '');
          return acc;
        }, {} as { [key: string]: string });
    }

    // Pre-fill audience for SEO Content Strategist if brand profile exists
    if (template.id === ContentType.BlogIdea && brandProfile) {
        initialFields['targetAudience'] = brandProfile.targetAudience;
    }

    // Pre-fill audience for Market Signal Analyzer if brand profile exists
    if (template.id === ContentType.MarketSignalAnalyzer && brandProfile) {
        initialFields['targetAudience'] = brandProfile.targetAudience;
    }

    // Pre-fill audience for Ad Creative Studio if brand profile exists
    if (template.id === ContentType.AIAdCreativeStudio && brandProfile) {
        initialFields['targetAudience'] = brandProfile.targetAudience;
    }

    setExtraFields(initialFields);

  }, [brandProfile]);
  
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
  
  const handleGenerationResult = useCallback(async (result: string, genTopic: string, templateName: string, originalContentDataUrl?: string) => {
    if (!user) return;
    try {
        const isImageTemplate = templateName === "AI Image Generator" || templateName === "AI Image Editor";
        let contentToSave = result;

        if (isImageTemplate && result.startsWith('data:image')) {
            try {
                contentToSave = await compressImageForHistory(result);
            } catch (compressionError: any) {
                console.error("Image compression failed for history:", compressionError);
                addToast("Image generated, but it's too large to save to history.", "info");
                return; // Don't save to history if compression fails
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

        const isAnalyzer = ["Resonance Engine", "Market Signal Analyzer", "SEO Content Strategist", "AI Ad Creative Studio", "Viral Video Blueprint"].includes(templateName);
        const historyItem: Omit<HistoryItem, 'id'> = {
            userId: user.uid,
            templateName: templateName,
            content: contentToSave,
            topic: genTopic,
            timestamp: new Date().toISOString(),
        };

        if (isAnalyzer) {
            historyItem.fields = extraFields;
        }

        if (templateName === "AI Image Editor" && originalContentDataUrl) {
            try {
                const compressedOriginal = await compressImageForHistory(originalContentDataUrl);
                historyItem.originalContent = compressedOriginal;
            } catch (compressionError) {
                console.warn("Could not save original image to history due to compression error:", compressionError);
            }
        }
        
        await addHistoryDoc(user.uid, historyItem);
        
    } catch (err: any) {
        console.error("Failed to save history item:", err);
        if (err.message && err.message.includes('longer than 1048487 bytes')) {
            addToast("Failed to save: The generated content is too large for the database.", "error");
        } else {
             addToast("Could not save generation to history.", "error");
        }
    }
  }, [user, addToast, extraFields]);

  const handleGenerate = useCallback(async () => {
    if (!topic) {
      addToast("Please enter a topic or prompt to generate content.", "error");
      return;
    }
    if (!user) return;
    
    if (selectedTemplate.isPro && user.plan === 'freemium') {
        setShowUpgradeModal(true);
        return;
    }
    
    const cost = (selectedTemplate.creditCost || 1) * (selectedTemplate.supportsVariations ? numOutputs : 1);
    
    // Check credits without spending them yet.
    if (user.credits < cost) {
        addToast(`Not enough credits. This action costs ${cost} credits.`, "error");
        setShowUpgradeModal(true);
        return;
    }
    
    if (selectedTemplate.id === ContentType.AIImageEditor && !uploadedImage) {
        addToast("Please upload an image to edit.", "error");
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
        case ContentType.AIImage:
            fullResponse = await generateImage(topic, (extraFields.aspectRatio || '1:1') as any, extraFields.style || 'Photorealistic');
            if (!await spendCredits(cost)) throw new Error("Credit deduction failed.");
            setGeneratedContents([fullResponse]);
            await handleGenerationResult(fullResponse, topic, selectedTemplate.name);
            break;
        case ContentType.AIImageEditor:
            if (!uploadedImage) throw new Error("No image uploaded.");
            fullResponse = await editImage(uploadedImage.data, uploadedImage.mimeType, topic);
            if (!await spendCredits(cost)) throw new Error("Credit deduction failed.");
            setGeneratedContents([fullResponse]);
            await handleGenerationResult(fullResponse, topic, selectedTemplate.name, uploadedImage.dataUrl);
            break;
        case ContentType.AIVideoGenerator:
            setVideoStatus('Initializing...');
            const videoConfig = { aspectRatio: extraFields.aspectRatio, resolution: extraFields.resolution };
            let operation = await generateVideo(topic, uploadedImage, videoConfig);
            if (!await spendCredits(cost)) throw new Error("Credit deduction failed.");
            
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
        case ContentType.SocialMediaPost: {
            const posts = await generateSocialPost({ 
                topic, 
                tone, 
                platform: extraFields.platform as 'Twitter' | 'LinkedIn' | 'Facebook', 
                numOutputs 
            });
            if (!await spendCredits(cost)) throw new Error("Credit deduction failed.");

            const stringifiedPosts = posts.map(p => JSON.stringify(p));
            setGeneratedContents(stringifiedPosts);
            await handleGenerationResult(stringifiedPosts.join('[---VARIATION_SEPARATOR---]'), topic, selectedTemplate.name);
            break;
        }
        default:
          if(selectedTemplate.prompt) {
            const prompt = selectedTemplate.prompt({ topic, tone, fields: extraFields, numOutputs });
            const stream = generateContentStream(prompt);
            let creditsSpentThisTurn = false;

            for await (const chunk of stream) {
                const textChunk = chunk;
                // Spend credits on the first successful chunk with text.
                if (!creditsSpentThisTurn && textChunk && textChunk.trim()) {
                    if (!await spendCredits(cost)) {
                        addToast("Credit deduction failed. Stopping generation.", "error");
                        break; // Stop processing stream if credit spend fails
                    }
                    creditsSpentThisTurn = true;
                }
                
                if (textChunk) { // Only process if there's text
                    fullResponse += textChunk;
                    setGeneratedContents(prev => {
                        const newContents = [...prev];
                        newContents[0] = (newContents[0] || '') + textChunk;
                        return newContents;
                    });
                }
            }

            // Only process and save if credits were successfully spent
            if (creditsSpentThisTurn) {
                const finalVariations = fullResponse.split('[---VARIATION_SEPARATOR---]').map(v => v.trim()).filter(Boolean);
                setGeneratedContents(finalVariations.length > 0 ? finalVariations : [fullResponse]);
                await handleGenerationResult(fullResponse, topic, selectedTemplate.name);
            } else if (fullResponse.trim() === '') {
                 // If stream completed with no text and credits were not spent
                throw new Error("The AI returned an empty response. Your credits have not been charged.");
            }
          } else {
             throw new Error(`Generation logic for template "${selectedTemplate.name}" is not implemented.`);
          }
      }
    } catch (e: any) {
        // No refund logic needed, as credits are only spent after a successful step.
        const errorMessage = e.message || "An unknown error occurred during generation.";
        addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
      setVideoStatus('');
    }
  }, [topic, tone, selectedTemplate, extraFields, user, handleGenerationResult, uploadedImage, numOutputs, addToast, spendCredits]);

  const generatedContent = useMemo(() => generatedContents[activeVariation] || '', [generatedContents, activeVariation]);

  const handleCopy = useCallback((content: string, templateName: string, itemTopic?: string) => {
    const currentTopic = itemTopic || topic;
    
    const isAssetGenerationTool = templateName === "AI Image Generator" || templateName === "AI Image Editor" || templateName === "Marketing Video Ad";

    if (isAssetGenerationTool) {
        if(currentTopic) {
            navigator.clipboard.writeText(currentTopic);
            addToast('Prompt copied to clipboard!');
        }
    } else if (content) {
      if (["Resonance Engine", "Market Signal Analyzer", "SEO Content Strategist", "AI Ad Creative Studio", "Viral Video Blueprint"].includes(templateName)) {
          try {
              const data = JSON.parse(content);
              // Simple stringify for now, a more complex report can be built
              const reportText = JSON.stringify(data, null, 2);
              navigator.clipboard.writeText(reportText);
              addToast('Report data copied to clipboard!');
          } catch(e) {
              navigator.clipboard.writeText(content);
              addToast('Content copied to clipboard!');
          }
      } else {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = markdownToHtml(content).replace(/<br\s*\/?>/gi, '\n');
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        navigator.clipboard.writeText(plainText);
        addToast('Content copied to clipboard!');
      }
    }
  }, [addToast, topic]);
  
  const handleReuse = useCallback((item: HistoryItem) => {
    const template = templates.find(t => t.name === item.templateName);
    if (!template) return;
    
    setReusedReportData(null); // Reset by default

    if (template.id === ContentType.Campaign || template.id === ContentType.AIVideoGenerator) {
        return;
    }

    const isAnalyzer = ["Resonance Engine", "Market Signal Analyzer", "SEO Content Strategist", "AI Ad Creative Studio", "Viral Video Blueprint"].includes(template.name);

    if (isAnalyzer) {
        setActiveTab('tools');
        setTopic(item.topic);
        setSelectedTemplate(template);
        if (item.fields) {
            setExtraFields(item.fields);
        }
        
        setGeneratedContents([]);
        setUploadedImage(null);
        setOriginalImageUrl(null);
        
        try {
            setReusedReportData(JSON.parse(item.content));
        } catch (e) {
            addToast("Could not load the previous report data.", "error");
            console.error("Failed to parse reused report data:", e);
        }

        window.scrollTo(0, 0);
        return; // Early return for analyzer tools
    }

    // Existing logic for other tools
    setActiveTab('tools');
    setTopic(item.topic);
    setSelectedTemplate(template);
    
    setGeneratedContents([]);
    setUploadedImage(null);
    setOriginalImageUrl(null);
    
    if (template.id === ContentType.AIImageEditor) {
        if (item.originalContent) {
            const originalMimeType = item.originalContent.substring(item.originalContent.indexOf(':') + 1, item.originalContent.indexOf(';'));
            const originalBase64 = item.originalContent.split(',')[1];
            const fileForEditing: UploadedFile = {
                data: originalBase64,
                mimeType: originalMimeType,
                name: `reused_original_${item.id.substring(0, 5)}.jpg`,
                dataUrl: item.originalContent
            };
            setUploadedImage(fileForEditing);
            setOriginalImageUrl(item.originalContent);
            setGeneratedContents([item.content]);
        } else {
            const dataUrl = item.content;
            const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
            const base64Data = dataUrl.split(',')[1];
            const fileForEditing: UploadedFile = {
                data: base64Data, mimeType, name: `reused_${item.id.substring(0, 5)}.jpg`, dataUrl
            };
            setUploadedImage(fileForEditing);
            setOriginalImageUrl(item.content);
            setGeneratedContents([item.content]);
        }
    } else {
        const isTextTemplate = template.prompt !== undefined || template.id === ContentType.SocialMediaPost;
        const variations = item.content.split('[---VARIATION_SEPARATOR---]').map(v => v.trim()).filter(Boolean);
        
        if (isTextTemplate && variations.length > 1) {
            setGeneratedContents(variations);
            setNumOutputs(variations.length > 3 ? 3 : variations.length);
            setActiveVariation(0);
        } else {
            const contentToShow = variations.length > 0 ? variations[0] : item.content;
            setGeneratedContents([contentToShow]);
            setNumOutputs(1);
            setActiveVariation(0);
        }
    }

    window.scrollTo(0, 0);
  }, [addToast]);
  
  const handleEdit = useCallback((item: HistoryItem) => {
    const editTemplate = templates.find(t => t.id === ContentType.AIImageEditor);
    if (!editTemplate) return;

    setActiveTab('tools');
    setSelectedTemplate(editTemplate);

    setTopic('');
    setGeneratedContents([]);
    
    const dataUrl = item.content;
    const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
    const base64Data = dataUrl.split(',')[1];
    const fileForEditing: UploadedFile = {
        data: base64Data, mimeType, name: `editing-${item.id.substring(0, 5)}.jpg`, dataUrl
    };
    
    setUploadedImage(fileForEditing);
    setOriginalImageUrl(fileForEditing.dataUrl);

    window.scrollTo(0, 0);
  }, []);

  const handleEditGeneratedImage = useCallback((imageDataUrl: string) => {
    const editTemplate = templates.find(t => t.id === ContentType.AIImageEditor);
    if (!editTemplate) {
      addToast("Image Editor tool not found.", "error");
      return;
    }
    setActiveTab('tools');
    setSelectedTemplate(editTemplate);
    setTopic('');
    setGeneratedContents([]);
    const mimeType = imageDataUrl.substring(imageDataUrl.indexOf(':') + 1, imageDataUrl.indexOf(';'));
    const base64Data = imageDataUrl.split(',')[1];
    const fileForEditing: UploadedFile = {
        data: base64Data,
        mimeType,
        name: `generated-for-edit.png`,
        dataUrl: imageDataUrl
    };
    setUploadedImage(fileForEditing);
    setOriginalImageUrl(fileForEditing.dataUrl);
    window.scrollTo(0, 0);
    addToast("Ready to edit your generated image!", "info");
  }, [templates, addToast]);

  const handleGenerateImageFromPrompt = useCallback((prompt: string) => {
    const imageTemplate = templates.find(t => t.id === ContentType.AIImage);
    if (!imageTemplate) {
        addToast("AI Image Generator tool not found.", "error");
        return;
    }
    handleTemplateSelect(imageTemplate);
    setTimeout(() => {
        setTopic(prompt);
    }, 50);
    addToast("Switched to AI Image Generator and pre-filled prompt!", "info");
    window.scrollTo(0, 0);
}, [templates, addToast, handleTemplateSelect]);

 const handleGenerateVideoFromBlueprint = useCallback((blueprint: ViralVideoBlueprint, videoTopic: string) => {
    if (user && user.plan === 'freemium') {
      setShowUpgradeModal(true);
      return;
    }
    
    const videoTemplate = templates.find(t => t.id === ContentType.AIVideoGenerator);
    if (!videoTemplate) {
      addToast("Marketing Video Ad tool not found.", "error");
      return;
    }

    const masterPrompt = `
      Create a short, dynamic video ad based on this blueprint.
      Topic: ${videoTopic}
      Hook: "${blueprint.hookText}"
      Script:
      ${blueprint.scriptOutline.map(step => `- ${step}`).join('\n')}
      Visual Style: ${blueprint.visualConcept}. ${blueprint.pacingAndStyle}
      End with a call to action: "${blueprint.callToAction}"
    `;
    
    handleTemplateSelect(videoTemplate);
    setTimeout(() => {
      setTopic(masterPrompt.trim());
    }, 50);

    addToast("Switched to Marketing Video Ad and pre-filled blueprint!", "info");
    window.scrollTo(0, 0);

  }, [user, templates, addToast, handleTemplateSelect]);

  const handleAnalyzeResonance = useCallback((textToAnalyze: string) => {
    const resonanceTemplate = templates.find(t => t.id === ContentType.ResonanceEngine);
    if (!resonanceTemplate) {
        addToast("Resonance Engine tool not found.", "error");
        return;
    }
    handleTemplateSelect(resonanceTemplate);
    setTimeout(() => {
        setTopic(textToAnalyze);
    }, 50);
    addToast("Switched to Resonance Engine and pre-filled content!", "info");
    window.scrollTo(0, 0);
  }, [templates, addToast, handleTemplateSelect]);


  const contentStats = useMemo(() => {
    if (!generatedContent || selectedTemplate.id === ContentType.AIImage || selectedTemplate.id === ContentType.AIImageEditor || selectedTemplate.id === ContentType.AIVideoGenerator || selectedTemplate.id === ContentType.ResonanceEngine || selectedTemplate.id === ContentType.MarketSignalAnalyzer || selectedTemplate.id === ContentType.SocialMediaPost) return { words: 0, chars: 0 };
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = markdownToHtml(generatedContent).replace(/<br\s*\/?>/gi, ' ');
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const chars = plainText.length;
    const words = plainText.trim().split(/\s+/).filter(Boolean).length;
    return { words, chars };
  }, [generatedContent, selectedTemplate]);

  const handleUpgrade = async () => {
    if (!user || !setUser) return;
    try {
        await addCredits(user.uid, PRO_CREDIT_LIMIT - user.credits, 'pro', PRO_CREDIT_LIMIT);
        
        // Optimistic update
        const newCredits = PRO_CREDIT_LIMIT;
        const newPlanCreditLimit = PRO_CREDIT_LIMIT;
        setUser({ ...user, plan: 'pro' as const, credits: newCredits, planCreditLimit: newPlanCreditLimit });
        
        setShowUpgradeModal(false);
        addToast("Upgrade successful! Welcome to the Pro plan.", "success");
    } catch (error) {
        console.error("Failed to upgrade plan:", error);
        addToast("Upgrade failed. Please try again.", "error");
        setShowUpgradeModal(false);
    }
  };

    const handleBuyCredits = async () => {
        if (!user || !setUser) return;
        try {
            const CREDITS_TO_ADD = 100;
            await addCredits(user.uid, CREDITS_TO_ADD, undefined, user.planCreditLimit + CREDITS_TO_ADD);
            
            // Optimistic update
            setUser({ 
                ...user, 
                credits: user.credits + CREDITS_TO_ADD, 
                planCreditLimit: user.planCreditLimit + CREDITS_TO_ADD 
            });
            
            setShowUpgradeModal(false);
            addToast(`Success! ${CREDITS_TO_ADD} credits have been added to your account.`, "success");
        } catch (error) {
            console.error("Failed to buy credits:", error);
            addToast("Credit purchase failed. Please try again.", "error");
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

  const handlePrefillFromReport = useCallback((recommendation: ContentRecommendation, context?: { [key: string]: any }) => {
    let targetTemplate: Template | undefined;
    const format = recommendation.format.toLowerCase();

    // 1. Blog / Article
    if (format.includes('blog') || format.includes('article')) {
        targetTemplate = templates.find(t => t.id === ContentType.BlogIdea);
    } 
    // 2. Video
    else if (format.includes('video') || format.includes('shorts') || format.includes('reel') || format.includes('tiktok')) {
        targetTemplate = templates.find(t => t.id === ContentType.AIVideoGenerator);
    } 
    // 3. Social
    else if (format.includes('social') || format.includes('linkedin') || format.includes('tweet') || format.includes('facebook') || format.includes('carousel') || format.includes('twitter') || format.includes('thread') || format.includes('post')) {
        targetTemplate = templates.find(t => t.id === ContentType.SocialMediaPost);
    } 
    // 4. Email
    else if (format.includes('email')) {
        targetTemplate = templates.find(t => t.id === ContentType.EmailCopy);
    } 
    // 5. Ad
    else if (format.includes('ad')) {
         targetTemplate = templates.find(t => t.id === ContentType.AIAdCreativeStudio);
    }

    if (targetTemplate) {
        handleTemplateSelect(targetTemplate);
        // Use timeout to ensure state update after template selection re-render
        setTimeout(() => {
            let prefillTopic = recommendation.title;

            if (targetTemplate?.id === ContentType.SocialMediaPost) {
                 let platformName = 'LinkedIn'; // Default fallback
                 let promptPlatform = 'Social Media';
                 
                 // Smart detection
                 if (format.includes('twitter') || format.includes('tweet') || format.includes('thread') || format.includes('x')) {
                     platformName = 'Twitter';
                     promptPlatform = 'Twitter';
                 } else if (format.includes('facebook')) {
                     platformName = 'Facebook';
                     promptPlatform = 'Facebook';
                 } else if (format.includes('linkedin') || format.includes('carousel')) {
                     platformName = 'LinkedIn';
                     promptPlatform = 'LinkedIn';
                 } else {
                     // Generic "Social Media Post" - default to LinkedIn for professional context but keep prompt generic
                     platformName = 'LinkedIn';
                     promptPlatform = 'social media';
                 }

                 prefillTopic = `Write a professional ${promptPlatform} post about "${recommendation.title}"`;
                 if (context?.audience) {
                     prefillTopic += ` targeting ${context.audience}`;
                 }

                 setExtraFields(prev => ({ ...prev, platform: platformName }));
            } 
            else if (targetTemplate?.id === ContentType.BlogIdea) {
                // Professional prompt for SEO Content Strategist
                prefillTopic = `Create a comprehensive SEO content blueprint for a blog post about "${recommendation.title}"`;
                if (context?.audience) {
                    setExtraFields(prev => ({ ...prev, targetAudience: context.audience }));
                }
            }
            else if (targetTemplate?.id === ContentType.AIVideoGenerator) {
                // Professional prompt for Marketing Video Ad
                 prefillTopic = `Create a high-energy, professional marketing video about "${recommendation.title}". Visual style: Cinematic, clean, and engaging for social media.`;
            }

            setTopic(prefillTopic);
            
            // Audience toast is handled implicitly by the context passing now if used

        }, 50);
        addToast(`Switched to ${targetTemplate.name} and pre-filled topic!`, "info");
    } else {
        addToast(`Could not find a matching tool for "${recommendation.format}".`, "error");
    }
  }, [templates, addToast, handleTemplateSelect]);
  
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
            <span className={`font-medium text-sm flex-grow truncate pr-2 ${template.isPro ? 'gradient-text font-semibold' : ''}`}>{template.name}</span>
          </button>
        ))}
        </nav>
        { user && (
            <div className="mt-auto flex-shrink-0 pt-6 border-t border-slate-800">
                <UsageUpgradeCard user={user} onUpgrade={() => setShowUpgradeModal(true)} />
            </div>
        )}
    </aside>
  );

  const renderToolLayout = () => {
    if (!user) return null;
    // Wait for profile to load before rendering tools that depend on it to avoid race conditions
    if ((selectedTemplate.id === ContentType.Campaign || selectedTemplate.id === ContentType.MarketSignalAnalyzer || selectedTemplate.id === ContentType.ResonanceEngine || selectedTemplate.id === ContentType.BlogIdea || selectedTemplate.id === ContentType.AIAdCreativeStudio)) {
        if (isProfileComplete === null) {
             return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gradient-end)]"></div></div>;
        }
        if (isProfileComplete === false) {
            return <CompleteProfilePrompt featureName={selectedTemplate.name} onNavigate={() => handleNavigateToSettings('tools')} />;
        }
    }
      
    switch (selectedTemplate.id) {
        case ContentType.ResonanceEngine:
        case ContentType.MarketSignalAnalyzer:
        case ContentType.BlogIdea:
        case ContentType.AIAdCreativeStudio:
        case ContentType.VideoScriptHook:
             return <AnalyzerLayout 
                key={selectedTemplate.id} // Force re-mount on template change
                selectedTemplate={selectedTemplate} 
                brandProfile={brandProfile!} 
                onPrefill={handlePrefillFromReport}
                onGenerateImage={handleGenerateImageFromPrompt}
                onGenerateVideoFromBlueprint={handleGenerateVideoFromBlueprint}
                onGenerate={handleGenerationResult}
                onUpgrade={() => setShowUpgradeModal(true)}
                user={user}
                reusedReportData={reusedReportData}
                onClearReusedData={() => setReusedReportData(null)}
                tones={tones}
                initialFields={extraFields}
                topic={topic}
                onTopicChange={setTopic}
                spendCredits={spendCredits}
            />;
        case ContentType.AIImage:
        case ContentType.SocialMediaPost:
        case ContentType.EmailCopy:
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
                onEditImage={handleEditGeneratedImage}
                onGenerateImage={handleGenerateImageFromPrompt}
                onAnalyzeResonance={handleAnalyzeResonance}
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
                generatedContent={generatedContent}
                handleCopy={handleCopy}
                uploadedImage={uploadedImage}
                handleFileSelect={handleFileSelect}
                originalImageUrl={originalImageUrl}
                onEditImage={handleEditGeneratedImage}
                // Fix: Pass missing properties
                onGenerateImage={handleGenerateImageFromPrompt}
                onAnalyzeResonance={handleAnalyzeResonance}
            />;
        case ContentType.AIVideoGenerator:
            return <VideoGeneratorLayout
                selectedTemplate={selectedTemplate}
                user={user}
                topic={topic} setTopic={setTopic}
                extraFields={extraFields} handleFieldChange={handleFieldChange}
                isLoading={isLoading}
                handleGenerate={handleGenerate}
                videoStatus={videoStatus} videoUrl={videoUrl}
                handleCopy={handleCopy}
                uploadedImage={uploadedImage}
                handleFileSelect={handleFileSelect}
                onEditImage={handleEditGeneratedImage}
                // Fix: Pass missing properties
                onGenerateImage={handleGenerateImageFromPrompt}
                onAnalyzeResonance={handleAnalyzeResonance}
            />;
        case ContentType.Campaign:
             return <CampaignBuilder 
                template={selectedTemplate} 
                user={user}
                spendCredits={spendCredits}
                onUpgrade={() => setShowUpgradeModal(true)}
                onNavigateToSettings={() => handleNavigateToSettings('tools')}
                onNavigateToHistory={handleNavigateToCampaignHistory}
            />
        default:
            return <div>Selected template not configured.</div>
    }
  }

  const renderContent = () => {
    if (!user) return null;
    switch (activeTab) {
      case 'home':
        return <HomeDashboard 
                    user={user} 
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
        return <LiveAgentView user={user} />;
      case 'agents':
        return <AgentManager 
                    user={user} 
                    onUpgrade={() => setShowUpgradeModal(true)} 
                    onNavigateToSettings={() => handleNavigateToSettings('agents')} 
                    spendCredits={spendCredits}
                />;
      case 'analytics':
        return <AnalyticsDashboard user={user} />;
      case 'settings':
        return <SettingsView user={user} onUserUpdate={(updatedUser) => setUser(updatedUser)} onSaveSuccess={handleSettingsSaveSuccess} />;
      case 'history':
        return <HistoryView user={user} onReuse={handleReuse} onCopy={handleCopy} onEdit={handleEdit} initialTab={initialHistoryTab} />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--gradient-end)]"></div>
        </div>
      );
  }
  
  if (!user.onboardingCompleted) {
    return <OnboardingWizard user={user} onComplete={handleOnboardingComplete} />;
  }


  return (
    <div className="flex h-screen bg-[#0D1117] text-white overflow-hidden">
      {showUpgradeModal && <UpgradeModal user={user} onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} onBuyCredits={handleBuyCredits} />}
      
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
            <Tooltip text="Agents">
                <button onClick={() => handleTabChange('agents')} className={`p-3 rounded-lg transition-colors ${activeTab === 'agents' ? 'bg-gradient-to-t from-[var(--gradient-start)] to-[var(--gradient-end)] text-white' : 'text-slate-400 hover:bg-slate-800'}`} aria-label="Agents">
                <AgentIcon className="w-6 h-6"/>
                </button>
            </Tooltip>
            <Tooltip text="Live Agent">
                <button onClick={() => handleTabChange('live-agent')} className={`p-3 rounded-lg transition-colors ${activeTab === 'live-agent' ? 'bg-gradient-to-t from-[var(--gradient-start)] to-[var(--gradient-end)] text-white' : 'text-slate-400 hover:bg-slate-800'}`} aria-label="Live Agent">
                <HeadsetIcon className="w-6 h-6"/>
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
             <UserProfile user={user} onLogout={onLogout} onSettingsClick={() => handleTabChange('settings')} />
          </div>
      </aside>

      <div className={`fixed inset-0 z-40 transition-opacity md:hidden ${isToolsDrawerOpen ? 'bg-black/60' : 'bg-transparent pointer-events-none'}`} onClick={() => setIsToolsDrawerOpen(false)}>
        <div className={`fixed inset-y-0 left-0 border-r border-slate-800/50 transition-transform transform ${isToolsDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
            <ToolsPanel isMobile={true}/>
        </div>
      </div>

      {activeTab === 'tools' && (
        <div className="hidden md:flex border-r border-slate-800/50">
            <ToolsPanel />
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col overflow-y-auto pb-24 md:pb-8">
        {renderContent()}
      </main>

      <BottomNavBar 
        user={user} 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onToggleToolsDrawer={() => setIsToolsDrawerOpen(true)}
        onLogout={onLogout}
      />
    </div>
  );
};

export default Dashboard;

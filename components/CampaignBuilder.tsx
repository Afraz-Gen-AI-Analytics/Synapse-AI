import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Template, User, BrandProfile, GeneratedContent, SocialPostContent, EmailContent, AdContent, BlogContent, Strategy, CampaignPhase, CampaignAsset } from '../types';
import { generateCampaignStrategy, generateCampaignAsset } from '../services/geminiService';
import { getBrandProfile, isBrandProfileComplete, addCampaignDoc } from '../services/firebaseService';
import { useToast } from '../contexts/ToastContext';
import SocialPostPreview from './previews/SocialPostPreview';
import EmailPreview from './previews/EmailPreview';
import SynapseCoreIcon from './icons/SynapseCoreIcon';
import SpeechToTextInput from './SpeechToTextInput';

import GoalIcon from './icons/GoalIcon';
import PlanIcon from './icons/PlanIcon';
import SparklesIcon from './icons/SparklesIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import CopyIcon from './icons/CopyIcon';
import ExternalLinkIcon from './icons/ExternalLinkIcon';
import CompleteProfilePrompt from './CompleteProfilePrompt';
import PlaybookIcon from './icons/PlaybookIcon';
import ProFeatureBadge from './ProFeatureBadge';
import DiamondIcon from './icons/DiamondIcon';


interface CampaignBuilderProps {
    template: Template;
    user: User;
    spendCredits: (amount: number) => Promise<boolean>;
    onUpgrade: () => void;
    onNavigateToSettings: () => void;
    onNavigateToHistory: () => void;
}

const loadingMessages = [
    "Analyzing goal against market trends...",
    "Consulting brand voice profile...",
    "Mapping key audience segments...",
    "Structuring multi-phase strategic framework...",
    "Defining core marketing channels...",
    "Outlining initial asset requirements...",
    "Finalizing actionable campaign blueprint...",
];

// Stepper component
const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
    const steps = [
        { name: 'Define Goal', icon: GoalIcon },
        { name: 'Review Strategy', icon: PlanIcon },
        { name: 'Build Canvas', icon: SparklesIcon }
    ];

    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center justify-center border border-slate-800 bg-black/20 rounded-full p-2 space-x-2 md:space-x-4 backdrop-blur-sm">
                {steps.map((step, stepIdx) => (
                    <React.Fragment key={step.name}>
                        <li className={`flex items-center gap-2 md:gap-3 px-4 py-2 rounded-full transition-colors duration-300 ${currentStep === stepIdx + 1 ? 'bg-slate-800' : ''}`}>
                            {currentStep > stepIdx + 1 ? (
                                // Completed
                                <>
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex-shrink-0">
                                        <CheckCircleIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-white">{step.name}</span>
                                </>
                            ) : currentStep === stepIdx + 1 ? (
                                // Current
                                <>
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--gradient-end)] flex-shrink-0">
                                        <step.icon className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-white">{step.name}</span>
                                </>
                            ) : (
                                // Upcoming
                                <>
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 flex-shrink-0">
                                        <step.icon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-400">{step.name}</span>
                                </>
                            )}
                        </li>
                        {stepIdx < steps.length - 1 && (
                            <div className="hidden md:block h-6 w-px bg-slate-700" />
                        )}
                    </React.Fragment>
                ))}
            </ol>
        </nav>
    );
};

const AssetCard: React.FC<{ asset: CampaignAsset, brandProfile: BrandProfile | null, onChange: (asset: CampaignAsset) => void }> = ({ asset, brandProfile, onChange }) => {
    const { addToast } = useToast();

    const handleContentChange = (newContent: GeneratedContent) => {
        onChange({ ...asset, content: newContent });
    };

    const copyToClipboard = (text: string, message: string) => {
        navigator.clipboard.writeText(text);
        addToast(message, 'success');
    };

    const renderExecutionToolkit = () => {
        if (!asset.content) return null;

        const openPlatform = () => {
            if (asset.content?.type === 'social') {
                const socialContent = asset.content as SocialPostContent;
                let url = '';
                switch(socialContent.platform) {
                    case 'Twitter': url = 'https://twitter.com/intent/tweet'; break;
                    case 'LinkedIn': url = 'https://www.linkedin.com/feed/?shareActive=true'; break;
                    case 'Facebook': url = 'https://www.facebook.com/'; break;
                }
                if (url) window.open(url, '_blank');
            } else if (asset.content?.type === 'email') {
                const emailContent = asset.content as EmailContent;
                const subject = encodeURIComponent(emailContent.subject);
                const body = encodeURIComponent(emailContent.body);
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
                window.open(gmailUrl, '_blank');
            }
        };

        const getPlatformButtonText = (content: GeneratedContent) => {
            if (content.type === 'social') {
                return `Open ${content.platform === 'Twitter' ? 'X/Twitter' : content.platform}`;
            }
            if (content.type === 'email') {
                return 'Open in Gmail';
            }
            return 'Open Platform';
        };

        let toolkit = null;
        switch (asset.content.type) {
            case 'social':
                const social = asset.content as SocialPostContent;
                toolkit = (
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => copyToClipboard(`${social.copy}\n\n${social.hashtags}`, 'Post text copied!')} className="flex items-center text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-1 px-2.5 rounded-md transition-colors"><CopyIcon className="w-3.5 h-3.5 mr-1.5"/> Copy Text</button>
                        <button onClick={openPlatform} className="flex items-center text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-1 px-2.5 rounded-md transition-colors"><ExternalLinkIcon className="w-3.5 h-3.5 mr-1.5"/> {getPlatformButtonText(asset.content)}</button>
                    </div>
                );
                break;
            case 'email':
                const email = asset.content as EmailContent;
                toolkit = (
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`, 'Email content copied!')} className="flex items-center text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-1 px-2.5 rounded-md transition-colors"><CopyIcon className="w-3.5 h-3.5 mr-1.5"/> Copy Email</button>
                        <button onClick={openPlatform} className="flex items-center text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-1 px-2.5 rounded-md transition-colors"><ExternalLinkIcon className="w-3.5 h-3.5 mr-1.5"/> {getPlatformButtonText(asset.content)}</button>
                    </div>
                );
                break;
             case 'ad':
                const ad = asset.content as AdContent;
                toolkit = (
                     <button onClick={() => copyToClipboard(`Headline: ${ad.headline}\nBody: ${ad.body}`, 'Ad copy copied!')} className="flex items-center text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-1 px-2.5 rounded-md transition-colors"><CopyIcon className="w-3.5 h-3.5 mr-1.5"/> Copy Ad</button>
                );
                break;
            case 'blog':
                const blog = asset.content as BlogContent;
                const blogText = blog.ideas.map(idea => `${idea.title}\n${idea.description}`).join('\n\n');
                 toolkit = (
                     <button onClick={() => copyToClipboard(blogText, 'Blog ideas copied!')} className="flex items-center text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-1 px-2.5 rounded-md transition-colors"><CopyIcon className="w-3.5 h-3.5 mr-1.5"/> Copy Ideas</button>
                );
                break;
        }
        
        if (!toolkit) return null;

        return (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
                <h5 className="text-xs font-semibold text-slate-400 mb-2">Execution Toolkit</h5>
                {toolkit}
            </div>
        )
    };
    
    const renderContent = () => {
        if (!asset.content) return null;
        switch(asset.content.type) {
            case 'social':
                return <SocialPostPreview content={asset.content as SocialPostContent} onChange={handleContentChange} brandProfile={brandProfile} />;
            case 'email':
                return <EmailPreview content={asset.content as EmailContent} onChange={handleContentChange} />;
            case 'ad':
                const adContent = asset.content as AdContent;
                return <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/80">
                    <p className="text-sm font-semibold text-slate-400">Headline</p>
                    <p className="font-bold text-white mb-2">{adContent.headline}</p>
                    <p className="text-sm font-semibold text-slate-400">Body</p>
                    <p className="text-slate-300">{adContent.body}</p>
                </div>
            case 'blog':
                const blogContent = asset.content as BlogContent;
                return <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/80 space-y-3">
                    {blogContent.ideas.map((idea, i) => (
                        <div key={i}>
                            <p className="font-bold text-white">{idea.title}</p>
                            <p className="text-sm text-slate-300">{idea.description}</p>
                        </div>
                    ))}
                </div>
            default: return null;
        }
    };
    
    return (
        <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/80 h-full flex flex-col animate-pop-in transition-all duration-300 hover:border-[var(--gradient-end)]/50 hover:shadow-2xl hover:shadow-[var(--gradient-end)]/10">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-semibold text-white">{asset.contentType}</h4>
                    <p className="text-sm text-slate-400 line-clamp-2 pr-4">{asset.description}</p>
                </div>
                 {asset.status === 'generating' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-t-2 border-transparent border-b-white"></div>}
                 {asset.status === 'error' && <AlertTriangleIcon className="w-4 h-4 text-red-500" />}
            </div>
            <div className="flex-grow flex flex-col justify-center min-h-[100px]">
                {asset.status === 'error' && (
                    <div className="text-center p-4 bg-red-900/20 rounded-lg">
                        <p className="text-red-400 text-xs">{asset.error}</p>
                    </div>
                )}
                {asset.status === 'generated' && renderContent()}
            </div>
            {asset.status === 'generated' && renderExecutionToolkit()}
        </div>
    );
};

const CampaignBuilder: React.FC<CampaignBuilderProps> = ({ template, user, spendCredits, onUpgrade, onNavigateToSettings, onNavigateToHistory }) => {
    const [step, setStep] = useState(1);
    const [campaignGoal, setCampaignGoal] = useState('');
    const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
    const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
    const [strategy, setStrategy] = useState<Strategy | null>(null);
    const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
    const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useToast();
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [hasSaved, setHasSaved] = useState(false);

    // This state will now hold a map of asset IDs to their content for efficient updates
    const [generatedAssets, setGeneratedAssets] = useState<Map<string, CampaignAsset>>(new Map());

    useEffect(() => {
        getBrandProfile(user.uid)
            .then(profile => {
                setBrandProfile(profile);
                setIsProfileComplete(isBrandProfileComplete(profile));
            })
            .catch(() => {
                setError("Could not load Brand Profile. Please configure it in Settings to use the Campaign Builder.");
                setIsProfileComplete(false);
            });
    }, [user.uid]);
    
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isGeneratingStrategy) {
            interval = setInterval(() => {
                setLoadingMessage(prevMessage => {
                    const currentIndex = loadingMessages.indexOf(prevMessage);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isGeneratingStrategy]);

    const handleGenerateStrategy = async () => {
        if (!campaignGoal) {
            setError("Please describe your campaign goal.");
            return;
        }
        if (user.plan === 'freemium') {
            onUpgrade();
            return;
        }
        
        const cost = template.creditCost || 25;

        setIsGeneratingStrategy(true);
        setError('');

        try {
            const result = await generateCampaignStrategy(campaignGoal, brandProfile!);

            // Spend credits only after successful strategy generation
            if (!await spendCredits(cost)) {
                // spendCredits handles showing the modal and returns false if insufficient
                throw new Error("Credit deduction failed. Please try again.");
            }

            const strategyWithAssetIds: Strategy = {
                ...result,
                phases: result.phases.map((phase: Omit<CampaignPhase, 'assets'> & { assets: Omit<CampaignAsset, 'id' | 'status' | 'creditCost'>[] }) => ({
                    ...phase,
                    assets: phase.assets.map((asset): CampaignAsset => ({
                        ...asset,
                        id: crypto.randomUUID(),
                        status: 'pending',
                        creditCost: 5, // Assign a fixed cost for each asset generation
                    }))
                }))
            };
            setStrategy(strategyWithAssetIds);
            const initialAssetMap = new Map<string, CampaignAsset>();
            strategyWithAssetIds.phases.forEach(phase => {
                phase.assets.forEach(asset => initialAssetMap.set(asset.id, asset));
            });
            setGeneratedAssets(initialAssetMap);
            setStep(2);
        } catch (e: any) {
            setError(e.message || "Failed to generate strategy. Please try again.");
            addToast("AI failed to generate a strategy. Try rephrasing your goal.", "error");
        } finally {
            setIsGeneratingStrategy(false);
        }
    };

    const generateAllAssetsSequentially = useCallback(async () => {
        if (!brandProfile || !strategy) return;
        
        const allAssets = strategy.phases.flatMap(p => p.assets);
        
        setIsGeneratingAssets(true);
        setHasSaved(false); // Reset save flag for new generation
        let hasError = false;

        // Set all to 'generating' initially
        setGeneratedAssets(prev => {
            const newMap = new Map(prev);
            allAssets.forEach(asset => newMap.set(asset.id, { ...asset, status: 'generating' }));
            return newMap;
        });

        for (const asset of allAssets) {
            try {
                 // Check credits before each asset generation for immediate feedback.
                if (user.credits < asset.creditCost) {
                    throw new Error(`Not enough credits to generate "${asset.contentType}". Campaign paused.`);
                }

                await new Promise(resolve => setTimeout(resolve, 500)); 
                const content = await generateCampaignAsset(asset.description, asset.contentType, brandProfile);

                // Deduct credits only after the asset is successfully generated.
                if (!await spendCredits(asset.creditCost)) {
                    throw new Error("Credit deduction failed post-generation. This should not happen if the initial check passed.");
                }

                setGeneratedAssets(prev => new Map(prev).set(asset.id, { ...asset, status: 'generated', content }));
            } catch (error) {
                hasError = true;
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                setGeneratedAssets(prev => new Map(prev).set(asset.id, { ...asset, status: 'error', error: errorMessage }));
                if (errorMessage.includes("Not enough credits")) {
                    addToast(errorMessage, "error");
                    break; // Stop the loop if credits run out.
                }
            }
        }
        
        if (hasError) {
            addToast("Some assets failed to generate. You can retry them individually.", "error");
        } else {
            addToast("All campaign assets have been generated!", "success");
        }

        setIsGeneratingAssets(false);
    }, [strategy, brandProfile, addToast, spendCredits, user]);


    useEffect(() => {
        if (step === 3 && strategy && generatedAssets.size > 0 && Array.from(generatedAssets.values()).some((a: CampaignAsset) => a.status === 'pending')) {
            generateAllAssetsSequentially();
        }
    }, [step, strategy, generatedAssets, generateAllAssetsSequentially]);

    // Save campaign to history after generation finishes
    useEffect(() => {
        const allAssetsFinished = strategy && !Array.from(generatedAssets.values()).some((a: CampaignAsset) => a.status === 'pending' || a.status === 'generating');
        
        if (step === 3 && !isGeneratingAssets && allAssetsFinished && !hasSaved) {
            const finalStrategy: Strategy = {
                campaignTitle: strategy.campaignTitle,
                phases: strategy.phases.map(phase => ({
                    ...phase,
                    assets: phase.assets.map(asset => generatedAssets.get(asset.id) || asset)
                }))
            };

            const campaignData = {
                goal: campaignGoal,
                campaignTitle: finalStrategy.campaignTitle,
                strategy: finalStrategy,
                timestamp: new Date().toISOString(),
            };

            addCampaignDoc(user.uid, campaignData)
                .then(() => {
                    addToast("Campaign saved to your Playbook!", "success");
                    setHasSaved(true);
                })
                .catch(err => {
                    console.error("Failed to save campaign:", err);
                    addToast("Could not save campaign to history.", "error");
                });
        }
    }, [isGeneratingAssets, generatedAssets, strategy, step, hasSaved, campaignGoal, user.uid, addToast]);
    
    const handleAssetChange = (changedAsset: CampaignAsset) => {
        setGeneratedAssets(prev => new Map(prev).set(changedAsset.id, changedAsset));
    };

    if (isProfileComplete === false) {
        return <CompleteProfilePrompt featureName="Campaign Builder" onNavigate={onNavigateToSettings} />;
    }


    return (
        <div className="flex flex-col flex-1 bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 p-6 sm:p-8">
            <div className="mb-12 flex-shrink-0 flex justify-center">
                <Stepper currentStep={step} />
            </div>
            
            <div className="flex flex-col flex-1">
                {step === 1 && (
                    isGeneratingStrategy ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
                            <SynapseCoreIcon className="w-32 h-32 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-3">Crafting Your Strategy...</h2>
                            <p className="text-slate-400 mb-6 max-w-md mx-auto">Synapse is analyzing your goal to build the perfect, data-driven campaign tailored to your brand.</p>
                            <p className="text-lg font-mono text-[var(--gradient-start)] transition-opacity duration-500 h-6">
                                {loadingMessage}
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto w-full flex flex-col flex-1 justify-center animate-fade-in-up">
                            <div className="text-center w-full relative flex-shrink-0">
                                <div className="absolute -inset-x-12 -top-4 -bottom-8 bg-slate-800/30 rounded-full blur-3xl opacity-50"></div>
                                <div className="relative">
                                    <GoalIcon className="w-16 h-16 text-[var(--gradient-start)] mb-4 mx-auto" />
                                    <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2">
                                        <h2 className="text-3xl font-bold gradient-text text-center">What is your campaign's primary goal?</h2>
                                        <ProFeatureBadge />
                                    </div>
                                    <p className="text-slate-400 mt-2 text-center max-w-xl mx-auto">Be specific for the best results. The AI will build a multi-phase strategy based on your objective and brand profile.</p>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <SpeechToTextInput
                                    rows={4}
                                    value={campaignGoal}
                                    onTextChange={setCampaignGoal}
                                    placeholder="e.g., Launch our new AI-powered mobile app for task management that targets busy professionals."
                                    className="w-full min-h-[100px] resize-y bg-slate-800/50 border border-slate-700 rounded-lg p-4 pr-14 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] transition"
                                />
                            </div>

                            <div className="pt-6 flex-shrink-0">
                               <div className="text-left w-full mb-6">
                                    <p className="text-sm text-slate-400 mb-2">Or get inspired by an example:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {["Promote a webinar for developers", "Announce a 25% summer sale", "Drive signups for a new SaaS tool"].map(prompt => (
                                            <button key={prompt} onClick={() => setCampaignGoal(prompt)} className="text-xs bg-slate-800 hover:bg-slate-700/70 border border-slate-700/70 text-slate-300 px-3 py-1.5 rounded-full transition-colors">
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleGenerateStrategy} disabled={isGeneratingStrategy || !brandProfile || !campaignGoal} className="w-full flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                    Generate Strategy ({template.creditCost || 25} <DiamondIcon className="w-4 h-4 ml-1.5" />)
                                </button>
                                {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
                            </div>
                        </div>
                    )
                )}

                {step === 2 && strategy && (
                    <div className="animate-fade-in-up flex flex-col flex-1">
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-white">{strategy.campaignTitle}</h2>
                                <p className="text-slate-400 mt-1 max-w-2xl mx-auto">The AI has generated a strategic plan. Review the phases below and proceed to build your assets.</p>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 justify-center items-start">
                                {strategy.phases.map((phase, index) => (
                                    <React.Fragment key={index}>
                                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/70 w-full md:w-1/3 text-center md:text-left">
                                            <p className="text-sm font-bold text-[var(--gradient-start)]">Phase {index + 1}</p>
                                            <h3 className="font-bold text-lg text-white mb-2">{phase.name}</h3>
                                            <p className="text-slate-400 text-sm mb-4">{phase.description}</p>
                                            <div className="space-y-3">
                                                {phase.assets.map((asset, assetIndex) => (
                                                    <div key={assetIndex} className="flex items-start text-left p-3 bg-slate-700/40 rounded-md">
                                                        <LightbulbIcon className="w-4 h-4 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-semibold text-slate-300 text-sm leading-tight">{asset.contentType}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {index < strategy.phases.length - 1 && <div className="hidden md:flex items-center justify-center h-48"><ArrowRightIcon className="w-8 h-8 text-slate-600" /></div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                         <div className="text-center mt-10 flex-shrink-0">
                            <button onClick={() => setStep(3)} className="flex items-center justify-center mx-auto bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all text-lg shadow-lg">
                                Build Campaign Assets <ArrowRightIcon className="w-5 h-5 ml-2"/>
                            </button>
                        </div>
                    </div>
                )}
                
                {step === 3 && strategy && (
                     <div className="animate-fade-in-up flex flex-col flex-1">
                        <div className="text-center mb-8 flex-shrink-0">
                            <h2 className="text-3xl font-bold text-white">{strategy.campaignTitle}</h2>
                            <p className="text-slate-400 mt-1 max-w-2xl mx-auto">
                                {isGeneratingAssets 
                                    ? "Synapse is generating your content... Assets will appear below as they're ready." 
                                    : "Your campaign canvas is ready. Use the toolkit on each card to manually post your content."
                                }
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                            <div className="space-y-12">
                              {strategy.phases.map((phase, phaseIndex) => (
                                  <section key={phaseIndex} className="space-y-6">
                                      <header className="border-b-2 border-[var(--gradient-end)]/30 pb-3">
                                          <div className="flex items-center">
                                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[var(--gradient-start)] mr-3 flex-shrink-0">{phaseIndex + 1}</div>
                                              <div>
                                                <h3 className="font-bold text-2xl text-white">{phase.name}</h3>
                                                <p className="text-slate-400 text-sm">{phase.description}</p>
                                              </div>
                                          </div>
                                      </header>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          {phase.assets.map(asset => {
                                              const fullAsset = generatedAssets.get(asset.id);
                                              return fullAsset ? <AssetCard key={asset.id} asset={fullAsset} brandProfile={brandProfile} onChange={handleAssetChange}/> : null;
                                          })}
                                      </div>
                                  </section>
                              ))}
                            </div>
                        </div>
                        
                         {!isGeneratingAssets && (
                             <div className="mt-10 pt-8 border-t border-slate-700 text-center flex justify-center items-center gap-4 flex-shrink-0">
                                 <button onClick={() => { setStep(1); setStrategy(null); setCampaignGoal(''); }} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-5 rounded-lg transition-all">
                                    Start New Campaign
                                 </button>
                                  <button onClick={onNavigateToHistory} className="flex items-center text-slate-300 hover:text-white font-semibold py-2 px-5 rounded-lg transition-colors border border-slate-700 hover:border-slate-500">
                                    <PlaybookIcon className="w-5 h-5 mr-2" /> See in Playbook
                                 </button>
                             </div>
                         )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignBuilder;

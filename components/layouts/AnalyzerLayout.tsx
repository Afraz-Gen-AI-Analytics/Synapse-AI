
import React, { useState, useEffect } from 'react';
import { Template, BrandProfile, ResonanceFeedback, MarketSignalReport as MarketSignalReportData, SeoContentBlueprint, ContentRecommendation, User, ContentType, AdCreativeBlueprint, ViralVideoBlueprint } from '../../types';
import { getResonanceFeedback, getMarketSignalAnalysis, generateSeoContentBlueprint, generateAdCreativeBlueprint, generateViralVideoBlueprint } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';
import SpeechToTextInput from '../SpeechToTextInput';
import ProFeatureBadge from '../ProFeatureBadge';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import RunAnalysisIcon from '../icons/RunAnalysisIcon';
import ResonanceIcon from '../icons/ResonanceIcon';
import SparklesIcon from '../icons/SparklesIcon';
import SynapseCoreIcon from '../icons/SynapseCoreIcon';
import ResonanceReport from '../ResonanceReport';
import MarketSignalReport from '../MarketSignalReport';
import SeoContentBlueprintReport from '../SeoContentBlueprintReport';
import AdCreativeBlueprintReport from '../AdCreativeBlueprintReport';
import ViralVideoBlueprintReport from '../ViralVideoBlueprintReport';
import CopyIcon from '../icons/CopyIcon';
import DiamondIcon from '../icons/DiamondIcon';
import EyeIcon from '../icons/EyeIcon';

interface AnalyzerLayoutProps {
    selectedTemplate: Template;
    brandProfile: BrandProfile;
    user: User;
    onPrefill: (recommendation: ContentRecommendation, context: { [key: string]: any }) => void;
    onGenerateImage?: (prompt: string) => void;
    onGenerateVideoFromBlueprint?: (blueprint: ViralVideoBlueprint, topic: string) => void;
    onGenerate: (result: string, genTopic: string, templateName: string) => void;
    onUpgrade: () => void;
    reusedReportData: any | null;
    onClearReusedData: () => void;
    tones: string[];
    initialFields: { [key: string]: string };
    topic: string;
    onTopicChange: (value: string) => void;
    spendCredits: (amount: number) => Promise<boolean>;
}

const loadingMessages = [
    "Embodying target audience persona...",
    "Simulating gut reactions...",
    "Analyzing for clarity and persuasion...",
    "Identifying potential objections...",
    "Formulating actionable feedback...",
    "Scanning market data streams...",
    "Identifying competitor angles...",
    "Compiling actionable insights...",
];

const LoadingState: React.FC = () => {
    const [message, setMessage] = useState(loadingMessages[0]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = loadingMessages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 2200);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 animate-fade-in-up">
            <SynapseCoreIcon className="w-24 h-24 mb-6"/>
            <h3 className="text-lg font-semibold text-white mb-2">AI is Performing Analysis...</h3>
            <p className="transition-opacity duration-500">{message}</p>
        </div>
    );
};

const AnalyzerLayout: React.FC<AnalyzerLayoutProps> = ({ selectedTemplate, brandProfile, user, onPrefill, onGenerateImage, onGenerateVideoFromBlueprint, onGenerate, onUpgrade, reusedReportData, onClearReusedData, tones, initialFields, topic, onTopicChange, spendCredits }) => {
    const [view, setView] = useState<'form' | 'loading' | 'report'>('form');
    const [extraFields, setExtraFields] = useState<{ [key: string]: string }>(initialFields);
    const [reportData, setReportData] = useState<ResonanceFeedback | MarketSignalReportData | SeoContentBlueprint | AdCreativeBlueprint | ViralVideoBlueprint | null>(null);
    const { addToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (reusedReportData) {
            setReportData(reusedReportData);
            setView('report');
            onClearReusedData(); // Consume it so it doesn't re-trigger
        }
    }, [reusedReportData, onClearReusedData]);

    // --- SAMPLE DATA FOR PREVIEWS ---
    const loadSampleData = () => {
        let sampleResult;
        if (selectedTemplate.id === ContentType.ResonanceEngine) {
            sampleResult = {
                firstImpression: "It feels incredibly polished but a bit impersonal.",
                clarityScore: 9,
                clarityReasoning: "The value proposition is crystal clear. I know exactly what you sell.",
                persuasionScore: 6,
                persuasionReasoning: "It sounds like every other SaaS tool. It needs more soul to make me click.",
                keyQuestions: ["Is this just a wrapper around ChatGPT?", "How long does it take to set up?", "Does it integrate with HubSpot?"],
                suggestedImprovement: "Add a specific case study or a human testimonial in the second paragraph.",
                goalAlignment: "Aligns well with clarity, but misses the mark on emotional connection.",
                emotionAnalysis: "Evokes a sense of professionalism but lacks excitement."
            };
        } else if (selectedTemplate.id === ContentType.MarketSignalAnalyzer) {
            sampleResult = {
                trendingSubTopics: [
                    { topic: "AI Agents for SMBs", buzzScore: 9, reason: "Small businesses are actively looking for automation to replace expensive agencies." },
                    { topic: "Privacy-First AI", buzzScore: 7, reason: "Concerns about data training are spiking." }
                ],
                audienceQuestions: ["How to automate lead gen without looking like spam?", "Best AI tools for non-technical founders?"],
                competitorAngles: [
                    { angle: "Save Time", isUntapped: false },
                    { angle: "Save Money", isUntapped: false },
                    { angle: "Turn your solo business into an empire", isUntapped: true }
                ],
                contentRecommendations: [
                    { format: "Blog Post", title: "Why 'Saving Time' is a Trap: Build an Empire Instead" },
                    { format: "LinkedIn Carousel", title: "5 AI Agents You Can Hire Today for $0" }
                ]
            };
        }
         // Fallback for other tools or generic
         if (!sampleResult) {
             addToast("No sample available for this tool yet.", "info");
             return;
         }
         
         setReportData(sampleResult);
         setView('report');
         addToast("Showing sample report. Upgrade to generate your own!", "info");
    }

    const handleGenerate = async () => {
        if (!topic) {
            addToast("Please provide input for analysis.", "error");
            return;
        }
        if (user.plan === 'freemium' && selectedTemplate.isPro) {
            onUpgrade();
            return;
        }
        
        const cost = selectedTemplate.creditCost || 25;
        if (user.credits < cost) {
            addToast(`This action costs ${cost} credits, but you only have ${user.credits}.`, "error");
            onUpgrade();
            return;
        }

        setIsGenerating(true);
        setView('loading');
        try {
            let result;
            if (selectedTemplate.id === ContentType.ResonanceEngine) {
                result = await getResonanceFeedback(topic, brandProfile, {
                    contentGoal: extraFields.contentGoal,
                    platform: extraFields.platform,
                    emotion: extraFields.emotion,
                });
            } else if (selectedTemplate.id === ContentType.MarketSignalAnalyzer) {
                const targetAudience = extraFields.targetAudience || '';
                if (!targetAudience) {
                  addToast("Please specify a target audience for analysis.", "error");
                  setView('form');
                  setIsGenerating(false);
                  return;
                }
                const industry = extraFields.industry || 'General';
                const analysisGoal = extraFields.analysisGoal || 'Find content ideas';
                result = await getMarketSignalAnalysis(topic, targetAudience, industry, analysisGoal, brandProfile);
            } else if (selectedTemplate.id === ContentType.BlogIdea) {
                const audience = extraFields.targetAudience || '';
                 if (!audience) {
                  addToast("Please specify a target audience for the blueprint.", "error");
                  setView('form');
                  setIsGenerating(false);
                  return;
                }
                result = await generateSeoContentBlueprint({
                    topic,
                    targetAudience: audience,
                    contentGoal: extraFields.contentGoal,
                    tone: extraFields.tone,
                });
            } else if (selectedTemplate.id === ContentType.AIAdCreativeStudio) {
                const audience = extraFields.targetAudience || '';
                if (!audience) {
                    addToast("Please specify a target audience for the ad creative.", "error");
                    setView('form');
                    setIsGenerating(false);
                    return;
                }
                result = await generateAdCreativeBlueprint({
                    productDescription: topic,
                    targetAudience: audience,
                    platform: extraFields.platform,
                    tone: extraFields.tone,
                });
            } else if (selectedTemplate.id === ContentType.VideoScriptHook) {
                result = await generateViralVideoBlueprint({
                    topic,
                    hookStyle: extraFields.hookStyle,
                    tone: extraFields.tone,
                    platform: extraFields.platform,
                });
            }
             else {
                throw new Error("Unsupported template for this layout.");
            }
            
            // Deduct credits only after a successful generation
            if (!await spendCredits(cost)) {
                throw new Error("Credit deduction failed. Your balance may have changed.");
            }

            setReportData(result);
            onGenerate(JSON.stringify(result), topic, selectedTemplate.name);
            setView('report');
            addToast(`${selectedTemplate.name} report generated! You can review it again from your History.`, 'success');
        } catch (error: any) {
            addToast(error.message || "An error occurred during analysis.", "error");
            setView('form');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNewAnalysis = () => {
        setView('form');
        onTopicChange('');
        setReportData(null);
    };

    const handleFieldChange = (name: string, value: string) => {
        setExtraFields(prev => ({ ...prev, [name]: value }));
    };
    
    const handlePrefillWithContext = (recommendation: ContentRecommendation) => {
        const context = {
            audience: extraFields.targetAudience,
        };
        onPrefill(recommendation, context);
    };

    const handleCopyReport = () => {
        if (!reportData) return;
        let reportText = '';

        switch (selectedTemplate.id) {
            case ContentType.ResonanceEngine: {
                const feedback = reportData as ResonanceFeedback;
                reportText += `RESONANCE REPORT\n================\n\n`;
                reportText += `First Impression: "${feedback.firstImpression}"\n\n`;
                reportText += `Clarity Score: ${feedback.clarityScore}/10\nReasoning: ${feedback.clarityReasoning}\n\n`;
                reportText += `Persuasion Score: ${feedback.persuasionScore}/10\nReasoning: ${feedback.persuasionReasoning}\n\n`;
                reportText += `Goal Alignment: ${feedback.goalAlignment}\n\n`;
                reportText += `Emotional Resonance: ${feedback.emotionAnalysis}\n\n`;
                reportText += `Key Questions & Doubts:\n${feedback.keyQuestions.map(q => `- ${q}`).join('\n')}\n\n`;
                reportText += `Actionable Suggestion: ${feedback.suggestedImprovement}\n`;
                break;
            }
            case ContentType.MarketSignalAnalyzer: {
                const report = reportData as MarketSignalReportData;
                reportText += `MARKET SIGNAL REPORT\n=====================\n\n`;
                reportText += `### Trending Sub-Topics\n`;
                report.trendingSubTopics.forEach(t => reportText += `- ${t.topic} (Buzz: ${t.buzzScore}/10): ${t.reason}\n`);
                reportText += `\n### Burning Questions\n`;
                report.audienceQuestions.forEach(q => reportText += `- ${q}\n`);
                reportText += `\n### Competitive Landscape\n`;
                report.competitorAngles.forEach(a => reportText += `- ${a.angle} ${a.isUntapped ? '(UNTAPPED)' : ''}\n`);
                reportText += `\n### Content Playbook\n`;
                report.contentRecommendations.forEach(r => reportText += `- ${r.format}: "${r.title}"\n`);
                break;
            }
            case ContentType.BlogIdea: {
                const report = reportData as SeoContentBlueprint;
                reportText += `SEO CONTENT BLUEPRINT\n=======================\n\n`;
                reportText += `### Title Suggestions\n`;
                report.titleSuggestions.forEach(s => reportText += `- ${s.title} (${s.category})\n`);
                reportText += `\n### Target Keywords\n`;
                reportText += `- Primary: ${report.targetKeywords.primaryKeyword}\n`;
                reportText += `- Secondary: ${report.targetKeywords.secondaryKeywords.join(', ')}\n`;
                reportText += `\n### Opening Hook\n${report.hook}\n`;
                reportText += `\n### Article Outline\n`;
                report.fullArticleOutline.forEach(section => {
                    reportText += `#### ${section.heading}\n`;
                    section.talkingPoints.forEach(point => reportText += `  - ${point}\n`);
                });
                reportText += `\n### Call to Action\n${report.callToAction}\n`;
                break;
            }
            case ContentType.AIAdCreativeStudio: {
                const report = reportData as AdCreativeBlueprint;
                reportText += `AD CREATIVE BLUEPRINT\n=======================\n\n`;
                reportText += `### Copy Variations\n`;
                report.copyVariations.forEach((v, i) => {
                    reportText += `Variation ${i + 1} (Angle: ${v.angle})\n`;
                    reportText += `Headline: "${v.headline}"\n`;
                    reportText += `Body: ${v.body}\n\n`;
                });
                reportText += `### Visual Concept (Image Prompt)\n${report.imagePrompt}\n\n`;
                reportText += `### Targeting Suggestions\n${report.targetingSuggestions.map(s => `- ${s}`).join('\n')}\n\n`;
                reportText += `### Call-to-Action Ideas\n${report.ctaSuggestions.map(c => `- "${c}"`).join('\n')}\n`;
                break;
            }
            case ContentType.VideoScriptHook: {
                const report = reportData as ViralVideoBlueprint;
                reportText += `VIRAL VIDEO BLUEPRINT\n=======================\n\n`;
                reportText += `Topic: ${topic}\n\n`;
                reportText += `Viral Hook: "${report.hookText}"\n\n`;
                reportText += `Script Outline:\n${report.scriptOutline.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`;
                reportText += `Visual Concept: ${report.visualConcept}\n\n`;
                reportText += `Pacing & Style: ${report.pacingAndStyle}\n\n`;
                reportText += `Audio Suggestion: ${report.audioSuggestion}\n\n`;
                reportText += `Call to Action: "${report.callToAction}"\n`;
                break;
            }
        }

        if (reportText) {
            navigator.clipboard.writeText(reportText.trim());
            addToast("Full report copied to clipboard!", "success");
        }
    };

    const getButtonConfig = () => {
        switch (selectedTemplate.id) {
            case ContentType.ResonanceEngine:
                return { text: 'Test Resonance', icon: ResonanceIcon };
            case ContentType.BlogIdea:
                return { text: 'Get Blueprint', icon: SparklesIcon };
            case ContentType.AIAdCreativeStudio:
                return { text: 'Generate Creative Pack', icon: SparklesIcon };
            case ContentType.VideoScriptHook:
                return { text: 'Generate Blueprint', icon: SparklesIcon };
            case ContentType.MarketSignalAnalyzer:
            default:
                return { text: 'Run Analysis', icon: RunAnalysisIcon };
        }
    };
    const { text: buttonText, icon: ButtonIcon } = getButtonConfig();
    const cost = selectedTemplate.creditCost || 25;


    if (view === 'loading') {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 p-6">
                <LoadingState />
            </div>
        );
    }

    if (view === 'report' && reportData) {
        return (
            <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h1 className={`text-xl md:text-2xl font-bold ${selectedTemplate.isPro ? 'gradient-text' : 'text-white'}`}>{selectedTemplate.name} Report</h1>
                     {/* Desktop Buttons */}
                     <div className="hidden md:flex items-center gap-2">
                        <button onClick={handleCopyReport} className="flex items-center text-sm font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 rounded-lg px-3 py-2 transition-colors">
                            <CopyIcon className="w-4 h-4 mr-2" />
                            Copy Report
                        </button>
                        <button onClick={handleNewAnalysis} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            New Analysis
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    {selectedTemplate.id === ContentType.ResonanceEngine && <ResonanceReport feedback={reportData as ResonanceFeedback} />}
                    {selectedTemplate.id === ContentType.MarketSignalAnalyzer && <MarketSignalReport report={reportData as MarketSignalReportData} onPrefill={handlePrefillWithContext} />}
                    {selectedTemplate.id === ContentType.BlogIdea && <SeoContentBlueprintReport report={reportData as SeoContentBlueprint} />}
                    {selectedTemplate.id === ContentType.AIAdCreativeStudio && onGenerateImage && <AdCreativeBlueprintReport report={reportData as AdCreativeBlueprint} onGenerateImage={onGenerateImage} />}
                    {selectedTemplate.id === ContentType.VideoScriptHook && onGenerateVideoFromBlueprint && <ViralVideoBlueprintReport report={reportData as ViralVideoBlueprint} onGenerateVideo={onGenerateVideoFromBlueprint} topic={topic} />}
                </div>

                 {/* Mobile Buttons */}
                <div className="flex md:hidden items-center gap-4 mt-6 pt-6 border-t border-slate-800">
                    <button onClick={handleCopyReport} className="flex-1 flex items-center justify-center text-sm font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 rounded-lg px-3 py-3 transition-colors">
                        <CopyIcon className="w-4 h-4 mr-2" />
                        Copy Report
                    </button>
                    <button onClick={handleNewAnalysis} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                        New Analysis
                    </button>
                </div>
            </div>
        );
    }
    
    // Default to 'form' view
    return (
        <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <selectedTemplate.icon className={`w-10 h-10 ${selectedTemplate.isPro ? 'text-[var(--gradient-start)]' : 'text-white'}`} />
                </div>
                <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2">
                    <h1 className={`text-3xl font-bold ${selectedTemplate.isPro ? 'gradient-text' : 'text-white'}`}>{selectedTemplate.name}</h1>
                    {selectedTemplate.isPro && <ProFeatureBadge />}
                </div>
                <p className="text-slate-400 mt-2 mb-8 max-w-xl mx-auto">{selectedTemplate.description}</p>
                
                <div className="space-y-6 text-left">
                    <div className="flex-grow flex flex-col">
                        <label htmlFor="topic" className="block text-sm font-semibold text-slate-300 mb-2">
                            {selectedTemplate.id === ContentType.ResonanceEngine ? 'Content to Analyze' : selectedTemplate.id === ContentType.AIAdCreativeStudio ? 'Product/Service Description' : 'Topic to Research'}
                        </label>
                        <SpeechToTextInput
                            id="topic"
                            rows={4}
                            value={topic}
                            onTextChange={onTopicChange}
                            placeholder={selectedTemplate.placeholder}
                            className="w-full h-full flex-grow bg-slate-800/50 border border-slate-700 rounded-lg p-3 pr-14 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] transition"
                        />
                    </div>

                    {selectedTemplate.fields && (
                        <div>
                            <h3 className="text-base font-semibold text-slate-200 mb-4">Analyze Context</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedTemplate.fields?.map(field => (
                                    <div key={field.name} className={selectedTemplate.fields && selectedTemplate.fields.length % 2 !== 0 && selectedTemplate.fields.length - 1 === selectedTemplate.fields.indexOf(field) ? 'sm:col-span-2' : ''}>
                                        <label htmlFor={field.name} className="block text-sm font-medium text-slate-300 mb-2">{field.label}</label>
                                        {field.options ? (
                                            <div className="relative">
                                                <select id={field.name} name={field.name} value={extraFields[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[var(--gradient-end)] transition appearance-none">
                                                    {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                                    <ChevronDownIcon className="w-5 h-5" />
                                                </div>
                                            </div>
                                        ) : (
                                            <input
                                                id={field.name}
                                                name={field.name}
                                                type="text"
                                                value={extraFields[field.name] || ''}
                                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] transition"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button onClick={handleGenerate} disabled={isGenerating} className="flex-1 flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all text-lg disabled:opacity-50 shadow-lg shadow-[color:var(--gradient-start)]/30">
                        <ButtonIcon className="w-5 h-5 mr-2" />
                        {buttonText} ({cost} <DiamondIcon className="w-4 h-4 ml-1 inline-block" />)
                    </button>
                     {(selectedTemplate.id === ContentType.ResonanceEngine || selectedTemplate.id === ContentType.MarketSignalAnalyzer) && (
                        <button onClick={loadSampleData} className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                           <EyeIcon className="w-5 h-5 mr-2" /> View Sample
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyzerLayout;

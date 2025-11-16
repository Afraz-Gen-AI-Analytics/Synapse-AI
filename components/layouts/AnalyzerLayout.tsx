import React, { useState } from 'react';
// FIX: Renamed MarketSignalReport type to MarketSignalReportData to resolve name conflict with the component.
import { Template, BrandProfile, ResonanceFeedback, MarketSignalReport as MarketSignalReportData, ContentRecommendation, User, ContentType } from '../../types';
import { getResonanceFeedback, getMarketSignalAnalysis } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';
import SpeechToTextInput from '../SpeechToTextInput';
import ProFeatureBadge from '../ProFeatureBadge';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import RunAnalysisIcon from '../icons/RunAnalysisIcon';
import SynapseCoreIcon from '../icons/SynapseCoreIcon';
import ResonanceReport from '../ResonanceReport';
import MarketSignalReport from '../MarketSignalReport';

interface AnalyzerLayoutProps {
    selectedTemplate: Template;
    brandProfile: BrandProfile;
    user: User;
    onPrefill: (recommendation: ContentRecommendation) => void;
    onGenerate: (result: string, genTopic: string, templateName: string) => void;
    onUpgrade: () => void;
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

const AnalyzerLayout: React.FC<AnalyzerLayoutProps> = ({ selectedTemplate, brandProfile, user, onPrefill, onGenerate, onUpgrade }) => {
    const [view, setView] = useState<'form' | 'loading' | 'report'>('form');
    const [topic, setTopic] = useState('');
    const [extraFields, setExtraFields] = useState<{ [key: string]: string }>(() => {
        if (selectedTemplate.fields) {
            return selectedTemplate.fields.reduce((acc, field) => {
                acc[field.name] = field.defaultValue || (field.options ? field.options[0] : '');
                return acc;
            }, {} as { [key: string]: string });
        }
        return {};
    });
    // FIX: Updated type to use the renamed MarketSignalReportData.
    const [reportData, setReportData] = useState<ResonanceFeedback | MarketSignalReportData | null>(null);
    const { addToast } = useToast();

    const handleGenerate = async () => {
        if (!topic) {
            addToast("Please provide input for analysis.", "error");
            return;
        }
        if (user.plan === 'freemium') {
            onUpgrade();
            return;
        }

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
                const audience = extraFields.audience || '';
                if (!audience) {
                  addToast("Please specify a target audience for analysis.", "error");
                  setView('form');
                  return;
                }
                const industry = extraFields.industry || 'General';
                const analysisGoal = extraFields.analysisGoal || 'Find content ideas';
                result = await getMarketSignalAnalysis(topic, audience, industry, analysisGoal, brandProfile);
            } else {
                throw new Error("Unsupported template for this layout.");
            }
            
            setReportData(result);
            onGenerate(JSON.stringify(result), topic, selectedTemplate.name);
            setView('report');
        } catch (error: any) {
            addToast(error.message || "An error occurred during analysis.", "error");
            setView('form');
        }
    };

    const handleNewAnalysis = () => {
        setView('form');
        setTopic('');
        setReportData(null);
    };

    const handleFieldChange = (name: string, value: string) => {
        setExtraFields(prev => ({ ...prev, [name]: value }));
    };

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
                    <h1 className="text-2xl font-bold gradient-text">{selectedTemplate.name} Report</h1>
                    <button onClick={handleNewAnalysis} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        New Analysis
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    {selectedTemplate.id === ContentType.ResonanceEngine && <ResonanceReport feedback={reportData as ResonanceFeedback} />}
                    {/* FIX: Cast reportData to the renamed MarketSignalReportData type and use the MarketSignalReport component. */}
                    {selectedTemplate.id === ContentType.MarketSignalAnalyzer && <MarketSignalReport report={reportData as MarketSignalReportData} onPrefill={onPrefill} />}
                </div>
            </div>
        );
    }
    
    // Default to 'form' view
    return (
        <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-2xl animate-fade-in-up">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <selectedTemplate.icon className="w-10 h-10 text-[var(--gradient-start)]" />
                </div>
                <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2">
                    <h1 className="text-3xl font-bold gradient-text">{selectedTemplate.name}</h1>
                    <ProFeatureBadge />
                </div>
                <p className="text-slate-400 mt-2 mb-8 max-w-xl mx-auto">{selectedTemplate.description}</p>
                
                <div className="space-y-6 text-left">
                    <div className="flex-grow flex flex-col">
                        <label htmlFor="topic" className="block text-sm font-semibold text-slate-300 mb-2">
                            {selectedTemplate.id === ContentType.ResonanceEngine ? 'Content to Analyze' : 'Topic to Research'}
                        </label>
                        <SpeechToTextInput
                            id="topic"
                            rows={4}
                            value={topic}
                            onTextChange={setTopic}
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
                                                <select id={field.name} value={extraFields[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[var(--gradient-end)] transition appearance-none">
                                                    {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                                    <ChevronDownIcon className="w-5 h-5" />
                                                </div>
                                            </div>
                                        ) : (
                                            <input
                                                id={field.name}
                                                type="text"
                                                value={extraFields[field.name] || ''}
                                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] transition"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={handleGenerate} disabled={view === 'loading'} className="w-full mt-8 flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all text-lg disabled:opacity-50 shadow-lg shadow-[color:var(--gradient-start)]/30">
                    <RunAnalysisIcon className="w-5 h-5 mr-2" />
                    Run Analysis
                </button>
            </div>
        </div>
    );
};

export default AnalyzerLayout;
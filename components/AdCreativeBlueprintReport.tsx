import React from 'react';
import { AdCreativeBlueprint } from '../types';
import { useToast } from '../contexts/ToastContext';
import MegaphoneIcon from './icons/MegaphoneIcon';
import TargetIcon from './icons/TargetIcon';
import ImageIcon from './icons/ImageIcon';
import CopyIcon from './icons/CopyIcon';
import SparklesIcon from './icons/SparklesIcon';

const ReportSection: React.FC<{ title: string; icon: React.FC<{ className?: string }>; children: React.ReactNode; }> = ({ title, icon: Icon, children }) => (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 h-full flex flex-col">
        <h4 className="font-semibold text-white mb-4 flex items-center text-lg">
            <div className="p-2 bg-slate-800 rounded-lg mr-3">
                <Icon className="w-5 h-5 text-[var(--gradient-start)]" />
            </div>
            {title}
        </h4>
        <div className="space-y-4 flex-1">{children}</div>
    </div>
);


interface AdCreativeBlueprintReportProps {
    report: AdCreativeBlueprint;
    onGenerateImage: (prompt: string) => void;
}

const AdCreativeBlueprintReport: React.FC<AdCreativeBlueprintReportProps> = ({ report, onGenerateImage }) => {
    const { addToast } = useToast();

    const copyToClipboard = (text: string, message: string) => {
        navigator.clipboard.writeText(text);
        addToast(message, 'success');
    };

    return (
        <div className="w-full space-y-6 text-sm animate-fade-in-up">
            <div className="space-y-6 mt-6">
                <ReportSection title="Copy Variations" icon={CopyIcon}>
                    {report.copyVariations.map((variation, index) => (
                        <div key={index} className="bg-slate-800/40 border border-slate-700/70 p-4 rounded-lg group relative transition-all duration-300 hover:border-[var(--gradient-end)]/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white px-2 py-0.5 rounded-md">{variation.angle}</span>
                                    <p className="font-bold text-lg text-white mt-2">"{variation.headline}"</p>
                                    <p className="text-slate-300 mt-1">{variation.body}</p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(`Headline: ${variation.headline}\nBody: ${variation.body}`, 'Ad copy copied!')}
                                    className="absolute top-3 right-3 p-2 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                    aria-label="Copy ad variation"
                                >
                                    <CopyIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </ReportSection>

                <div className="relative p-6 rounded-2xl border-2 border-[var(--gradient-start)]/80 bg-gradient-to-br from-[color:var(--gradient-start)]/10 to-transparent">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0 bg-slate-800 p-2 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-[var(--gradient-start)]" />
                        </div>
                        <h3 className="text-lg font-bold gradient-text">Visual Concept</h3>
                    </div>
                    <blockquote className="border-none p-0">
                        <p className="text-slate-200 text-base font-medium italic">"{report.imagePrompt}"</p>
                    </blockquote>
                    <button
                        onClick={() => onGenerateImage(report.imagePrompt)}
                        className="w-full sm:w-auto mt-6 flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg shadow-[color:var(--gradient-start)]/20"
                    >
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Generate this Image
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ReportSection title="Targeting Suggestions" icon={TargetIcon}>
                        <div className="space-y-2">
                            {report.targetingSuggestions.map((suggestion, index) => (
                                <div key={index} className="flex items-start p-3 bg-slate-800/60 rounded-md">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs mr-3">&rarr;</div>
                                    <span className="text-slate-300 pt-0.5">{suggestion}</span>
                                </div>
                            ))}
                        </div>
                    </ReportSection>

                    <ReportSection title="Call-to-Action Ideas" icon={MegaphoneIcon}>
                        <div className="space-y-2">
                            {report.ctaSuggestions.map((cta, index) => (
                                <div key={index} className="flex items-start p-3 bg-slate-800/60 rounded-md">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs mr-3">&rarr;</div>
                                    <span className="font-semibold text-slate-200 pt-0.5">"{cta}"</span>
                                </div>
                            ))}
                        </div>
                    </ReportSection>
                </div>
            </div>
        </div>
    );
};

export default AdCreativeBlueprintReport;

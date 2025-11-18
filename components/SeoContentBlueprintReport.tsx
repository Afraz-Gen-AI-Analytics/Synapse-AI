import React from 'react';
import { SeoContentBlueprint } from '../types';
import { useToast } from '../contexts/ToastContext';
import LightbulbIcon from './icons/LightbulbIcon';
import TargetIcon from './icons/TargetIcon';
import SparklesIcon from './icons/SparklesIcon';
import PlaybookIcon from './icons/PlaybookIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import CopyIcon from './icons/CopyIcon';

interface SeoContentBlueprintReportProps {
    report: SeoContentBlueprint;
}

const SeoContentBlueprintReport: React.FC<SeoContentBlueprintReportProps> = ({ report }) => {
    return (
        <div className="w-full space-y-8 text-sm animate-fade-in-up">
            <div className="space-y-6 mt-8">
                {/* Title Suggestions */}
                <div>
                    <h3 className="flex items-center text-xl font-bold text-white mb-4">
                        <div className="p-2 bg-slate-800 rounded-lg mr-3"><LightbulbIcon className="w-5 h-5 text-yellow-400" /></div>
                        Title Suggestions
                    </h3>
                    <div className="space-y-3">
                        {report.titleSuggestions.map((suggestion, index) => (
                            <div key={index} className="p-4 bg-slate-800/50 border border-slate-700/70 rounded-lg">
                                <p className="font-semibold text-slate-200">"{suggestion.title}"</p>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{suggestion.category}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Target Keywords */}
                <div>
                    <h3 className="flex items-center text-xl font-bold text-white mb-4">
                        <div className="p-2 bg-slate-800 rounded-lg mr-3"><TargetIcon className="w-5 h-5 text-sky-400" /></div>
                        Target Keywords
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="p-4 bg-slate-800/50 border border-slate-700/70 rounded-lg">
                            <p className="text-xs text-slate-400 font-semibold">PRIMARY KEYWORD</p>
                            <p className="font-semibold text-slate-200 mt-1">{report.targetKeywords.primaryKeyword}</p>
                        </div>
                         <div className="p-4 bg-slate-800/50 border border-slate-700/70 rounded-lg">
                            <p className="text-xs text-slate-400 font-semibold">SECONDARY KEYWORDS</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {report.targetKeywords.secondaryKeywords.map(keyword => (
                                    <span key={keyword} className="text-xs bg-sky-500/10 text-sky-300 px-2 py-1 rounded-full">{keyword}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Opening Hook */}
                <div className="bg-slate-800/50 p-6 rounded-lg border-l-4 border-[var(--gradient-start)]">
                    <h3 className="flex items-center text-xl font-bold text-white mb-4">
                        <div className="p-2 bg-slate-800 rounded-lg mr-3"><SparklesIcon className="w-5 h-5 text-fuchsia-400" /></div>
                        Opening Hook
                    </h3>
                    <blockquote className="border-none p-0">
                        <p className="text-slate-300 italic text-base">"{report.hook}"</p>
                    </blockquote>
                </div>

                {/* Article Outline */}
                <div>
                    <h3 className="flex items-center text-xl font-bold text-white mb-4">
                        <div className="p-2 bg-slate-800 rounded-lg mr-3"><PlaybookIcon className="w-5 h-5 text-blue-400" /></div>
                        Article Outline
                    </h3>
                    <ul className="space-y-4">
                        {report.fullArticleOutline.map((section, index) => (
                             <li key={index} className="bg-slate-800/50 border border-slate-700/70 p-4 rounded-lg">
                                <h5 className="font-bold text-slate-200 mb-2 text-base">{section.heading}</h5>
                                <ul className="list-disc list-inside text-slate-400 space-y-1 pl-2">
                                    {section.talkingPoints.map((point, pIndex) => (
                                        <li key={pIndex}>{point}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* Call to Action */}
                 <div className="bg-green-500/10 p-6 rounded-lg border border-green-500/30">
                    <h3 className="flex items-center text-xl font-bold text-white mb-4">
                        <div className="p-2 bg-green-900/30 rounded-lg mr-3"><MegaphoneIcon className="w-5 h-5 text-green-400" /></div>
                        Call to Action
                    </h3>
                    <p className="text-slate-200 text-base font-semibold">{report.callToAction}</p>
                </div>
            </div>
        </div>
    );
};

export default SeoContentBlueprintReport;

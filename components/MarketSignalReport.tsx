import React from 'react';
import { MarketSignalReport as MarketSignalReportData, TrendingTopic, CompetitorAngle, ContentRecommendation } from '../types';
import TrendingUpIcon from './icons/TrendingUpIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import PlaybookIcon from './icons/PlaybookIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import SparklesIcon from './icons/SparklesIcon';
import { useToast } from '../contexts/ToastContext';
import CopyIcon from './icons/CopyIcon';

const ReportSection: React.FC<{ title: string; icon: React.FC<{ className?: string }>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg">
        <h4 className="font-semibold text-white mb-3 flex items-center">
            <Icon className="w-5 h-5 mr-3 text-[var(--gradient-start)]" />
            {title}
        </h4>
        <div className="space-y-3">{children}</div>
    </div>
);

interface MarketSignalReportProps {
    report: MarketSignalReportData;
    onPrefill: (recommendation: ContentRecommendation) => void;
}

const MarketSignalReport: React.FC<MarketSignalReportProps> = ({ report, onPrefill }) => {
    return (
        <div className="w-full space-y-6 text-sm animate-fade-in-up">
            {/* Highlight Section */}
            <div className="bg-slate-800/50 p-6 rounded-lg mt-6">
                <h4 className="font-semibold text-white mb-4 flex items-center">
                    <TrendingUpIcon className="w-5 h-5 mr-3 text-[var(--gradient-start)]" />
                    Trending Sub-Topics
                </h4>
                <div className="space-y-3">
                    {report.trendingSubTopics.map((item, index) => (
                        <div key={index} className="p-3 bg-slate-700/30 rounded-md">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-200">{item.topic}</p>
                                    <p className="text-xs text-slate-400 mt-1">{item.reason}</p>
                                </div>
                                <div className="w-24 text-right flex-shrink-0">
                                    <p className="text-xs font-bold text-slate-400 mb-1">Buzz: {item.buzzScore}/10</p>
                                    <div className="bg-slate-900/50 rounded-full h-2 w-full">
                                        <div className="bg-gradient-to-r from-sky-500 to-cyan-400 h-2 rounded-full" style={{ width: `${item.buzzScore * 10}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail Sections */}
            <div className="space-y-4">
                <ReportSection title="Burning Questions" icon={QuestionMarkCircleIcon}>
                    <ul className="list-none space-y-2">
                        {report.audienceQuestions.map((q, i) => (
                            <li key={i} className="flex items-start">
                               <span className="text-sky-400 mr-2 mt-0.5">Q.</span>
                               <span className="text-slate-300">{q}</span>
                            </li>
                        ))}
                    </ul>
                </ReportSection>

                <ReportSection title="Competitive Landscape" icon={BriefcaseIcon}>
                    {report.competitorAngles.map((item, index) => (
                        <div key={index} className={`p-3 rounded-md ${item.isUntapped ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-700/30'}`}>
                            {item.isUntapped && (
                                 <div className="flex items-center text-xs font-bold text-green-300 mb-1">
                                    <LightbulbIcon className="w-4 h-4 mr-1.5" />
                                    UNTAPPED ANGLE
                                </div>
                            )}
                            <p className={item.isUntapped ? "text-green-100" : "text-slate-300"}>{item.angle}</p>
                        </div>
                    ))}
                </ReportSection>
                
                 <ReportSection title="Content Playbook" icon={PlaybookIcon}>
                    {report.contentRecommendations.map((item, index) => (
                        <div key={index} className="p-3 bg-slate-700/30 rounded-md flex justify-between items-center gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-slate-400 font-semibold">{item.format}</p>
                                <p className="font-semibold text-slate-200">"{item.title}"</p>
                            </div>
                             <button onClick={() => onPrefill(item)} className="flex-shrink-0 flex items-center text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-1.5 px-3 rounded-md transition-colors">
                               <SparklesIcon className="w-3.5 h-3.5 mr-1.5"/> Create
                            </button>
                        </div>
                    ))}
                </ReportSection>
            </div>
        </div>
    );
};

export default MarketSignalReport;

import React from 'react';
import { ViralVideoBlueprint } from '../types';
import { useToast } from '../contexts/ToastContext';
import SparklesIcon from './icons/SparklesIcon';
import CameraIcon from './icons/CameraIcon';
import MusicIcon from './icons/MusicIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import CopyIcon from './icons/CopyIcon';
import PlaybookIcon from './icons/PlaybookIcon';
import FilmIcon from './icons/FilmIcon';

// A new, more flexible SectionHeader for the redesigned report
const SectionHeader: React.FC<{ title: string; icon: React.FC<{ className?: string }>; }> = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-3">
        <div className="flex-shrink-0 bg-slate-800 p-2 rounded-lg">
            <Icon className="w-5 h-5 text-[var(--gradient-start)]" />
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
    </div>
);

interface ViralVideoBlueprintReportProps {
    report: ViralVideoBlueprint;
    onGenerateVideo: (blueprint: ViralVideoBlueprint, topic: string) => void;
    topic: string;
}

const ViralVideoBlueprintReport: React.FC<ViralVideoBlueprintReportProps> = ({ report, onGenerateVideo, topic }) => {
    const { addToast } = useToast();

    const copyToClipboard = (text: string, message: string) => {
        navigator.clipboard.writeText(text);
        addToast(message, 'success');
    };

    return (
        <div className="w-full space-y-8 text-sm animate-fade-in-up">
            {/* 1. Viral Hook Section */}
            <div className="relative text-center bg-gradient-to-br from-slate-900 to-black/30 p-8 rounded-2xl border border-[var(--gradient-end)]/30 overflow-hidden mt-8">
                 <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[var(--gradient-end)] via-transparent to-transparent opacity-30 blur-xl pointer-events-none"></div>
                <SparklesIcon className="w-8 h-8 mx-auto text-[var(--gradient-end)] mb-4" />
                <h3 className="text-lg font-bold text-white mb-4">The Viral Hook</h3>
                <p className="text-2xl font-bold italic gradient-text">"{report.hookText}"</p>
                <button onClick={() => copyToClipboard(report.hookText, 'Hook copied!')} className="mt-6 mx-auto flex items-center text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors border border-slate-700">
                    <CopyIcon className="w-4 h-4 mr-2"/> Copy Hook
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Script Outline */}
                <div className="lg:col-span-2 space-y-4">
                    <SectionHeader title="Script Outline" icon={PlaybookIcon} />
                    <div className="space-y-3">
                        {report.scriptOutline.map((step, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[var(--gradient-start)]">{index + 1}</div>
                                <p className="text-slate-300 pt-1">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Side column: Audio & CTA */}
                <div className="space-y-8">
                    <div>
                        <SectionHeader title="Audio Suggestion" icon={MusicIcon} />
                        <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg group relative">
                            <p className="text-slate-300">{report.audioSuggestion}</p>
                            <button onClick={() => copyToClipboard(report.audioSuggestion, 'Audio suggestion copied!')} className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><CopyIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <div>
                        <SectionHeader title="Call to Action" icon={MegaphoneIcon} />
                        <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg group relative">
                            <p className="text-slate-300 font-semibold">"{report.callToAction}"</p>
                             <button onClick={() => copyToClipboard(report.callToAction, 'CTA copied!')} className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><CopyIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Visuals & Pacing */}
            <div className="space-y-4">
                <SectionHeader title="Visuals & Pacing" icon={CameraIcon} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-400 font-semibold mb-2">VISUAL CONCEPT</p>
                        <p className="text-slate-300">{report.visualConcept}</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-400 font-semibold mb-2">PACING & STYLE</p>
                        <p className="text-slate-300">{report.pacingAndStyle}</p>
                    </div>
                </div>
            </div>

            {/* 5. Generate Video CTA */}
            <div className="mt-8 pt-8 border-t border-slate-700/50 text-center bg-slate-800/30 rounded-lg p-6">
                <div className="p-3 inline-block rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] mb-4">
                    <FilmIcon className="w-6 h-6 text-white"/>
                </div>
                <h3 className="text-xl font-bold text-white">Bring this Blueprint to Life</h3>
                <p className="text-slate-400 mt-2 max-w-lg mx-auto">Use this strategic blueprint to generate a short, engaging video ad with our AI video generator.</p>
                <button
                    onClick={() => onGenerateVideo(report, topic)}
                    className="mt-6 inline-flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg text-base transition-opacity duration-300 ease-in-out shadow-lg shadow-[color:var(--gradient-start)]/20"
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Generate AI Video
                </button>
                <p className="text-center text-xs text-slate-500 mt-3">This will switch to the Marketing Video Ad tool (a Pro feature).</p>
            </div>
        </div>
    );
};

export default ViralVideoBlueprintReport;

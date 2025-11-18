import React from 'react';
import { SocialPostContent } from '../types';
import TwitterIcon from './icons/TwitterIcon';
import LinkedInIcon from './icons/LinkedInIcon';
import FacebookIcon from './icons/FacebookIcon';
import SparklesIcon from './icons/SparklesIcon';
import ResonanceIcon from './icons/ResonanceIcon';
import ImageIcon from './icons/ImageIcon';
import AgentIcon from './icons/AgentIcon';
import { useToast } from '../contexts/ToastContext';

interface SocialPostOutputProps {
    content: SocialPostContent;
    onGenerateImage: (prompt: string) => void;
    onAnalyzeResonance: (text: string) => void;
    onUpgrade?: () => void;
}

const platformConfig = {
    Twitter: { icon: TwitterIcon, name: 'X/Twitter', url: 'https://twitter.com/intent/tweet' },
    LinkedIn: { icon: LinkedInIcon, name: 'LinkedIn', url: 'https://www.linkedin.com/feed/?shareActive=true' },
    Facebook: { icon: FacebookIcon, name: 'Facebook', url: 'https://www.facebook.com/' },
};

const SocialPostOutput: React.FC<SocialPostOutputProps> = ({ content, onGenerateImage, onAnalyzeResonance, onUpgrade }) => {
    const { addToast } = useToast();
    const config = platformConfig[content.platform];
    const Icon = config.icon;
    const fullPostText = `${content.copy}\n\n${content.hashtags}`;

    const handlePublish = () => {
        navigator.clipboard.writeText(fullPostText);
        addToast(`Post copied! Now opening ${config.name}...`, 'success');
        window.open(config.url, '_blank');
    };

    return (
        <div className="w-full space-y-6 animate-fade-in-up">
            {/* Post Preview */}
            <div className="bg-slate-800/40 p-5 rounded-lg border border-slate-700/80">
                <div className="flex justify-between items-start">
                    <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex-shrink-0 mr-3"></div>
                        <div>
                            <p className="font-bold text-white">Your Brand</p>
                            <p className="text-slate-400 text-sm">@yourhandle</p>
                        </div>
                    </div>
                    <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <div className="mt-3 space-y-3">
                    <p className="text-slate-300 whitespace-pre-wrap">{content.copy}</p>
                    <p className="text-sky-400">{content.hashtags}</p>
                </div>
            </div>

            {/* Visual Assistant */}
            <div className="bg-slate-800/40 p-5 rounded-lg border border-slate-700/80">
                <h3 className="font-semibold text-white mb-3 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-3 text-slate-400" />
                    Proactive Visual Assistant
                </h3>
                <p className="text-sm text-slate-400 mb-4 italic">"{content.imagePrompt}"</p>
                <button
                    onClick={() => onGenerateImage(content.imagePrompt)}
                    className="w-full sm:w-auto flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Generate this Image
                </button>
            </div>

            {/* Actions */}
            <div className="bg-slate-800/40 p-5 rounded-lg border border-slate-700/80">
                 <h3 className="font-semibold text-white mb-4">Next Steps</h3>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handlePublish}
                        className="flex-1 flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all"
                    >
                        <Icon className="w-5 h-5 mr-2" />
                        Copy &amp; Go
                    </button>
                    <button
                        onClick={() => onAnalyzeResonance(fullPostText)}
                        className="flex-1 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-all"
                    >
                        <ResonanceIcon className="w-5 h-5 mr-2" />
                        Analyze Resonance
                    </button>
                    
                    {/* CONTEXTUAL UPSELL */}
                    {onUpgrade && (
                         <button
                            onClick={onUpgrade}
                            className="flex-1 flex items-center justify-center bg-slate-800 border border-slate-700 hover:border-[var(--gradient-start)] text-slate-300 font-semibold py-3 rounded-lg transition-all group"
                        >
                            <AgentIcon className="w-5 h-5 mr-2 text-slate-500 group-hover:text-[var(--gradient-start)] transition-colors" />
                            Schedule with Agent (Pro)
                        </button>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default SocialPostOutput;
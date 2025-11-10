import React, { useState } from 'react';
import { CampaignHistoryItem, GeneratedContent, SocialPostContent, EmailContent, AdContent, BlogContent } from '../types';
import SocialPostPreview from './previews/SocialPostPreview';
import EmailPreview from './previews/EmailPreview';
import PlaybookIcon from './icons/PlaybookIcon';
import XIcon from './icons/XIcon';
import SocialIcon from './icons/SocialIcon';
import EmailIcon from './icons/EmailIcon';
import AdIcon from './icons/AdIcon';
import BlogIcon from './icons/BlogIcon';
import SparklesIcon from './icons/SparklesIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';


const assetIcons: { [key: string]: React.FC<{ className?: string }> } = {
    'Social Media Post': SocialIcon,
    'Marketing Email': EmailIcon,
    'Ad Copy': AdIcon,
    'Blog Post Ideas': BlogIcon,
};


const AssetPreview: React.FC<{ content: GeneratedContent }> = ({ content }) => {
    switch(content.type) {
        case 'social':
            return <SocialPostPreview content={content as SocialPostContent} brandProfile={null} />;
        case 'email':
            return <EmailPreview content={content as EmailContent} isReadOnly={true} />;
        case 'ad':
            const adContent = content as AdContent;
            return <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/80 text-sm h-full"><p className="font-bold text-white mb-1">{adContent.headline}</p><p className="text-slate-300">{adContent.body}</p></div>;
        case 'blog':
            const blogContent = content as BlogContent;
            return <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/80 space-y-3 text-sm h-full">{blogContent.ideas.map((idea, i) => (<div key={i}><p className="font-bold text-white">{idea.title}</p><p className="text-slate-300">{idea.description}</p></div>))}</div>;
        default:
            return <div className="p-3 bg-slate-700 text-xs rounded-md">Unsupported content format for preview.</div>;
    }
};

interface CampaignPreviewModalProps {
    campaign: CampaignHistoryItem;
    onClose: () => void;
}

const CampaignPreviewModal: React.FC<CampaignPreviewModalProps> = ({ campaign, onClose }) => {
    const [openPhaseIndex, setOpenPhaseIndex] = useState<number>(0);

    const togglePhase = (index: number) => {
        setOpenPhaseIndex(openPhaseIndex === index ? -1 : index);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-0" onClick={onClose}>
            <div 
                className="bg-slate-900 border border-slate-800 shadow-2xl w-full h-full flex flex-col transform transition-all animate-pop-in rounded-none relative"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 z-20 h-12 w-12 flex items-center justify-center rounded-full bg-black/50 text-slate-300 hover:bg-black/70 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Close campaign preview"
                >
                    <XIcon className="w-7 h-7" />
                </button>

                <header className="p-4 md:p-6 border-b border-slate-800 flex items-start flex-shrink-0 pr-24">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-800 rounded-lg flex-shrink-0">
                            <PlaybookIcon className="w-6 h-6 text-[var(--gradient-start)]" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-white line-clamp-2">{campaign.campaignTitle}</h2>
                            <p className="text-xs text-slate-400 mt-1">
                                Created: {new Date(campaign.timestamp).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </header>
                
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <div className="space-y-4">
                        {campaign.strategy.phases.map((phase: any, phaseIndex: number) => (
                            <div key={phaseIndex} className="bg-slate-800/40 border border-slate-700/50 rounded-lg overflow-hidden transition-all duration-300">
                                <button
                                    onClick={() => togglePhase(phaseIndex)}
                                    className="w-full flex justify-between items-center p-4 text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 transition-colors ${openPhaseIndex === phaseIndex ? 'bg-[var(--gradient-start)] text-white' : 'bg-slate-700 text-slate-300'}`}>
                                            {phaseIndex + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{phase.name}</h3>
                                            <p className="text-sm text-slate-400">{phase.description}</p>
                                        </div>
                                    </div>
                                    <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform flex-shrink-0 ml-4 ${openPhaseIndex === phaseIndex ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {openPhaseIndex === phaseIndex && (
                                    <div className="p-4 border-t border-slate-700/50 animate-fade-in-up">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {phase.assets.map((asset: any, assetIndex: number) => {
                                                const AssetIcon = assetIcons[asset.contentType] || SparklesIcon;
                                                return (
                                                    <div key={asset.id || assetIndex} className="bg-slate-800/70 rounded-lg border border-slate-700 flex flex-col">
                                                        <div className="p-3 border-b border-slate-700">
                                                            <div className="flex items-center gap-3">
                                                                <AssetIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                                <h4 className="font-semibold text-slate-200">{asset.contentType}</h4>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-black/20 flex-grow">
                                                            {asset.content 
                                                                ? <AssetPreview content={asset.content} /> 
                                                                : <p className="text-xs text-slate-500 text-center py-4">Content not available.</p>
                                                            }
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CampaignPreviewModal;
import React, { useState, useEffect } from 'react';
import { User, HistoryItem, CampaignHistoryItem } from '../types';
import { onHistorySnapshot, clearUserHistory, deleteHistoryDoc, onCampaignsSnapshot, deleteCampaignDoc } from '../services/firebaseService';
import { useToast } from '../contexts/ToastContext';
import HistoryIcon from './icons/HistoryIcon';
import PlaybookIcon from './icons/PlaybookIcon';
import TrashIcon from './icons/TrashIcon';
import ReuseIcon from './icons/ReuseIcon';
import CopyIcon from './icons/CopyIcon';
import FilmIcon from './icons/FilmIcon';
import ConfirmationModal from './ConfirmationModal';
import CampaignPreviewModal from './CampaignPreviewModal';
import { markdownToHtml } from './Dashboard';
import SparklesIcon from './icons/SparklesIcon';
import EditIcon from './icons/EditIcon';
import SocialIcon from './icons/SocialIcon';
import BlogIcon from './icons/BlogIcon';
import EmailIcon from './icons/EmailIcon';
import AdIcon from './icons/AdIcon';
import VideoIcon from './icons/VideoIcon';
import ImageIcon from './icons/ImageIcon';
import EditImageIcon from './icons/EditImageIcon';
import CampaignIcon from './icons/CampaignIcon';
import ResonanceIcon from './icons/ResonanceIcon';
import ViralVideoIdeaIcon from './icons/ViralVideoIdeaIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import SignalIcon from './icons/SignalIcon';
import PaintBrushIcon from './icons/PaintBrushIcon';


interface HistoryViewProps {
    user: User;
    onReuse: (item: HistoryItem) => void;
    onCopy: (content: string, templateName: string, itemTopic?: string) => void;
    onEdit: (item: HistoryItem) => void;
    initialTab?: 'tools' | 'campaigns';
}

const templateIcons: { [key: string]: React.FC<{className?: string}> } = {
  "Campaign Builder": CampaignIcon,
  "Resonance Engine": ResonanceIcon,
  "Market Signal Analyzer": SignalIcon,
  "SEO Content Strategist": BrainCircuitIcon,
  "AI Ad Creative Studio": PaintBrushIcon,
  "AI Image Generator": ImageIcon,
  "AI Image Editor": EditImageIcon,
  "Marketing Video Ad": FilmIcon,
  "Social Media Post": SocialIcon,
  "Viral Video Idea Generator": ViralVideoIdeaIcon,
  "Viral Video Blueprint": ViralVideoIdeaIcon,
  "Blog Post Ideas": BlogIcon,
  "Marketing Email": EmailIcon,
  "Ad Copy": AdIcon,
};


const HistorySkeleton: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/70 flex items-start space-x-4">
                <div className="w-16 h-16 rounded-md bg-slate-700 flex-shrink-0"></div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="h-5 bg-slate-700 rounded w-32" /> {/* Template name badge */}
                            <div className="h-3 bg-slate-700 rounded w-48" /> {/* Date */}
                        </div>
                        <div className="flex-shrink-0 ml-4">
                             <div className="h-8 w-32 bg-slate-700 rounded-md" /> {/* Button group placeholder */}
                        </div>
                    </div>
                    <div className="h-4 bg-slate-700 rounded w-3/4 mt-3" /> {/* Topic line */}
                </div>
            </div>
        ))}
    </div>
);

const CampaignHistorySkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 p-5 rounded-lg border border-slate-700/70 flex flex-col justify-between">
                <div className="space-y-3">
                    <div className="h-5 bg-slate-700 rounded w-3/4 mb-1" /> {/* title */}
                    <div className="h-4 bg-slate-700 rounded w-full" /> {/* goal line 1 */}
                    <div className="h-4 bg-slate-700 rounded w-1/2" /> {/* goal line 2 */}
                </div>
                <div className="flex justify-between items-center mt-6">
                    <div className="h-3 bg-slate-700 rounded w-24" /> {/* date */}
                    <div className="h-8 bg-slate-700 rounded-md w-20" /> {/* button */}
                </div>
            </div>
        ))}
    </div>
);

const HistoryView: React.FC<HistoryViewProps> = ({ user, onReuse, onCopy, onEdit, initialTab = 'tools' }) => {
    const [activeTab, setActiveTab] = useState<'tools' | 'campaigns'>(initialTab);
    
    // State for Tools History
    const [toolHistory, setToolHistory] = useState<HistoryItem[]>([]);
    const [isToolHistoryLoading, setIsToolHistoryLoading] = useState(true);
    const [showClearToolsModal, setShowClearToolsModal] = useState(false);
    const [isClearingTools, setIsClearingTools] = useState(false);
    const [toolItemToDelete, setToolItemToDelete] = useState<HistoryItem | null>(null);
    const [isDeletingToolItem, setIsDeletingToolItem] = useState(false);

    // State for Campaign History
    const [campaignHistory, setCampaignHistory] = useState<CampaignHistoryItem[]>([]);
    const [isCampaignHistoryLoading, setIsCampaignHistoryLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState<CampaignHistoryItem | null>(null);
    const [campaignToDelete, setCampaignToDelete] = useState<CampaignHistoryItem | null>(null);
    const [isDeletingCampaignItem, setIsDeletingCampaignItem] = useState(false);

    const { addToast } = useToast();

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        const startTime = Date.now();
        const MIN_LOADING_TIME = 600; // milliseconds

        const unsubscribe = onHistorySnapshot(user.uid, (userHistory) => {
            const sortedHistory = userHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            if (isToolHistoryLoading) {
                const elapsedTime = Date.now() - startTime;
                const delay = Math.max(0, MIN_LOADING_TIME - elapsedTime);

                setTimeout(() => {
                    setToolHistory(sortedHistory);
                    setIsToolHistoryLoading(false);
                }, delay);
            } else {
                setToolHistory(sortedHistory);
            }
        });
        return () => {
            unsubscribe();
            setIsToolHistoryLoading(true);
        };
    }, [user.uid]);

     useEffect(() => {
        const startTime = Date.now();
        const MIN_LOADING_TIME = 600; // milliseconds

        const unsubscribe = onCampaignsSnapshot(user.uid, (campaigns) => {
            const sortedCampaigns = campaigns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            if (isCampaignHistoryLoading) {
                const elapsedTime = Date.now() - startTime;
                const delay = Math.max(0, MIN_LOADING_TIME - elapsedTime);

                setTimeout(() => {
                    setCampaignHistory(sortedCampaigns);
                    setIsCampaignHistoryLoading(false);
                }, delay);
            } else {
                 setCampaignHistory(sortedCampaigns);
            }
        });
        return () => {
            unsubscribe();
            setIsCampaignHistoryLoading(true);
        };
    }, [user.uid]);

    const handleConfirmClearToolsHistory = async () => {
        setIsClearingTools(true);
        try {
            await clearUserHistory(user.uid);
            addToast('Tool generation history cleared.', 'info');
        } catch (err: any) {
            addToast(err.message || 'Failed to clear history.', 'error');
        } finally {
            setIsClearingTools(false);
            setShowClearToolsModal(false);
        }
    };

    const handleConfirmDeleteToolItem = async () => {
        if (!toolItemToDelete) return;
        setIsDeletingToolItem(true);
        try {
            await deleteHistoryDoc(toolItemToDelete.id);
            addToast('History item deleted.', 'info');
            setToolItemToDelete(null);
        } catch (err: any) {
            addToast(err.message || 'Failed to delete item.', 'error');
        } finally {
            setIsDeletingToolItem(false);
        }
    };
    
    const handleConfirmDeleteCampaign = async () => {
        if (!campaignToDelete) return;
        setIsDeletingCampaignItem(true);
        try {
            await deleteCampaignDoc(campaignToDelete.id);
            addToast('Campaign deleted from playbook.', 'info');
            setCampaignToDelete(null);
        } catch (err: any) {
            addToast(err.message || 'Failed to delete campaign.', 'error');
        } finally {
            setIsDeletingCampaignItem(false);
        }
    };

    const promptCopyTools = ["AI Image Generator", "AI Image Editor", "Marketing Video Ad"];
    const reportCopyTools = ["Resonance Engine", "Market Signal Analyzer", "SEO Content Strategist", "AI Ad Creative Studio", "Viral Video Blueprint"];


    return (
        <div className="flex-1 flex flex-col bg-slate-900 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30">
            {selectedCampaign && <CampaignPreviewModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />}
            {showClearToolsModal && <ConfirmationModal
                isOpen={showClearToolsModal}
                onClose={() => setShowClearToolsModal(false)}
                onConfirm={handleConfirmClearToolsHistory}
                title="Clear Tool History?"
                message={<p>This action is irreversible. All your tool-generated content history will be permanently deleted.</p>}
                confirmButtonText="Yes, Clear Tool History"
                isConfirming={isClearingTools}
            />}
            {toolItemToDelete && <ConfirmationModal
                isOpen={!!toolItemToDelete}
                onClose={() => setToolItemToDelete(null)}
                onConfirm={handleConfirmDeleteToolItem}
                title="Delete History Item?"
                message={<p>This action is irreversible. This history item will be permanently deleted.</p>}
                confirmButtonText="Yes, Delete Item"
                isConfirming={isDeletingToolItem}
            />}
            {campaignToDelete && <ConfirmationModal
                isOpen={!!campaignToDelete}
                onClose={() => setCampaignToDelete(null)}
                onConfirm={handleConfirmDeleteCampaign}
                title="Delete Campaign?"
                message={<p>This will permanently delete the campaign from your playbook. This action cannot be undone.</p>}
                confirmButtonText="Yes, Delete Campaign"
                isConfirming={isDeletingCampaignItem}
            />}

            <div className="p-6 border-b border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <HistoryIcon className="w-8 h-8 text-[var(--gradient-start)]" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Generation History</h1>
                        <p className="text-slate-400 mt-1">Review, reuse, and manage all your generated content and campaigns.</p>
                    </div>
                </div>
            </div>

            <div className="p-4 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('tools')} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'tools' ? 'bg-slate-700/80 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <SparklesIcon className="w-4 h-4" /> Tools
                    </button>
                    <button onClick={() => setActiveTab('campaigns')} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'campaigns' ? 'bg-slate-700/80 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <PlaybookIcon className="w-4 h-4" /> Campaign Playbook
                    </button>
                </div>
                {activeTab === 'tools' && toolHistory.length > 0 && 
                    <button onClick={() => setShowClearToolsModal(true)} disabled={isClearingTools} className="flex items-center text-sm font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-red-400 hover:border-red-400/50 rounded-lg px-3 py-1.5 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        <TrashIcon className="w-4 h-4 mr-2"/> Clear All
                    </button>
                }
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === 'tools' && (
                    isToolHistoryLoading ? <HistorySkeleton /> : toolHistory.length > 0 ? (
                        <div className="space-y-4">
                            {toolHistory.map(item => {
                                const isImageItem = item.templateName === 'AI Image Generator' || item.templateName === 'AI Image Editor';
                                const shouldCopyPrompt = promptCopyTools.includes(item.templateName);
                                const shouldCopyContent = reportCopyTools.includes(item.templateName);
                                
                                const copyButtonText = shouldCopyPrompt ? "Copy Prompt" : (shouldCopyContent ? "Copy Content" : "Copy Content");
                                const Icon = templateIcons[item.templateName] || SparklesIcon;
                                return (
                                <div key={item.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/70 flex items-start">
                                    <div className="w-16 h-16 rounded-md mr-4 flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
                                        {(isImageItem && item.content.startsWith('data:image')) ? (
                                            <img src={item.content} alt={item.topic} className="w-full h-full object-cover" />
                                        ) : (
                                            <Icon className="w-8 h-8 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <div>
                                        <span className="text-xs bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-full">{item.templateName}</span>
                                        <p className="text-xs text-slate-500 mt-2">{new Date(item.timestamp).toLocaleString()}</p>
                                        </div>
                                        <div className="flex-shrink-0 ml-2 md:ml-4">
                                            <div className="flex items-center text-sm text-slate-400">
                                                {/* EDIT BUTTON */}
                                                {item.content.startsWith('data:image') && (
                                                    <>
                                                        <button onClick={() => onEdit(item)} className="flex items-center p-2 hover:text-white transition-colors" title="Edit Image">
                                                            <EditIcon className="w-4 h-4 md:mr-1.5" />
                                                            <span className="hidden md:inline">Edit</span>
                                                        </button>
                                                        <div className="w-px h-4 bg-slate-700 mx-1 md:mx-2"></div>
                                                    </>
                                                )}

                                                {/* REUSE BUTTON */}
                                                {item.templateName !== "Marketing Video Ad" && (
                                                    <>
                                                        <button onClick={() => onReuse(item)} className="flex items-center p-2 hover:text-white transition-colors" title="Reuse">
                                                            <ReuseIcon className="w-4 h-4 md:mr-1.5" />
                                                            <span className="hidden md:inline">Reuse</span>
                                                        </button>
                                                        <div className="w-px h-4 bg-slate-700 mx-1 md:mx-2"></div>
                                                    </>
                                                )}

                                                {/* COPY BUTTON */}
                                                <button onClick={() => onCopy(item.content, item.templateName, item.topic)} className="flex items-center p-2 hover:text-white transition-colors" title={copyButtonText}>
                                                    <CopyIcon className="w-4 h-4 md:mr-1.5" />
                                                    <span className="hidden md:inline">{copyButtonText}</span>
                                                </button>

                                                <div className="w-px h-4 bg-slate-700 mx-1 md:mx-2"></div>

                                                {/* DELETE BUTTON */}
                                                <button onClick={() => setToolItemToDelete(item)} className="flex items-center p-2 hover:text-red-400 transition-colors" title="Delete">
                                                    <TrashIcon className="w-4 h-4 md:mr-1.5" />
                                                    <span className="hidden md:inline">Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-slate-300 mt-3 text-sm line-clamp-2 pr-4">{item.topic}</p>
                                    </div>
                                </div>
                            )})}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                            <HistoryIcon className="w-16 h-16 mb-4 text-slate-700"/>
                            <h3 className="font-semibold text-slate-400">No history yet</h3>
                            <p>Your generated content will appear here.</p>
                        </div>
                    )
                )}
                {activeTab === 'campaigns' && (
                    isCampaignHistoryLoading ? <CampaignHistorySkeleton /> : campaignHistory.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaignHistory.map(campaign => (
                                <div key={campaign.id} className="bg-slate-800/50 p-5 rounded-lg border border-slate-700/70 flex flex-col justify-between group">
                                    <div>
                                        <h3 className="font-bold text-white mb-1 line-clamp-2">{campaign.campaignTitle}</h3>
                                        <p className="text-sm text-slate-400 line-clamp-3 mb-3">Goal: {campaign.goal}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-slate-500">{new Date(campaign.timestamp).toLocaleDateString()}</p>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setCampaignToDelete(campaign)} 
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                aria-label="Delete campaign"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setSelectedCampaign(campaign)} className="text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md transition-colors">
                                                Open
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                            <PlaybookIcon className="w-16 h-16 mb-4 text-slate-700"/>
                            <h3 className="font-semibold text-slate-400">No campaigns in your playbook</h3>
                            <p>Campaigns you create with the Campaign Builder will appear here.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default HistoryView;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Agent, AgentTask, AgentLog, GeneratedContent, SocialPostContent, EmailContent, AdContent, BlogContent, AgentPersona, BrandProfile } from '../types';
import { onAgentTasksSnapshot, onAgentLogsSnapshot, addAgentLogDoc, updateAgentTaskDoc, updateAgentDoc, getBrandProfile } from '../services/firebaseService';
import { generateStructuredContent } from '../services/geminiService';
import { Type } from "@google/genai";
import AgentStatusBadge from './AgentStatusBadge';
import HourglassIcon from './icons/HourglassIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import EyeIcon from './icons/EyeIcon';
import ClockIcon from './icons/ClockIcon';
import ExternalLinkIcon from './icons/ExternalLinkIcon';
import { useToast } from '../contexts/ToastContext';
import MegaphoneIcon from './icons/MegaphoneIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import RocketIcon from './icons/RocketIcon';
import EmailIcon from './icons/EmailIcon';
import SocialPostPreview from './previews/SocialPostPreview';
import EmailPreview from './previews/EmailPreview';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';

interface AgentDetailViewProps {
    agent: Agent | undefined;
    onBack: () => void;
}

const personaIcons: Record<AgentPersona, React.FC<{className?: string}>> = {
    [AgentPersona.SocialMediaManager]: MegaphoneIcon,
    [AgentPersona.ContentStrategist]: LightbulbIcon,
    [AgentPersona.EmailMarketer]: EmailIcon,
    [AgentPersona.GrowthHacker]: RocketIcon,
};

const TaskStatusIcon: React.FC<{ status: AgentTask['status'] }> = ({ status }) => {
    switch (status) {
        case 'completed': return <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mr-3 mt-0.5 text-green-400" />;
        case 'needs_review': return <EyeIcon className="w-5 h-5 flex-shrink-0 mr-3 mt-0.5 text-yellow-400" />;
        case 'executing': return <HourglassIcon className="w-5 h-5 flex-shrink-0 mr-3 mt-0.5 text-blue-400 animate-spin" />;
        case 'scheduled': return <ClockIcon className="w-5 h-5 flex-shrink-0 mr-3 mt-0.5 text-sky-400" />;
        case 'pending':
        default:
            return (
                 <div className="w-5 h-5 flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full border-2 border-slate-600"></div>
                </div>
            )
    }
};

const ExecutionToolkit: React.FC<{
    content: GeneratedContent;
    onMarkComplete: () => void;
    isProcessing: boolean;
}> = ({ content, onMarkComplete, isProcessing }) => {
    const { addToast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);

    const isSocialPost = content.type === 'social';
    
    const copyToClipboard = () => {
        let textToCopy = '';
        if (content.type === 'social') {
            textToCopy = `${content.copy}\n\n${content.hashtags}`;
        } else if (content.type === 'email') {
            textToCopy = `Subject: ${content.subject}\n\n${content.body}`;
        } else if (content.type === 'ad') {
            textToCopy = `Headline: ${content.headline}\nBody: ${content.body}`;
        } else if (content.type === 'blog') {
            textToCopy = content.ideas.map(i => `- ${i.title}\n  ${i.description}`).join('\n\n');
        }
        navigator.clipboard.writeText(textToCopy);
        addToast('Content copied to clipboard!', 'success');
        setHasCopied(true);
    };
    
    const openPlatform = () => {
        if (content.type === 'social') {
            let url = '';
            switch(content.platform) {
                case 'Twitter': url = 'https://twitter.com/intent/tweet'; break;
                case 'LinkedIn': url = 'https://www.linkedin.com/feed/?shareActive=true'; break;
                case 'Facebook': url = 'https://www.facebook.com/'; break;
            }
            if (url) window.open(url, '_blank');
        } else if (content.type === 'email') {
            const subject = encodeURIComponent(content.subject);
            const body = encodeURIComponent(content.body);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
            window.open(gmailUrl, '_blank');
        }
    };

    const getPlatformButtonText = () => {
        if (content.type === 'social') {
            return `Open ${content.platform === 'Twitter' ? 'X/Twitter' : content.platform}`;
        }
        if (content.type === 'email') {
            return 'Open in Gmail';
        }
        return 'Open Platform';
    };

    return (
        <div className="mt-4 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Execution Toolkit</h4>
            <div className="flex flex-wrap gap-3">
                <button onClick={copyToClipboard} className="flex items-center text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-1.5 px-3 rounded-md transition-colors">
                    <CopyIcon className="w-4 h-4 mr-1.5"/> Copy Content
                </button>
                 {(content.type === 'social' || content.type === 'email') && (
                    <button onClick={openPlatform} className="flex items-center text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-1.5 px-3 rounded-md transition-colors">
                        <ExternalLinkIcon className="w-4 h-4 mr-1.5"/> {getPlatformButtonText()}
                    </button>
                 )}
                <button 
                    onClick={onMarkComplete} 
                    disabled={isProcessing || !hasCopied}
                    className="flex items-center text-sm bg-green-500/10 hover:bg-green-500/20 text-green-400 font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <CheckIcon className="w-4 h-4 mr-1.5"/> Mark as Completed
                </button>
            </div>
             {isSocialPost && <p className="text-xs text-slate-500 mt-2">Hint: Generate and download the image from the preview above before posting.</p>}
        </div>
    )
}

const TaskCard: React.FC<{ 
    task: AgentTask, 
    brandProfile: BrandProfile | null, 
    onMarkComplete: (taskId: string, finalContent: string) => void,
    onRevise: (taskId: string) => void,
    isProcessing: boolean,
}> = ({ task, brandProfile, onMarkComplete, onRevise, isProcessing }) => {
    const originalContent = useMemo(() => {
        try {
            return JSON.parse(task.generatedContent || '{}') as GeneratedContent;
        } catch (e) {
            return null;
        }
    }, [task.generatedContent]);
    
    const [editedContent, setEditedContent] = useState<GeneratedContent | null>(originalContent);

    useEffect(() => {
        setEditedContent(originalContent);
    }, [originalContent]);
    
    const handleContentChange = (newContent: GeneratedContent) => {
        setEditedContent(newContent);
    };
    
    if (!originalContent || !editedContent) {
        return <div className="p-3 bg-red-900/50 text-red-300 text-sm rounded-md">Error parsing generated content.</div>;
    }
    
    const renderContentPreview = () => {
        switch (editedContent.type) {
            case 'social':
                return <SocialPostPreview content={editedContent as SocialPostContent} onChange={handleContentChange} brandProfile={brandProfile} />;
            case 'email':
                return <EmailPreview content={editedContent as EmailContent} onChange={handleContentChange} />;
            case 'ad':
                const adContent = editedContent as AdContent;
                return <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/80">
                    <p className="text-sm font-semibold text-slate-400">Headline</p>
                    <p className="font-bold text-white mb-2">{adContent.headline}</p>
                    <p className="text-sm font-semibold text-slate-400">Body</p>
                    <p className="text-slate-300 whitespace-pre-wrap">{adContent.body}</p>
                </div>
            case 'blog':
                const blogContent = editedContent as BlogContent;
                 return <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/80 space-y-3">
                    {blogContent.ideas.map((idea, i) => (
                        <div key={i}>
                            <p className="font-bold text-white">{idea.title}</p>
                            <p className="text-sm text-slate-300">{idea.description}</p>
                        </div>
                    ))}
                </div>
            default:
                return <p className="text-sm text-slate-300">{task.generatedContent}</p>;
        }
    }

    return (
        <div>
            {renderContentPreview()}
            <ExecutionToolkit
                content={editedContent}
                onMarkComplete={() => onMarkComplete(task.id, JSON.stringify(editedContent))}
                isProcessing={isProcessing}
            />
        </div>
    )
}

const AgentDetailView: React.FC<AgentDetailViewProps> = ({ agent, onBack }) => {
    const [tasks, setTasks] = useState<AgentTask[]>([]);
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'plan' | 'log'>('plan');
    const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        if (!agent) return;
        setIsLoading(true);
        getBrandProfile(agent.userId).then(setBrandProfile);

        const unsubscribeTasks = onAgentTasksSnapshot(agent.userId, agent.id, (agentTasks) => {
            setTasks(agentTasks);

            // Calculate and update agent stats
            const stats = {
                total: agentTasks.length,
                completed: agentTasks.filter(t => t.status === 'completed').length,
                needsReview: agentTasks.filter(t => t.status === 'needs_review').length,
            };

            // This update ensures the main agent list view has the latest progress
            updateAgentDoc(agent.userId, agent.id, { taskStats: stats });
        });

        const unsubscribeLogs = onAgentLogsSnapshot(agent.userId, agent.id, (agentLogs) => {
            const sortedLogs = agentLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            setLogs(sortedLogs);
            setIsLoading(false);
        });
        return () => { unsubscribeTasks(); unsubscribeLogs(); };
    }, [agent]);
    
    const executeTask = useCallback(async (task: AgentTask) => {
        if (!agent || !brandProfile) return;
        try {
            await updateAgentTaskDoc(agent.userId, agent.id, task.id, { status: 'executing' });
            await addAgentLogDoc(agent.userId, agent.id, { agentId: agent.id, userId: agent.userId, message: `Executing task: "${task.description}"`, timestamp: new Date().toISOString() });
            
            // Add a realistic delay to simulate work and avoid rapid firing API calls
            await new Promise(resolve => setTimeout(resolve, 3000));

            let prompt = `You are an AI Agent with the persona of a ${agent.persona}. Your current task is: "${task.description}".\n\nBrand info:\n- Tone: ${brandProfile.toneOfVoice}\n- Product: ${brandProfile.productDescription}\n\nGenerate the required content.`;
            let schema;

            if (task.contentType === 'Social Media Post') {
                 schema = {
                    type: Type.OBJECT, properties: {
                        type: { type: Type.STRING, description: "Must be 'social'" },
                        platform: { type: Type.STRING, description: "Suggest a platform: 'Twitter', 'LinkedIn', or 'Facebook'." },
                        copy: { type: Type.STRING, description: "The main body of the post, under 280 characters for Twitter." },
                        hashtags: { type: Type.STRING, description: "3-4 relevant hashtags, space-separated, with #." },
                        imagePrompt: { type: Type.STRING, description: "A detailed prompt for an AI image generator." }
                    }, required: ["type", "platform", "copy", "hashtags", "imagePrompt"]
                };
            } else if (task.contentType === 'Marketing Email') {
                 schema = {
                    type: Type.OBJECT, properties: {
                        type: { type: Type.STRING, description: "Must be 'email'" },
                        subject: { type: Type.STRING, description: "A catchy and professional email subject line." },
                        body: { type: Type.STRING, description: "The full email body text, formatted with newlines for paragraphs." },
                        cta: { type: Type.STRING, description: "A clear call-to-action phrase." }
                    }, required: ["type", "subject", "body", "cta"]
                };
            } else if (task.contentType === 'Ad Copy') {
                schema = {
                   type: Type.OBJECT, properties: {
                       type: { type: Type.STRING, description: "Must be 'ad'" },
                       headline: { type: Type.STRING, description: "A short, punchy headline for the ad." },
                       body: { type: Type.STRING, description: "The main description/body text for the ad." },
                   }, required: ["type", "headline", "body"]
               };
           } else if (task.contentType === 'Blog Post Ideas') {
                schema = {
                   type: Type.OBJECT, properties: {
                       type: { type: Type.STRING, description: "Must be 'blog'" },
                       ideas: {
                           type: Type.ARRAY,
                           description: "A list of 3-5 blog post ideas.",
                           items: {
                               type: Type.OBJECT,
                               properties: {
                                   title: { type: Type.STRING, description: "A creative and SEO-friendly title." },
                                   description: { type: Type.STRING, description: "A one-sentence summary of the blog post." }
                               },
                               required: ["title", "description"]
                           }
                       }
                   }, required: ["type", "ideas"]
               };
           } else { 
                throw new Error(`Agent does not support automated generation for content type: ${task.contentType}`);
            }

            const generatedData = await generateStructuredContent(prompt, schema);
            await updateAgentTaskDoc(agent.userId, agent.id, task.id, {
                generatedContent: JSON.stringify(generatedData),
                status: 'needs_review'
            });
            await addAgentLogDoc(agent.userId, agent.id, { agentId: agent.id, userId: agent.userId, message: "Generated content. Awaiting user approval.", timestamp: new Date().toISOString() });
        } catch (err: any) {
            console.error("Error executing task:", err);
            const errorMessage = `Agent failed on task: "${task.description}". Reason: ${err.message}`;
            addToast(errorMessage, 'error');
            await addAgentLogDoc(agent.userId, agent.id, { agentId: agent.id, userId: agent.userId, message: errorMessage, timestamp: new Date().toISOString() });
            // Revert task to pending so it can be retried or handled manually
            await updateAgentTaskDoc(agent.userId, agent.id, task.id, { status: 'pending' });
        }
    }, [agent, brandProfile, addToast]);

    useEffect(() => {
        if (agent?.status === 'active' && brandProfile) {
            const pendingTask = tasks.find(t => t.status === 'pending');
            const isExecuting = tasks.some(t => t.status === 'executing');
            if (pendingTask && !isExecuting) {
                executeTask(pendingTask);
            } else if (!pendingTask && !isExecuting && tasks.length > 0 && tasks.every(t => t.status === 'completed')) {
                updateAgentDoc(agent.userId, agent.id, { status: 'completed' });
                addAgentLogDoc(agent.userId, agent.id, { agentId: agent.id, userId: agent.userId, message: "All tasks completed. Agent mission fulfilled.", timestamp: new Date().toISOString() });
            }
        }
    }, [tasks, agent?.status, brandProfile, executeTask, agent]);

    const handleMarkComplete = async (taskId: string, finalContent: string) => {
        if (!agent) return;
        setProcessingTaskId(taskId);
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            setProcessingTaskId(null);
            return;
        }

        try {
            await updateAgentTaskDoc(agent.userId, agent.id, taskId, { status: 'completed', generatedContent: finalContent });
            await addAgentLogDoc(agent.userId, agent.id, { agentId: agent.id, userId: agent.userId, message: `User marked task as complete: "${task.description}"`, timestamp: new Date().toISOString() });
            addToast("Task marked as complete!", "success");
        } catch (err) {
            addToast("Failed to update task.", "error");
        } finally {
            setProcessingTaskId(null);
        }
    };

    const handleRevise = async (taskId: string) => {
        if (!agent) return;
        setProcessingTaskId(taskId);
        const taskToRevise = tasks.find(t => t.id === taskId);
        try {
            await updateAgentTaskDoc(agent.userId, agent.id, taskId, { status: 'pending', generatedContent: '' });
            await addAgentLogDoc(agent.userId, agent.id, { agentId: agent.id, userId: agent.userId, message: `User requested revision for: "${taskToRevise?.description}"`, timestamp: new Date().toISOString() });
            addToast("Revision requested. Agent will regenerate content.", "info");
        } catch(err) {
            addToast("Failed to request revision.", "error");
        } finally {
            setProcessingTaskId(null);
        }
    };

    if (!agent) {
        return <div className="flex-1 flex items-center justify-center text-slate-400">Agent not found. Please go back.</div>;
    }
    
    const PersonaIcon = personaIcons[agent.persona];
    const approvedAssets = tasks.filter(t => t.status === 'completed' && t.generatedContent);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <header className="flex-shrink-0 p-6">
                <button onClick={onBack} className="text-sm text-slate-400 hover:text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Back to Command Center
                </button>
                <div className="flex justify-between items-start">
                    <div className="flex items-start">
                         <div className="p-3 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 mr-4 flex-shrink-0">
                            <PersonaIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
                            <p className="text-slate-400 font-medium">{agent.persona}</p>
                        </div>
                    </div>
                    <AgentStatusBadge status={agent.status} />
                </div>
                <p className="text-slate-300 mt-4 pt-4 border-t border-slate-800/80">{agent.goal}</p>
            </header>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6 overflow-hidden">
                {/* Left Column: Plan & Logs */}
                <section className="flex flex-col bg-slate-900 rounded-xl border border-slate-800/80 shadow-inner shadow-black/30 overflow-hidden">
                    <header className="flex-shrink-0 p-4 border-b border-slate-800/80">
                        <div className="flex gap-2">
                            <button onClick={() => setActiveTab('plan')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'plan' ? 'bg-slate-700/80 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Agent Plan</button>
                            <button onClick={() => setActiveTab('log')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'log' ? 'bg-slate-700/80 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Activity Log</button>
                        </div>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto">
                        {activeTab === 'plan' && (
                             <div className="space-y-4">
                                {tasks.map((task) => (
                                    <div key={task.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/70 transition-all duration-300">
                                        <div className="flex items-start">
                                            <TaskStatusIcon status={task.status} />
                                            <div className="flex-1">
                                                <p className={`font-semibold ${task.status === 'completed' ? 'text-slate-500' : 'text-slate-200'}`}>
                                                    {task.contentType}
                                                </p>
                                                <p className={`text-sm ${task.status === 'completed' ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                                                    {task.description}
                                                </p>
                                            </div>
                                        </div>
                                        {task.status === 'needs_review' && (
                                           <div className="mt-4 pt-4 border-t border-slate-700/50">
                                            <TaskCard task={task} brandProfile={brandProfile} onMarkComplete={handleMarkComplete} onRevise={handleRevise} isProcessing={processingTaskId === task.id} />
                                           </div>
                                        )}
                                    </div>
                                ))}
                                {tasks.length === 0 && agent.status === 'planning' && (
                                    <div className="text-center p-8 text-sm text-slate-400 border-2 border-dashed border-slate-800 rounded-lg">Agent is generating a strategic plan...</div>
                                )}
                            </div>
                        )}
                         {activeTab === 'log' && (
                             <div className="text-sm font-mono space-y-2">
                                {logs.map(log => (
                                    <div key={log.id} className="flex">
                                        <span className="text-slate-500 mr-3 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        <span className="text-slate-300 break-words">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>
                </section>

                {/* Right Column: Campaign Canvas */}
                <section className="flex flex-col bg-slate-900 rounded-xl border border-slate-800/80 shadow-inner shadow-black/30 overflow-hidden">
                     <header className="flex-shrink-0 p-4 border-b border-slate-800/80">
                         <h2 className="font-semibold text-white text-lg">Campaign Canvas</h2>
                     </header>
                     <div className="flex-1 p-4 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {approvedAssets.length > 0 ? approvedAssets.map((asset, index) => {
                             const content = JSON.parse(asset.generatedContent || '{}') as GeneratedContent;
                             return (
                               <div key={`${asset.id}-${index}`} className="animate-pop-in h-full" style={{ animationDelay: `${index * 100}ms`}}>
                                 {content.type === 'social' && <SocialPostPreview content={content as SocialPostContent} brandProfile={brandProfile} />}
                                 {content.type === 'email' && <EmailPreview content={content as EmailContent} />}
                                 {content.type === 'ad' && <div className="p-4 bg-slate-800/80 rounded-lg border border-slate-700 h-full"><p className="text-sm font-semibold text-slate-400">Ad Headline</p><p className="font-bold text-white mb-2">{(content as AdContent).headline}</p><p className="text-sm font-semibold text-slate-400">Body</p><p className="text-slate-300 text-sm">{(content as AdContent).body}</p></div>}
                                 {content.type === 'blog' && <div className="p-4 bg-slate-800/80 rounded-lg border border-slate-700 h-full space-y-3">{(content as BlogContent).ideas.map((idea, i)=><div key={i}><p className="font-bold text-white text-sm">{idea.title}</p><p className="text-xs text-slate-300">{idea.description}</p></div>)}</div>}
                               </div>
                             );
                         }) : (
                             <div className="col-span-full flex items-center justify-center h-full text-center text-slate-500 p-8">
                                 <div>
                                     <h3 className="font-semibold text-slate-400">Your campaign assets will appear here.</h3>
                                     <p>Approve content from the Agent Plan to build your campaign.</p>
                                 </div>
                             </div>
                         )}
                        </div>
                     </div>
                </section>
            </main>
        </div>
    );
};

export default AgentDetailView;
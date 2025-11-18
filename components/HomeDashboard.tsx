import React, { useState, useEffect } from 'react';
import { User, Agent, HistoryItem, Template, ContentType } from '../types';
import { getAgentsCollection, getHistoryCollection } from '../services/firebaseService';
import AgentIcon from './icons/AgentIcon';
import HistoryIcon from './icons/HistoryIcon';
import UsageUpgradeCard from './UsageUpgradeCard';
import SparklesIcon from './icons/SparklesIcon';
import HeadsetIcon from './icons/HeadsetIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';
import FilmIcon from './icons/FilmIcon';
import SynapseVisualizer from './SynapseVisualizer';
import ImageIcon from './icons/ImageIcon';

type Tab = 'home' | 'tools' | 'live-agent' | 'agents' | 'history' | 'analytics' | 'settings';
interface HomeDashboardProps {
    user: User;
    templates: Template[];
    onSelectTemplate: (template: Template) => void;
    onUpgrade: () => void;
    onTabChange: (tab: Tab) => void;
}

const ActiveAgentsSkeleton = () => (
    <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 p-3 rounded-md animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                    <div className="h-5 bg-slate-700 rounded-full w-16"></div>
                </div>
            </div>
        ))}
    </div>
);

const RecentActivitySkeleton = () => (
    <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 p-3 rounded-md animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
            </div>
        ))}
    </div>
);


const HomeDashboard: React.FC<HomeDashboardProps> = ({ user, templates, onSelectTemplate, onUpgrade, onTabChange }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [userAgents, userHistory] = await Promise.all([
                    getAgentsCollection(user.uid),
                    getHistoryCollection(user.uid)
                ]);
                setAgents(userAgents);
                const sortedHistory = userHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setHistory(sortedHistory.slice(0, 3)); // Get latest 3
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user.uid]);

    const socialTemplate = templates.find(t => t.id === ContentType.SocialMediaPost);
    const blogTemplate = templates.find(t => t.id === ContentType.BlogIdea);
    const emailTemplate = templates.find(t => t.id === ContentType.EmailCopy);
    const campaignTemplate = templates.find(t => t.id === ContentType.Campaign);
    const marketSignalAnalyzerTemplate = templates.find(t => t.id === ContentType.MarketSignalAnalyzer);
    const adCreativeStudioTemplate = templates.find(t => t.id === ContentType.AIAdCreativeStudio);

    const quickStartItems = [
        socialTemplate,
        campaignTemplate,
        blogTemplate,
        emailTemplate,
        marketSignalAnalyzerTemplate,
        adCreativeStudioTemplate,
    ].filter(Boolean) as Template[];

    return (
        <div className="flex-1 flex flex-col space-y-6">
            <div className="relative flex flex-col md:flex-row items-center justify-between p-8 rounded-xl overflow-hidden bg-[#0A0C12] border border-slate-800/80 shadow-2xl shadow-black/30">
                {/* Contained background glow */}
                <div 
                    className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 rounded-full opacity-15 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, var(--gradient-end) 0%, transparent 60%)',
                        filter: 'blur(80px)',
                    }}
                />
                
                {/* Welcome Text */}
                <div className="relative z-10 text-center md:text-left mb-6 md:mb-0 flex-1">
                    <div
                      aria-hidden="true"
                      className="absolute -inset-x-8 md:-inset-x-16 -inset-y-4 rounded-full pointer-events-none animate-text-glow-pulse"
                      style={{
                        background: 'radial-gradient(ellipse at center, var(--gradient-start) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                      }}
                    />
                    <div className="relative">
                        <h1 className="text-4xl font-bold text-white">Welcome back, <span className="gradient-text">{user.displayName}</span></h1>
                        <p className="text-slate-400 mt-2 text-lg">I'm Synapse, ready for your command.</p>
                    </div>
                </div>
                
                {/* Visualizer */}
                <div className="relative z-10">
                    <SynapseVisualizer />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Quick Start */}
                <div className="lg:col-span-2 flex flex-col bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Quick Start</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {quickStartItems.map(item => (
                             <button
                                key={item.id}
                                onClick={() => onSelectTemplate(item)}
                                className="flex flex-col items-start p-4 rounded-lg text-left transition-all bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 hover:border-[var(--gradient-end)]/50"
                            >
                                <item.icon className="w-7 h-7 mb-3 text-[var(--gradient-start)]" />
                                <span className="font-semibold text-white">{item.name}</span>
                                <span className="text-sm text-slate-400 mt-1">{item.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Usage, Agents & History */}
                <div className="flex flex-col space-y-6">
                    {user.plan === 'freemium' && (
                         <div className="flex flex-col bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 p-6">
                            <div className="flex items-center mb-4">
                               <SparklesIcon className="w-5 h-5 mr-3 text-slate-400" />
                               <h2 className="text-xl font-bold text-white">Plan Usage</h2>
                            </div>
                            <UsageUpgradeCard user={user} onUpgrade={onUpgrade} />
                        </div>
                    )}

                    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 p-6">
                        <div className="flex items-center mb-4">
                           <AgentIcon className="w-5 h-5 mr-3 text-slate-400" />
                           <h2 className="text-xl font-bold text-white">Active Agents</h2>
                        </div>
                        <div className="flex-1 space-y-3">
                           {isLoading ? <ActiveAgentsSkeleton /> : agents.length > 0 ? agents.slice(0, 2).map((agent, index) => (
                               <div key={agent.id} className="bg-slate-800/50 p-3 rounded-md animate-fade-in-up" style={{ animationDelay: `${index * 100}ms`}}>
                                   <div className="flex justify-between items-center">
                                       <p className="font-semibold text-sm text-slate-300">{agent.name}</p>
                                       <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${agent.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{agent.status}</span>
                                   </div>
                               </div>
                           )) : (
                               <div className="flex h-full items-center justify-center">
                                   <p className="text-sm text-slate-500 text-center">No agents deployed.</p>
                               </div>
                           )}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 p-6">
                       <div className="flex items-center mb-4">
                           <HistoryIcon className="w-5 h-5 mr-3 text-slate-400" />
                           <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                        </div>
                         <div className="flex-1 space-y-3">
                           {isLoading ? <RecentActivitySkeleton /> : history.length > 0 ? history.map((item, index) => (
                               <div key={item.id} className="bg-slate-800/50 p-3 rounded-md animate-fade-in-up" style={{ animationDelay: `${index * 100}ms`}}>
                                    <p className="font-semibold text-sm text-slate-300 truncate">{item.topic}</p>
                                    <p className="text-xs text-slate-500">{item.templateName}</p>
                               </div>
                           )) : (
                               <div className="flex h-full items-center justify-center">
                                <p className="text-sm text-slate-500 text-center">No recent history.</p>
                               </div>
                           )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Power Up Your Workflow</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => onTabChange('agents')}
                        className="flex flex-col items-start p-4 rounded-lg text-left transition-all bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 hover:border-fuchsia-500/50"
                    >
                        <AgentIcon className="w-7 h-7 mb-3 text-fuchsia-400" />
                        <span className="font-semibold text-white">Automate with Agents</span>
                        <span className="text-sm text-slate-400 mt-1">Deploy an AI workforce to execute entire campaigns.</span>
                    </button>
                    <button
                        onClick={() => onTabChange('live-agent')}
                        className="flex flex-col items-start p-4 rounded-lg text-left transition-all bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 hover:border-sky-500/50"
                    >
                        <HeadsetIcon className="w-7 h-7 mb-3 text-sky-400" />
                        <span className="font-semibold text-white">Live Agent</span>
                        <span className="text-sm text-slate-400 mt-1">Instant strategies and platform guidance via voice.</span>
                    </button>
                    <button
                        onClick={() => onTabChange('analytics')}
                        className="flex flex-col items-start p-4 rounded-lg text-left transition-all bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/50"
                    >
                        <AnalyticsIcon className="w-7 h-7 mb-3 text-emerald-400" />
                        <span className="font-semibold text-white">View Analytics</span>
                        <span className="text-sm text-slate-400 mt-1">Track performance and gain strategic insights.</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeDashboard;
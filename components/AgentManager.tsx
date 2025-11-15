import React, { useState, useEffect } from 'react';
import { Agent, User, AgentPersona } from '../types';
import { onAgentsSnapshot, deleteAgentAndSubcollections, getBrandProfile, isBrandProfileComplete } from '../services/firebaseService';
import AgentConfigurationModal from './AgentConfigurationModal';
import AgentDetailView from './AgentDetailView';
import AgentIcon from './icons/AgentIcon';
import AgentStatusBadge from './AgentStatusBadge';
import MegaphoneIcon from './icons/MegaphoneIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import RocketIcon from './icons/RocketIcon';
import EmailIcon from './icons/EmailIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import CompleteProfilePrompt from './CompleteProfilePrompt';
import ProFeatureBadge from './ProFeatureBadge';


interface AgentManagerProps {
    user: User;
    onUpgrade: () => void;
    onNavigateToSettings: () => void;
}

const personaIcons: Record<AgentPersona, React.FC<{className?: string}>> = {
    [AgentPersona.SocialMediaManager]: MegaphoneIcon,
    [AgentPersona.ContentStrategist]: LightbulbIcon,
    [AgentPersona.EmailMarketer]: EmailIcon,
    [AgentPersona.GrowthHacker]: RocketIcon,
};

const AgentSkeleton: React.FC = () => (
    <div className="flex-1 animate-pulse">
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/70 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-700 flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/4"></div>
                    </div>
                    <div className="hidden md:block flex-1 space-y-2">
                        <div className="h-3 bg-slate-700 rounded w-full"></div>
                        <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                    </div>
                    <div className="w-48 space-y-3">
                        <div className="h-5 bg-slate-700 rounded w-1/2 ml-auto"></div>
                        <div className="h-1.5 bg-slate-700 rounded-full w-full"></div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex-shrink-0"></div>
                    <div className="w-5 h-5 bg-slate-700 rounded flex-shrink-0"></div>
                </div>
            ))}
        </div>
    </div>
);

const AgentManager: React.FC<AgentManagerProps> = ({ user, onUpgrade, onNavigateToSettings }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
    const { addToast } = useToast();
    
    useEffect(() => {
        getBrandProfile(user.uid).then(profile => {
            setIsProfileComplete(isBrandProfileComplete(profile));
        });

        const unsubscribe = onAgentsSnapshot(user.uid,
            (userAgents) => {
                setAgents(userAgents);
                setIsInitialLoading(false);
            }
        );
        return () => unsubscribe();
    }, [user.uid]);

    const handleDeployAgent = () => {
        if (!isProfileComplete) {
            addToast("Please complete your Brand Profile in Settings first.", "info");
            onNavigateToSettings();
            return;
        }
        if (user.plan === 'freemium') {
            onUpgrade();
        } else {
            setIsConfiguring(true);
        }
    };

    const handleSelectAgent = (agentId: string) => {
        setSelectedAgentId(agentId);
    };

    const handleBackToList = () => {
        setSelectedAgentId(null);
    }
    
    const handleDeleteAgent = async () => {
        if (!agentToDelete) return;
        setIsDeleting(true);
        try {
            await deleteAgentAndSubcollections(user.uid, agentToDelete.id);
            addToast(`Agent "${agentToDelete.name}" deleted successfully.`, "info");
            setAgentToDelete(null);
        } catch (error) {
            console.error("Failed to delete agent:", error);
            addToast("Failed to delete agent. Please try again.", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    if (selectedAgentId) {
        const selectedAgent = agents.find(a => a.id === selectedAgentId);
        return <AgentDetailView agent={selectedAgent} onBack={handleBackToList} />;
    }

    const renderContent = () => {
        if (isProfileComplete === null || (isProfileComplete && isInitialLoading)) {
            return <AgentSkeleton />;
        }
        if (!isProfileComplete) {
            return <div className="flex-1 mt-6"><CompleteProfilePrompt featureName="AI Agents" onNavigate={onNavigateToSettings} /></div>;
        }

        return (
            <div className="space-y-4">
                {agents.map(agent => {
                   const PersonaIcon = personaIcons[agent.persona];
                   const needsReview = agent.taskStats && agent.taskStats.needsReview > 0;
                   return (
                        <div key={agent.id} onClick={() => handleSelectAgent(agent.id)} 
                        className={`
                            bg-slate-800/50 p-4 rounded-lg border 
                            hover:border-[var(--gradient-end)]/50 hover:bg-slate-800
                            cursor-pointer transition-all duration-300 group flex items-center space-x-4
                            ${needsReview ? 'border-yellow-500/40' : 'border-slate-700/70'}
                        `}>
                            <div className="p-3 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800">
                                <PersonaIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center">
                                    <h3 className="font-bold text-white group-hover:gradient-text transition-colors">{agent.name}</h3>
                                    {needsReview && <span className="relative flex h-2.5 w-2.5 ml-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span></span>}
                                </div>
                                <p className="text-sm text-slate-400 mt-1 line-clamp-1">{agent.persona}</p>
                            </div>
                            <div className="hidden md:block flex-1">
                               <p className="text-sm text-slate-300 line-clamp-2">{agent.goal}</p>
                            </div>
                            <div className="w-48 text-right">
                                <AgentStatusBadge status={agent.status} />
                                {agent.taskStats && agent.taskStats.total > 0 && (
                                    <div className="mt-2">
                                        <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                                            <span>Progress</span>
                                            <span>{agent.taskStats.completed} / {agent.taskStats.total}</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                                            <div className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] h-1.5 rounded-full" style={{width: `${(agent.taskStats.completed / agent.taskStats.total) * 100}%`, transition: 'width 0.5s ease-in-out'}}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setAgentToDelete(agent); }} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-full transition-colors z-10 relative">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                            <ChevronDownIcon className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-transform -rotate-90"/>
                        </div>
                   )
                })}
                
                {agents.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-lg">
                        <AgentIcon className="w-16 h-16 mx-auto text-slate-700" />
                        <h3 className="mt-4 font-semibold text-slate-400">No Agents Deployed</h3>
                        <p className="text-slate-500">Click "Deploy New Agent" to launch your first AI assistant.</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            {isConfiguring && (
              <AgentConfigurationModal
                user={user}
                onClose={() => setIsConfiguring(false)} 
                onSuccess={(newAgentId) => {
                  setIsConfiguring(false);
                  handleSelectAgent(newAgentId);
                }}
              />
            )}
            {agentToDelete && <ConfirmationModal
                isOpen={!!agentToDelete}
                onClose={() => setAgentToDelete(null)}
                onConfirm={handleDeleteAgent}
                title={`Delete Agent: ${agentToDelete.name}?`}
                message={<p>This will permanently delete the agent and all of its associated tasks and activity logs. This action cannot be undone.</p>}
                confirmButtonText="Yes, Delete Agent"
                isConfirming={isDeleting}
            />}
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 flex-shrink-0 gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold gradient-text">Agent Command Center</h1>
                            <ProFeatureBadge />
                        </div>
                        <p className="text-slate-400 mt-1">Deploy your autonomous AI workforce to run entire campaigns. <span className="font-semibold">A Pro feature.</span></p>
                    </div>
                    <button onClick={handleDeployAgent} className="flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-fuchsia-500/20">
                        <AgentIcon className="w-5 h-5 mr-2" />
                        Deploy New Agent
                    </button>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default AgentManager;
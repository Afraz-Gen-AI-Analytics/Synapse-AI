import React, { useState } from 'react';
import { AgentPersona, User, Agent, AgentTask, BrandProfile } from '../types';
import { addAgentDoc, addAgentLogDoc, addAgentTaskDoc, updateAgentDoc, getBrandProfile } from '../services/firebaseService';
import { generateAgentPlan } from '../services/geminiService';
import AgentIcon from './icons/AgentIcon';

interface AgentConfigurationModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (newAgentId: string) => void;
}

const AgentConfigurationModal: React.FC<AgentConfigurationModalProps> = ({ user, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [persona, setPersona] = useState<AgentPersona>(AgentPersona.SocialMediaManager);
    const [goal, setGoal] = useState('');
    const [error, setError] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployMessage, setDeployMessage] = useState('Deploy Agent');

    const handleSubmit = async () => {
        if (!name || !goal) {
            setError('Please provide a name and a goal for your agent.');
            return;
        }
        setIsDeploying(true);
        setError('');
        try {
            setDeployMessage('Fetching Brand Profile...');
            const brandProfile = await getBrandProfile(user.uid);
            if (!brandProfile) {
                throw new Error("Could not find brand profile. Please configure it in Settings.");
            }

            const newAgentData: Omit<Agent, 'id'> = {
                userId: user.uid,
                name,
                persona,
                goal,
                status: 'planning',
                createdAt: new Date().toISOString(),
            };
            const newAgent = await addAgentDoc(user.uid, newAgentData);

            await addAgentLogDoc(user.uid, newAgent.id, { agentId: newAgent.id, userId: user.uid, message: "Initializing...", timestamp: new Date().toISOString() });
            
            setDeployMessage('Generating Strategic Plan...');
            const plan = await generateAgentPlan(goal, persona, brandProfile);
            await addAgentLogDoc(user.uid, newAgent.id, { agentId: newAgent.id, userId: user.uid, message: `Analyzing goal: "${goal}"`, timestamp: new Date().toISOString() });
            await addAgentLogDoc(user.uid, newAgent.id, { agentId: newAgent.id, userId: user.uid, message: "Strategic plan generated. Creating tasks...", timestamp: new Date().toISOString() });
            
            setDeployMessage('Creating Tasks...');
            for (const taskDetails of plan) {
                await addAgentTaskDoc(user.uid, newAgent.id, {
                    agentId: newAgent.id,
                    userId: user.uid,
                    description: taskDetails.description,
                    status: 'pending',
                    contentType: taskDetails.contentType,
                });
            }
            
            await updateAgentDoc(user.uid, newAgent.id, { status: 'active' });
            await addAgentLogDoc(user.uid, newAgent.id, { agentId: newAgent.id, userId: user.uid, message: "Planning complete. Agent is now active and starting execution.", timestamp: new Date().toISOString() });

            onSuccess(newAgent.id);

        } catch(err: any) {
            setError(err.message || 'Failed to deploy agent.');
            setIsDeploying(false);
            setDeployMessage('Deploy Agent');
        }
    };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl shadow-black/30 w-full max-w-lg transform transition-all animate-pop-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center mb-6">
            <div className="p-3 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] mr-4">
                <AgentIcon className="w-6 h-6 text-white"/>
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Deploy New Agent</h2>
                <p className="text-slate-400">Configure your AI assistant to execute your campaign.</p>
            </div>
        </div>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="agentName" className="block text-sm font-medium text-slate-300 mb-2">Agent Name</label>
                <input
                    id="agentName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., 'Q3 Product Launch Agent'"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)]"
                />
            </div>
             <div>
                <label htmlFor="persona" className="block text-sm font-medium text-slate-300 mb-2">Persona</label>
                <select id="persona" value={persona} onChange={e => setPersona(e.target.value as AgentPersona)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[var(--gradient-end)]">
                    {Object.values(AgentPersona).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="goal" className="block text-sm font-medium text-slate-300 mb-2">Primary Goal</label>
                <textarea
                    id="goal"
                    rows={4}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., 'Drive sign-ups for our new webinar on AI in marketing by targeting tech professionals on LinkedIn and Twitter.'"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)]"
                />
            </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        
        <div className="flex justify-end gap-4 mt-6">
            <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Cancel
            </button>
            <button onClick={handleSubmit} disabled={isDeploying} className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-fuchsia-500/20 disabled:opacity-50">
                {isDeploying ? deployMessage : 'Deploy Agent'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AgentConfigurationModal;
import React from 'react';
import { User } from '../types';
import { FREEMIUM_GENERATION_LIMIT } from '../services/firebaseService';
import SparklesIcon from './icons/SparklesIcon';
import ProPlanIcon from './icons/ProPlanIcon';

interface UsageUpgradeCardProps {
    user: User;
    onUpgrade: () => void;
}

const UsageUpgradeCard: React.FC<UsageUpgradeCardProps> = ({ user, onUpgrade }) => {
    if (user.plan === 'pro') {
        return (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/70 min-h-20 flex flex-col items-center justify-center text-center">
                <ProPlanIcon className="w-7 h-7 mb-2"/>
                <div>
                    <p className="font-bold text-white">Pro Plan</p>
                    <p className="text-xs text-slate-400">All features unlocked</p>
                </div>
            </div>
        );
    }

    const generationsLeft = FREEMIUM_GENERATION_LIMIT - user.generationsUsed;
    const usagePercentage = (generationsLeft / FREEMIUM_GENERATION_LIMIT) * 100;

    return (
        <div className="p-3 bg-slate-800/50 rounded-lg text-center border border-slate-700/70 flex flex-col min-h-20">
            <div className="flex-grow">
                <p className="text-sm font-bold gradient-text">
                    {generationsLeft > 0 ? `${generationsLeft} generations left` : "Upgrade to Pro"}
                </p>
                <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                    <div 
                        className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] h-1.5 rounded-full" 
                        style={{ width: `${usagePercentage}%`, transition: 'width 0.5s ease-in-out' }}
                    ></div>
                </div>
            </div>
            <button 
                onClick={onUpgrade} 
                className="text-xs mt-3 text-slate-300 hover:text-white font-semibold flex items-center justify-center w-full bg-slate-700/50 hover:bg-slate-700 py-2 rounded-md transition-colors"
            >
                <SparklesIcon className="w-3.5 h-3.5 mr-1.5"/>
                Upgrade Plan
            </button>
        </div>
    );
};

export default UsageUpgradeCard;

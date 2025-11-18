
import React from 'react';
import { User } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import DiamondIcon from './icons/DiamondIcon';

interface UsageUpgradeCardProps {
    user: User;
    onUpgrade: () => void;
}

const formatCredits = (num: number): string => {
    if (num >= 1000) {
        const thousands = num / 1000;
        return `${parseFloat(thousands.toFixed(1))}k`;
    }
    return num.toString();
};

const UsageUpgradeCard: React.FC<UsageUpgradeCardProps> = ({ user, onUpgrade }) => {
    // Calculate percentage, ensuring we handle division by zero
    const rawPercentage = user.planCreditLimit > 0 ? (user.credits / user.planCreditLimit) * 100 : 0;
    // Cap visual percentage at 100% to prevent bar overflow
    const displayPercentage = Math.min(rawPercentage, 100);

    if (user.plan === 'pro') {
        return (
             <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/70 flex flex-col space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <p className="font-bold gradient-text">
                        Pro Plan
                    </p>
                    <p className="font-bold text-white">
                        {formatCredits(user.credits)}
                        <span className="text-slate-400 font-medium"> / {formatCredits(user.planCreditLimit)}</span>
                    </p>
                </div>

                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] h-1.5 rounded-full"
                        style={{ width: `${displayPercentage}%`, transition: 'width 0.5s ease-in-out' }}
                    ></div>
                </div>

                 <button
                    onClick={onUpgrade}
                    className="text-sm mt-1 text-white font-semibold flex items-center justify-center w-full bg-sky-600 hover:bg-sky-700 py-2 rounded-md transition-colors"
                >
                    <DiamondIcon className="w-4 h-4 mr-1.5"/>
                    Top Up Credits
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/70 flex flex-col space-y-2">
            <div className="flex justify-between items-center text-sm">
                <p className="font-medium text-slate-300">
                    Credit Balance
                </p>
                <p className="font-bold text-white">
                    {user.credits}
                    <span className="text-slate-400 font-medium"> / {user.planCreditLimit}</span>
                </p>
            </div>

            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] h-1.5 rounded-full"
                    style={{ width: `${displayPercentage}%`, transition: 'width 0.5s ease-in-out' }}
                ></div>
            </div>

            <button
                onClick={onUpgrade}
                className="text-sm mt-1 text-white font-semibold flex items-center justify-center w-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 py-2 rounded-md transition-colors"
            >
                <SparklesIcon className="w-4 h-4 mr-1.5"/>
                Upgrade to Pro
            </button>
        </div>
    );
};

export default UsageUpgradeCard;

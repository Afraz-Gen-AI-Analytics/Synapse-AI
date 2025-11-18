
import React, { useState } from 'react';
import { User } from '../types';
import SynapseLogo from './icons/SynapseLogo';
import CheckIcon from './icons/CheckIcon';
import DiamondIcon from './icons/DiamondIcon';

interface UpgradeModalProps {
  user: User;
  onClose: () => void;
  onUpgrade: () => Promise<void>;
  onBuyCredits: () => Promise<void>;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ user, onClose, onUpgrade, onBuyCredits }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');

  const handleUpgradeClick = async () => {
    setIsUpgrading(true);
    await onUpgrade();
  };
  
  const handleBuyCreditsClick = async () => {
    setIsBuyingCredits(true);
    await onBuyCredits();
  };

  if (user.plan === 'pro') {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
          <div 
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl shadow-black/30 w-full max-w-md transform transition-all animate-pop-in max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <DiamondIcon className="w-10 h-10 mx-auto mb-3 text-[var(--gradient-start)]" />
            <h2 className="text-xl font-bold gradient-text mb-2 text-center">Top Up Your Credits</h2>
            <p className="text-slate-400 mb-5 text-center text-sm">Add more credits to your account to continue creating without limits.</p>
            
            <div className="text-left bg-slate-800/50 p-4 rounded-lg space-y-2 text-sm border border-slate-700/70">
                <h3 className="font-bold text-base text-white">Get a Credit Pack</h3>
                <p className="text-slate-300 text-xs">Get a one-time credit pack to add to your balance.</p>
                <button 
                    onClick={handleBuyCreditsClick}
                    disabled={isBuyingCredits}
                    className="w-full mt-2 flex justify-center items-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50"
                >
                {isBuyingCredits ? 'Processing...' : (
                    <>
                    <DiamondIcon className="w-4 h-4 mr-2" />
                    Buy 100 Credits - $10
                    </>
                )}
                </button>
            </div>

            <div className="text-center">
                <button onClick={onClose} className="mt-4 text-slate-400 hover:text-white text-xs font-medium uppercase tracking-wide">
                    Cancel
                </button>
            </div>
          </div>
        </div>
      );
  }


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl shadow-black/30 w-full max-w-md transform transition-all animate-pop-in max-h-[95vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center">
            <SynapseLogo className="w-10 h-10 mb-3" />
            <h2 className="text-xl font-bold gradient-text mb-1 text-center">Unlock Full Potential</h2>
            <p className="text-slate-400 mb-4 text-center text-sm max-w-xs mx-auto leading-relaxed">Choose a plan to continue creating with advanced AI models and autonomous agents.</p>
        </div>
        
        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-3 mb-4 text-sm">
            <span className={`font-medium transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
            <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
                aria-label={`Switch to ${billingCycle === 'monthly' ? 'annual' : 'monthly'} billing`}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${billingCycle === 'annually' ? 'bg-[var(--gradient-start)]' : 'bg-slate-700'}`}
            >
                <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'annually' ? 'translate-x-5' : ''}`}
                />
            </button>
            <span className={`font-medium flex items-center transition-colors ${billingCycle === 'annually' ? 'text-white' : 'text-slate-400'}`}>
                Annually
                <span className="ml-1.5 text-[10px] font-bold bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full">SAVE 20%</span>
            </span>
        </div>

        {/* Pro Plan Option */}
        <div className="text-left bg-slate-800/40 p-3.5 rounded-lg mb-3 space-y-2 text-sm border border-slate-700/70 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none bg-gradient-to-bl from-[var(--gradient-start)] to-transparent rounded-bl-full transition-opacity group-hover:opacity-20"></div>
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-base gradient-text">Pro Plan</h3>
                <span className="text-white font-bold">{billingCycle === 'annually' ? '$39' : '$49'}<span className="text-slate-400 font-normal text-xs">/mo</span></span>
            </div>
            <div className="space-y-1.5">
                <p className="flex items-center text-slate-300 text-xs"><CheckIcon className="w-3.5 h-3.5 text-green-400 mr-2 flex-shrink-0" /> 2,500 Credits / month</p>
                <p className="flex items-center text-slate-300 text-xs"><CheckIcon className="w-3.5 h-3.5 text-green-400 mr-2 flex-shrink-0" /> Autonomous AI Agents</p>
                <p className="flex items-center text-slate-300 text-xs"><CheckIcon className="w-3.5 h-3.5 text-green-400 mr-2 flex-shrink-0" /> Performance Analytics & Pro Tools</p>
            </div>
            
            <button 
            onClick={handleUpgradeClick}
            disabled={isUpgrading || isBuyingCredits}
            className="w-full !mt-3 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 text-sm"
            >
            {isUpgrading ? 'Processing...' : 'Upgrade to Pro'}
            </button>
        </div>

        <div className="flex items-center my-3">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-xs font-medium">OR ONE-TIME</span>
            <div className="flex-grow border-t border-slate-700"></div>
        </div>
        
        {/* Credit Pack Option */}
        <div className="text-left bg-slate-800/40 p-3.5 rounded-lg mb-2 flex flex-col border border-slate-700/70">
            <div className="flex items-center justify-between mb-1">
                <div>
                    <h3 className="font-bold text-sm text-white">100 Credit Pack</h3>
                    <p className="text-slate-400 text-[10px]">One-time top up for Core tools.</p>
                </div>
                <button 
                onClick={handleBuyCreditsClick}
                disabled={isUpgrading || isBuyingCredits}
                className="flex items-center bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold py-1.5 px-3 rounded-md transition-all duration-300 ease-in-out disabled:opacity-50 text-xs"
                >
                {isBuyingCredits ? '...' : (
                    <>
                    <DiamondIcon className="w-3 h-3 mr-1.5 text-sky-400" />
                    $10
                    </>
                )}
                </button>
            </div>
            <p className="text-red-400/80 text-[9px] italic mt-1 flex items-center">
                * Does not unlock Pro features (Agents, Video, etc.)
            </p>
        </div>

        <div className="text-center">
            <button onClick={onClose} className="mt-3 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors">
                Maybe later
            </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;

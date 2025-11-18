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
            className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl shadow-black/30 w-full max-w-md transform transition-all animate-pop-in"
            onClick={e => e.stopPropagation()}
          >
            <DiamondIcon className="w-12 h-12 mx-auto mb-4 text-[var(--gradient-start)]" />
            <h2 className="text-2xl font-bold gradient-text mb-2 text-center">Top Up Your Credits</h2>
            <p className="text-slate-400 mb-6 text-center">Add more credits to your account to continue creating without limits.</p>
            
            <div className="text-left bg-slate-800/50 p-4 rounded-lg space-y-3 text-sm border border-slate-700/70">
                <h3 className="font-bold text-lg text-white">Get a Credit Pack</h3>
                <p className="text-slate-300">Get a one-time credit pack to add to your balance.</p>
                <button 
                    onClick={handleBuyCreditsClick}
                    disabled={isBuyingCredits}
                    className="w-full mt-2 flex justify-center items-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50"
                >
                {isBuyingCredits ? 'Processing...' : (
                    <>
                    <DiamondIcon className="w-5 h-5 mr-2" />
                    Buy 100 Credits - $10
                    </>
                )}
                </button>
            </div>

            <div className="text-center">
                <button onClick={onClose} className="mt-6 text-slate-400 hover:text-white text-sm">
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
        className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl shadow-black/30 w-full max-w-md transform transition-all animate-pop-in"
        onClick={e => e.stopPropagation()}
      >
        <SynapseLogo className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold gradient-text mb-2 text-center">Unlock Your Full Potential</h2>
        <p className="text-slate-400 mb-6 text-center">You're out of credits or trying to access a Pro feature. Choose an option below to continue creating.</p>
        
        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-6">
            <span className={`font-medium transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
            <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
                aria-label={`Switch to ${billingCycle === 'monthly' ? 'annual' : 'monthly'} billing`}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${billingCycle === 'annually' ? 'bg-[var(--gradient-start)]' : 'bg-slate-700'}`}
            >
                <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'annually' ? 'translate-x-6' : ''}`}
                />
            </button>
            <span className={`font-medium flex items-center transition-colors ${billingCycle === 'annually' ? 'text-white' : 'text-slate-400'}`}>
                Annually
                <span className="ml-2 text-xs font-bold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">SAVE 20%</span>
            </span>
        </div>

        {/* Pro Plan Option */}
        <div className="text-left bg-slate-800/50 p-4 rounded-lg mb-4 space-y-3 text-sm border border-slate-700/70">
            <h3 className="font-bold text-lg gradient-text">Go Pro</h3>
            <p className="flex items-center"><CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" /> 2,500 Credits / month</p>
            <p className="flex items-center"><CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" /> Autonomous AI Agents & All Pro Tools</p>
            <p className="flex items-center"><CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" /> Performance Analytics</p>
            {billingCycle === 'annually' && <p className="text-xs text-slate-500 text-center !mt-4">Billed as $468 per year</p>}
            <button 
            onClick={handleUpgradeClick}
            disabled={isUpgrading || isBuyingCredits}
            className="w-full !mt-4 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
            >
            {isUpgrading ? 'Processing...' : `Upgrade to Pro - ${billingCycle === 'annually' ? '$39' : '$49'}/mo`}
            </button>
        </div>

        <div className="flex items-center my-6">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-sm">OR</span>
            <div className="flex-grow border-t border-slate-700"></div>
        </div>
        
        {/* Credit Pack Option */}
        <div className="text-left bg-slate-800/50 p-4 rounded-lg mb-6 space-y-3 text-sm border border-slate-700/70">
            <h3 className="font-bold text-lg text-white">Get a Top-Up</h3>
            <p className="text-slate-300">Not ready for a subscription? Get a one-time credit pack to continue your work.</p>
            <button 
            onClick={handleBuyCreditsClick}
            disabled={isUpgrading || isBuyingCredits}
            className="w-full mt-2 flex justify-center items-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50"
            >
            {isBuyingCredits ? 'Processing...' : (
                <>
                <DiamondIcon className="w-5 h-5 mr-2" />
                Buy 100 Credits - $10
                </>
            )}
            </button>
        </div>

        <div className="text-center">
            <button onClick={onClose} className="mt-4 text-slate-400 hover:text-white text-sm">
                Maybe later
            </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
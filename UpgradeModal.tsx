import React, { useState } from 'react';
import SynapseLogo from './icons/SynapseLogo';

interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: () => Promise<void>;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, onUpgrade }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgradeClick = async () => {
    setIsUpgrading(true);
    await onUpgrade();
    // The modal will be closed by the parent component, so we don't need to reset isUpgrading state here.
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl shadow-black/30 w-full max-w-md text-center transform transition-all animate-pop-in"
        onClick={e => e.stopPropagation()}
      >
        <SynapseLogo className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold gradient-text mb-2">Unlock Your Full Potential</h2>
        <p className="text-slate-400 mb-6">You've reached your limit on the Freemium plan. Upgrade to Pro to access unlimited generations and powerful features like Autonomous Agents.</p>
        
        <div className="text-left bg-slate-800/50 p-4 rounded-lg mb-6 space-y-2 text-sm">
            <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Unlimited Generations</p>
            <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Autonomous AI Agents</p>
            <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Campaign Builder & Analytics</p>
            <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> AI Video Generation</p>
        </div>
        
        <button 
          onClick={handleUpgradeClick}
          disabled={isUpgrading}
          className="w-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
        >
          {isUpgrading ? 'Processing...' : 'Upgrade to Pro - $49/mo'}
        </button>
        <button onClick={onClose} className="mt-4 text-slate-400 hover:text-white text-sm">
            Maybe later
        </button>
      </div>
    </div>
  );
};

export default UpgradeModal;
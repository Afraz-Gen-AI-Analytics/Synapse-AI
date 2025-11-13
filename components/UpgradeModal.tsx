import React, { useState, useContext } from 'react';
import SynapseLogo from './icons/SynapseLogo';
import CheckIcon from './icons/CheckIcon';
import { AuthContext } from '../App';
import { useToast } from '../contexts/ToastContext';

// Add this declaration to inform TypeScript about the global Razorpay object
declare var Razorpay: any;

interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: () => Promise<void>;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, onUpgrade }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();

  const handleUpgradeClick = async () => {
    if (!user) {
        addToast("You must be logged in to upgrade.", "error");
        return;
    }
    
    setIsUpgrading(true);

    // In a real application, this is where you would make a call to your backend
    // to create a Razorpay order. Your backend would use its secret key to do this.
    // For this demo, we'll simulate this step.
    const mockOrder = {
        id: 'order_' + Date.now(),
        amount: 4900, // $49.00 USD in cents
        currency: 'USD'
    };
    
    const options = {
        key: 'rzp_test_OmJdFVfWzMePqg', // This is a public test key
        amount: mockOrder.amount,
        currency: mockOrder.currency,
        name: "Synapse AI Pro",
        description: "Pro Plan - Annual Subscription",
        order_id: mockOrder.id,
        handler: async (response: any) => {
            // This is the success callback.
            // In a real app, you would send this response object to your server
            // for verification before granting the user Pro access.
            // Here, we'll proceed directly with the frontend upgrade.
            await onUpgrade();
        },
        prefill: {
            name: user.displayName || user.email,
            email: user.email,
        },
        theme: {
            // Use the CSS variables from our theme for consistency
            color: getComputedStyle(document.documentElement).getPropertyValue('--gradient-start').trim()
        },
        modal: {
            ondismiss: () => {
                setIsUpgrading(false);
                addToast('Upgrade process was cancelled.', 'info');
            }
        }
    };

    try {
        const rzp = new Razorpay(options);
        rzp.open();
    } catch (e) {
        console.error("Razorpay Error:", e);
        addToast("Could not initialize the payment gateway. Please try again.", "error");
        setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl shadow-black/30 w-full max-w-md text-center transform transition-all animate-pop-in"
        onClick={e => e.stopPropagation()}
      >
        <SynapseLogo className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold gradient-text mb-2">Unlock Your Full Potential</h2>
        <p className="text-slate-400 mb-6">Upgrade to Pro to unlock unlimited generations and access our complete suite of powerful tools.</p>
        
        <div className="text-left bg-slate-800/50 p-4 rounded-lg mb-6 space-y-3 text-sm">
            <p className="flex items-center"><CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" /> Unlimited generations</p>
            <p className="flex items-center"><CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" /> Autonomous AI Agents</p>
            <p className="flex items-center"><CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" /> Performance Analytics</p>
            <p className="flex items-center"><CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" /> All Pro Tools Included</p>
        </div>
        
        <button 
          onClick={handleUpgradeClick}
          disabled={isUpgrading}
          className="w-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
        >
          {isUpgrading ? 'Redirecting to payment...' : 'Upgrade to Pro - $49/mo'}
        </button>
        <button onClick={onClose} className="mt-4 text-slate-400 hover:text-white text-sm">
            Maybe later
        </button>
      </div>
    </div>
  );
};

export default UpgradeModal;

import React, { useState } from 'react';
import { User } from '../types';
import SynapseLogo from './icons/SynapseLogo';
import CheckIcon from './icons/CheckIcon';
import DiamondIcon from './icons/DiamondIcon';
import SparklesIcon from './icons/SparklesIcon';
import { useToast } from '../contexts/ToastContext';

interface UpgradeModalProps {
  user: User;
  onClose: () => void;
  onUpgrade: () => Promise<void>; // Kept for type compatibility, but logic moved internal
  onBuyCredits: () => Promise<void>; // Kept for type compatibility
}

// --- REPLACE THESE WITH YOUR MAKE.COM WEBHOOK URLS ---
const MAKE_CREATE_ORDER_URL = "https://hook.us1.make.com/YOUR_CREATE_ORDER_WEBHOOK_ID"; 
const MAKE_VERIFY_PAYMENT_URL = "https://hook.us1.make.com/YOUR_VERIFY_PAYMENT_WEBHOOK_ID";
// ----------------------------------------------------

const UpgradeModal: React.FC<UpgradeModalProps> = ({ user, onClose, onUpgrade, onBuyCredits }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
  const { addToast } = useToast();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
  };

  const handlePayment = async (type: 'pro' | 'credit_pack', amount: number) => {
      try {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            addToast('Razorpay SDK failed to load. Are you online?', 'error');
            return;
        }

        // 1. Create Order via Make.com
        const response = await fetch(MAKE_CREATE_ORDER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount * 100, // Razorpay expects subunits (paise/cents)
                currency: "USD", 
                receipt: `rcpt_${Date.now()}`
            })
        });

        if (!response.ok) throw new Error("Failed to create order via Make.com");
        const orderData = await response.json();

        // 2. Open Razorpay
        const options = {
            key: "YOUR_RAZORPAY_PUBLIC_KEY_ID", // Replace with your actual Public Key from Razorpay Dashboard
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Synapse AI",
            description: type === 'pro' ? "Pro Plan Upgrade" : "Credit Pack Top-up",
            order_id: orderData.id,
            handler: async function (response: any) {
                // 3. Verify via Make.com
                addToast("Verifying payment...", "info");
                
                try {
                    const verifyRes = await fetch(MAKE_VERIFY_PAYMENT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user.uid,
                            packageType: type,
                            currentCredits: user.credits, // Sending this helps Make.com calculate new total
                            currentPlan: user.plan,       // Sending this ensures we don't downgrade users accidentally
                            currentPlanLimit: user.planCreditLimit // Sending this to update limit correctly
                        })
                    });

                    if (verifyRes.ok) {
                        addToast("Payment successful! Refreshing your account...", "success");
                        // Ideally, trigger a user reload here or optimistic update
                        if (type === 'pro') await onUpgrade(); 
                        else await onBuyCredits();
                        onClose();
                    } else {
                        addToast("Payment verification failed.", "error");
                    }
                } catch (e) {
                    console.error(e);
                    addToast("Error verifying payment.", "error");
                }
            },
            prefill: {
                name: user.displayName,
                email: user.email,
            },
            theme: {
                color: "#E025F0"
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any){
            addToast(response.error.description, "error");
        });
        rzp.open();

      } catch (error) {
          console.error("Payment flow error:", error);
          addToast("Something went wrong initiating payment.", "error");
      } finally {
          setIsUpgrading(false);
          setIsBuyingCredits(false);
      }
  };

  const handleUpgradeClick = async () => {
    setIsUpgrading(true);
    // $39.00
    await handlePayment('pro', 39);
  };
  
  const handleBuyCreditsClick = async () => {
    setIsBuyingCredits(true);
    // $10.00
    await handlePayment('credit_pack', 10);
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
             <div className="mt-4 flex justify-center items-center text-[10px] text-slate-500 gap-2">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                Secure Payment via Razorpay
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
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base gradient-text">Pro Plan</h3>
                    <span className="bg-[var(--gradient-start)] text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">Best Value</span>
                </div>
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
            className="w-full !mt-3 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 text-sm flex items-center justify-center"
            >
            {isUpgrading ? 'Processing...' : (
                <><SparklesIcon className="w-4 h-4 mr-2"/> Upgrade to Pro</>
            )}
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
            <p className="text-red-400/80 text-[10px] font-medium italic mt-1 flex items-center">
                * Note: Credits alone do not unlock Pro features (Agents, Video, etc.)
            </p>
        </div>

        <div className="mt-4 flex justify-center items-center text-[10px] text-slate-500 gap-2">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            SSL Secured Payment via Razorpay
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

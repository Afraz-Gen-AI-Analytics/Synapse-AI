import React, { useState, useEffect } from 'react';
import SynapseCoreIcon from './icons/SynapseCoreIcon';

const loadingMessages = [
    "Analyzing goal against market trends...",
    "Consulting brand voice profile...",
    "Mapping key audience segments...",
    "Structuring multi-phase strategic framework...",
    "Defining core marketing channels...",
    "Outlining initial asset requirements...",
    "Finalizing actionable campaign blueprint...",
];

interface GeneratingStrategyModalProps {
    isOpen: boolean;
}

const GeneratingStrategyModal: React.FC<GeneratingStrategyModalProps> = ({ isOpen }) => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        if (isOpen) {
            const interval = setInterval(() => {
                setMessage(prevMessage => {
                    const currentIndex = loadingMessages.indexOf(prevMessage);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 2000); // Cycle message every 2 seconds
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
            <div 
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/30 w-full max-w-lg text-center transform transition-all animate-pop-in"
                // Prevent modal from closing on click
                onClick={e => e.stopPropagation()}
            >
                <SynapseCoreIcon className="w-32 h-32 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-3">Crafting Your Strategy...</h2>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">Synapse is analyzing your goal to build the perfect, data-driven campaign tailored to your brand.</p>
                <p className="text-lg font-mono text-[var(--gradient-start)] transition-opacity duration-500 h-6">
                    {message}
                </p>
            </div>
        </div>
    );
};

export default GeneratingStrategyModal;

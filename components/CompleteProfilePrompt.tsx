import React from 'react';
import SettingsIcon from './icons/SettingsIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';

interface CompleteProfilePromptProps {
  featureName: string;
  onNavigate: () => void;
}

const CompleteProfilePrompt: React.FC<CompleteProfilePromptProps> = ({ featureName, onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-900 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 p-8 h-full">
      <div className="p-4 rounded-full bg-yellow-500/10 mb-4">
        <AlertTriangleIcon className="w-10 h-10 text-yellow-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">Complete Your Brand Profile</h2>
      <p className="text-slate-400 mt-2 max-w-md">
        To use the {featureName}, you first need to set up your Brand Voice. This helps the AI generate content that's perfectly on-brand for you.
      </p>
      <button 
        onClick={onNavigate} 
        className="mt-6 flex items-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-2 px-5 rounded-lg transition-all"
      >
        <SettingsIcon className="w-5 h-5 mr-2" />
        Go to Settings
      </button>
    </div>
  );
};

export default CompleteProfilePrompt;

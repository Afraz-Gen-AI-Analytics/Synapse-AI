
import React from 'react';
import AlertTriangleIcon from './icons/AlertTriangleIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirm",
  isConfirming = false,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-8 shadow-2xl shadow-black/30 w-full max-w-[320px] sm:max-w-md text-center transform transition-all animate-pop-in"
        onClick={e => e.stopPropagation()}
      >
        <AlertTriangleIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-red-500" />
        <h2 className="text-lg sm:text-2xl font-bold text-white mb-2">{title}</h2>
        <div className="text-sm sm:text-base text-slate-400 mb-5 sm:mb-6">{message}</div>
        
        <div className="flex justify-center gap-3 sm:gap-4">
            <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-3 sm:px-4 text-xs sm:text-sm rounded-lg transition-colors">
                Cancel
            </button>
             <button 
                onClick={onConfirm}
                disabled={isConfirming}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 sm:px-4 text-xs sm:text-sm rounded-lg transition-colors disabled:opacity-50"
            >
                {isConfirming ? "Processing..." : confirmButtonText}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

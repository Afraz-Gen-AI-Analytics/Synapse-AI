import React from 'react';
import { Toast as ToastProps, ToastType } from '../types';

// Icons for different toast types
const SuccessIcon = () => <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const ErrorIcon = () => <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const InfoIcon = () => <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;

interface ToastContainerProps {
  toasts: ToastProps[];
  removeToast: (id: number) => void;
}

const ToastIcons = {
    success: <SuccessIcon />,
    error: <ErrorIcon />,
    info: <InfoIcon />,
};

const Toast: React.FC<{ toast: ToastProps; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    return (
        <div
            className="flex items-start p-4 mb-4 w-full max-w-sm bg-slate-800 rounded-lg shadow-2xl shadow-black/30 border border-slate-700 animate-toast-in"
        >
            <div className="flex-shrink-0">
                {ToastIcons[toast.type]}
            </div>
            <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{toast.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="inline-flex text-slate-400 hover:text-white transition ease-in-out duration-150"
                >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </button>
            </div>
        </div>
    );
};


export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-0 right-0 p-6 z-[100]">
        {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
    </div>
  );
};

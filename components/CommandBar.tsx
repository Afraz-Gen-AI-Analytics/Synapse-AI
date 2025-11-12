import React, { useState, useEffect } from 'react';
import SearchIcon from './icons/SearchIcon';
import SparklesIcon from './icons/SparklesIcon';

interface CommandBarProps {
    onCommand: (command: string) => void;
    isLoading: boolean;
    error: string | null;
}

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-transparent border-b-white"></div>
);

const examplePrompts = [
    "Plan a launch campaign for a mobile app",
    "Analyze ad copy for an e-commerce site",
    "Create an ad image for a new sneaker",
    "Generate a video ad for a new tech gadget",
    "Write a tweet about sustainable fashion",
    "Create a video hook for a cooking channel",
    "Brainstorm blog topics about remote work",
    "Draft a promo email for a summer sale",
    "Write ad copy for a new productivity app",
];


const CommandBar: React.FC<CommandBarProps> = ({ onCommand, isLoading, error }) => {
    const [command, setCommand] = useState('');
    const [currentExample, setCurrentExample] = useState(examplePrompts[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentExample(prevExample => {
                const currentIndex = examplePrompts.indexOf(prevExample);
                const nextIndex = (currentIndex + 1) % examplePrompts.length;
                return examplePrompts[nextIndex];
            });
        }, 3500); // Change every 3.5 seconds

        return () => clearInterval(intervalId);
    }, []);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (command.trim() && !isLoading) {
            onCommand(command);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto animate-fade-in-up flex-shrink-0">
            <form onSubmit={handleSubmit} className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-slate-500" />
                </div>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Tell Synapse what you want to create... e.g., 'A LinkedIn post about AI in marketing'"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 pl-12 pr-28 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] transition"
                    disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                    <button
                        type="submit"
                        disabled={isLoading || !command.trim()}
                        className="flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20"
                    >
                        {isLoading ? <LoadingSpinner /> : <><SparklesIcon className="w-4 h-4 mr-1.5" /> Go</>}
                    </button>
                </div>
            </form>
            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            <div className="text-center mt-4">
                <p className="text-sm text-slate-500">
                    Try an example:
                    <button onClick={() => setCommand(currentExample)} className="ml-2 text-slate-400 hover:text-white transition-colors">"{currentExample}"</button>
                </p>
            </div>
        </div>
    );
};

export default CommandBar;
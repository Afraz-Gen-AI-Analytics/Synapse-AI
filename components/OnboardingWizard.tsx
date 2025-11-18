import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useToast } from '../contexts/ToastContext';
import { updateBrandProfile } from '../services/firebaseService';
import { generateContentStream, generateImage } from '../services/geminiService';
import SynapseLogo from './icons/SynapseLogo';
import TrendingUpIcon from './icons/TrendingUpIcon';
import RocketIcon from './icons/RocketIcon';
import SparklesIcon from './icons/SparklesIcon';
import SynapseCoreIcon from './icons/SynapseCoreIcon';
import ImageIcon from './icons/ImageIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface OnboardingWizardProps {
    user: User;
    onComplete: () => void;
}

const goals = [
    { name: 'Grow my social media', icon: TrendingUpIcon, tool: 'SocialMediaPost' },
    { name: 'Launch a new product', icon: RocketIcon, tool: 'MarketingEmail' },
    { name: 'Create Ad Visuals', icon: ImageIcon, tool: 'AIAdCreative' },
];

const loadingMessages = [
    "Accessing language models...",
    "Constructing narrative flow...",
    "Weaving words together...",
    "Optimizing for tone and style...",
    "Polishing the final draft...",
];

const GeneratingState: React.FC = () => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = loadingMessages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 2200);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 animate-fade-in-up">
            <SynapseCoreIcon className="w-24 h-24 mb-6"/>
            <h3 className="text-lg font-semibold text-white mb-2">AI is Thinking...</h3>
            <p className="transition-opacity duration-500">{message}</p>
        </div>
    );
};


const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete }) => {
    const [step, setStep] = useState(1);
    const [selectedGoal, setSelectedGoal] = useState<(typeof goals)[0] | null>(null);

    // Form state
    const [brandName, setBrandName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [toneOfVoice, setToneOfVoice] = useState('Professional');
    const [isSaving, setIsSaving] = useState(false);

    // Generation state
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const { addToast } = useToast();
    const toneOptions = ["Professional", "Encouraging", "Slightly witty", "Casual", "Bold"];
    
    const handleGoalSelect = (goal: (typeof goals)[0]) => {
        setSelectedGoal(goal);
        setStep(2);
    };

    const handleBrandInfoSubmit = async () => {
        if (!brandName || !productDescription || !targetAudience) {
            addToast("Please fill out all fields to continue.", "error");
            return;
        }
        setIsSaving(true);
        try {
            await updateBrandProfile(user.uid, { brandName, productDescription, targetAudience, toneOfVoice });
            
            let generatedPrompt = '';
            switch(selectedGoal?.tool) {
                case 'AIAdCreative':
                    generatedPrompt = `
                        A highly realistic, attractive, and engaging marketing image for our product: "${productDescription}".
                        This is for our brand, "${brandName}", which targets ${targetAudience}.

                        **Key Visual Requirements:**
                        - **Style:** Must be photorealistic with cinematic lighting and sharp focus.
                        - **Environment:** Place the product in a contextually relevant and visually appealing environment that tells a story and resonates with the target audience. Avoid simple, minimalistic studio backgrounds.
                        - **Vibe:** The overall image should feel premium, dynamic, and suitable for a high-impact advertising campaign.
                    `;
                    break;
                case 'SocialMediaPost':
                    generatedPrompt = `You are an expert social media manager. Generate a concise, impactful, and enthusiastic tweet (under 280 characters) to introduce our brand. The post must be attention-grabbing and include 2-3 highly relevant hashtags.\n\n**CRITICAL RULE:** Provide ONLY the direct post content. Do not include any introductory text or titles.\n\n**Brand Name:** "${brandName}"\n**Product:** "${productDescription}"\n**Target Audience:** "${targetAudience}"`;
                    break;
                case 'MarketingEmail':
                     generatedPrompt = `You are an expert marketing copywriter. Write a persuasive marketing email announcing our new product. The email's tone must be professional and enthusiastic. It must include 2-3 relevant emojis. Start with a heading for the subject line (e.g., '## Subject: ...').\n\n**CRITICAL RULE:** Provide ONLY the direct email content.\n\n**Product:** "${productDescription}"`;
                    break;
            }
            setPrompt(generatedPrompt);
            setStep(3);
        } catch (error) {
            addToast("Failed to save brand profile. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratedContent('');
        try {
            if (selectedGoal?.tool === 'AIAdCreative') {
                const result = await generateImage(prompt, '1:1', 'Photorealistic');
                setGeneratedContent(result);
            } else {
                let fullResponse = '';
                const stream = generateContentStream(prompt);
                for await (const chunk of stream) {
                    const textChunk = typeof chunk === 'string' ? chunk : chunk.text;
                    if (textChunk) {
                        fullResponse += textChunk;
                        setGeneratedContent(prev => prev + textChunk);
                    }
                }
            }
        } catch (error: any) {
            addToast(error.message || "Content generation failed.", "error");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const markdownToHtml = (text: string) => {
        return text
            .replace(/^## (.*$)/gim, '<h3 class="font-bold text-lg mb-2">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />');
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="text-center animate-fade-in-up w-full">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight"><span className="text-slate-200">Welcome, </span><span className="gradient-text">{user.displayName}</span><span className="text-slate-200">!</span></h1>
                        <p className="text-slate-300 mt-3 text-lg max-w-xl mx-auto">I'm Synapse, your AI co-pilot. To get started, what's your primary objective?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                            {goals.map(goal => {
                                const isSelected = selectedGoal?.name === goal.name; // In this step, nothing is selected, but this pattern is useful for step 2.
                                return (
                                <button 
                                    key={goal.name} 
                                    onClick={() => handleGoalSelect(goal)} 
                                    className={`relative group flex flex-col items-center justify-start p-6 text-center transition-all duration-300 rounded-2xl border bg-slate-900 hover:-translate-y-1
                                        ${isSelected 
                                            ? 'border-[var(--gradient-start)]/80 shadow-2xl shadow-[color:var(--gradient-start)]/15' 
                                            : 'border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    <div 
                                        className={`relative mb-4 flex h-14 w-14 items-center justify-center rounded-xl border transition-all duration-300
                                        ${isSelected 
                                            ? 'bg-slate-800 border-[var(--gradient-start)]/50' 
                                            : 'bg-slate-800 border-slate-700 group-hover:bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] group-hover:border-transparent'
                                        }`}
                                    >
                                        <goal.icon 
                                            className={`w-7 h-7 transition-colors duration-300
                                            ${isSelected 
                                                ? 'text-[var(--gradient-start)]' 
                                                : 'text-slate-500 group-hover:text-white'
                                            }`} 
                                        />
                                    </div>
                                    <span 
                                        className={`font-semibold transition-colors duration-300
                                        ${isSelected 
                                            ? 'text-white' 
                                            : 'text-slate-300 group-hover:text-white'
                                        }`}
                                    >
                                        {goal.name}
                                    </span>
                                </button>
                                );
                            })}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-fade-in-up w-full">
                         <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight text-center">Define Your Brand Voice</h1>
                        <p className="text-slate-300 mt-3 text-lg text-center mb-10 max-w-2xl mx-auto">This is critical for the AI. The more detail you provide, the better your results will be.</p>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Brand Name</label>
                                <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g., 'Momentum Labs'" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] transition"/>
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Product/Service Description</label>
                                <textarea rows={4} value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="e.g., 'A comprehensive productivity suite that unifies tasks, notes, and calendars into a single, focused workspace.'" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] transition"/>
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Target Audience</label>
                                <textarea rows={3} value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="e.g., 'Early-stage startup founders and product managers in the SaaS industry who are struggling with tool overload.'" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] transition"/>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Primary Tone of Voice</label>
                                <div className="relative">
                                    <select value={toneOfVoice} onChange={e => setToneOfVoice(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-[var(--gradient-end)] transition appearance-none">
                                        {toneOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                        <ChevronDownIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleBrandInfoSubmit} disabled={isSaving} className="w-full mt-10 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-4 rounded-lg disabled:opacity-50 transition-opacity text-lg">
                            {isSaving ? 'Saving...' : 'Next: Create First Asset'}
                        </button>
                    </div>
                );
            case 3:
                return (
                     <div className="animate-fade-in-up w-full">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight text-center">Your First Masterpiece</h1>
                        <p className="text-slate-300 mt-3 text-lg text-center mb-10">We've prepared your first piece of content based on your goal. Hit 'Generate' to see the magic!</p>
                        <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-4 text-lg rounded-lg disabled:opacity-50 flex items-center justify-center shadow-lg shadow-[color:var(--gradient-start)]/30">
                            {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><SparklesIcon className="w-5 h-5 mr-2" /> Generate Content</>}
                        </button>
                        
                        <div className="mt-8 bg-black/30 border border-slate-800 rounded-lg min-h-[300px] flex items-center justify-center p-6 prose prose-invert prose-sm max-w-none text-slate-300">
                            {isGenerating ? (
                                <GeneratingState />
                            ) : generatedContent ? (
                                generatedContent.startsWith('data:image') ? (
                                    <img src={generatedContent} alt="Generated ad creative" className="max-w-full max-h-96 object-contain rounded-md animate-fade-in-up" />
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedContent) }} className="w-full" />
                                )
                            ) : (
                                <p className="text-slate-500">Your content will appear here</p>
                            )}
                        </div>
                        
                        {generatedContent && !isGenerating && (
                             <button onClick={onComplete} className="w-full mt-8 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 text-lg rounded-lg transition-colors">
                                Finish & Enter Dashboard
                            </button>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full shadow-2xl shadow-black/30 max-h-full overflow-y-auto">
                <header className="p-6 text-center border-b border-slate-800/60">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-white' : 'bg-slate-600'} ${step === s ? 'scale-125' : ''}`} />
                        ))}
                    </div>
                    <SynapseLogo className="w-10 h-10 mx-auto" />
                </header>

                <main className="p-6 sm:p-10">
                    {renderStep()}
                </main>
            </div>
        </div>
    );
};

export default OnboardingWizard;
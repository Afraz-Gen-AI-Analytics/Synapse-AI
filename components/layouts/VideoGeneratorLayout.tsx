
import React from 'react';
import { Template, User } from '../../types';
import FileInput from '../FileInput';
import GenerationOutput from '../GenerationOutput';
import SpeechToTextInput from '../SpeechToTextInput';
import SparklesIcon from '../icons/SparklesIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import ProFeatureBadge from '../ProFeatureBadge';
import DiamondIcon from '../icons/DiamondIcon';

type UploadedFile = { data: string; mimeType: string; name: string; dataUrl: string };

interface VideoGeneratorLayoutProps {
    selectedTemplate: Template;
    user: User;
    topic: string;
    setTopic: (value: string) => void;
    extraFields: { [key: string]: string };
    handleFieldChange: (name: string, value: string) => void;
    isLoading: boolean;
    handleGenerate: () => void;
    videoStatus: string;
    videoUrl: string | null;
    handleCopy: (content: string, templateName: string) => void;
    uploadedImage: UploadedFile | null;
    handleFileSelect: (file: UploadedFile | null) => void;
    onEditImage: (imageDataUrl: string) => void;
    onGenerateImage: (prompt: string) => void;
    onAnalyzeResonance: (text: string) => void;
    onUpgrade?: () => void;
    generatedContent: string;
    generatedContents: string[];
    activeVariation: number;
    setActiveVariation: (value: number) => void;
    contentStats: { words: number, chars: number };
    dailyVideoCount?: number; // New prop
    dailyLimit?: number;     // New prop
}

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const VideoGeneratorLayout: React.FC<VideoGeneratorLayoutProps> = (props) => {
    const {
        selectedTemplate, user, topic, setTopic, extraFields, handleFieldChange,
        isLoading, handleGenerate, videoStatus, videoUrl,
        handleCopy, uploadedImage, handleFileSelect, onEditImage,
        onGenerateImage,
        onAnalyzeResonance,
        onUpgrade,
        generatedContent,
        generatedContents,
        activeVariation,
        setActiveVariation,
        contentStats,
        dailyVideoCount = 0,
        dailyLimit = 3
    } = props;
    const cost = selectedTemplate.creditCost || 50;

    return (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-full">
            {/* Input Column */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 flex flex-col p-6">
                <div className="mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <h1 className={`text-2xl font-bold ${selectedTemplate.isPro ? 'gradient-text' : 'text-white'}`}>{selectedTemplate.name}</h1>
                            {selectedTemplate.isPro && <ProFeatureBadge />}
                        </div>
                        {/* Daily limit badge removed as per request */}
                    </div>
                    <p className="text-slate-400 mt-1">{selectedTemplate.description}</p>
                </div>
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 -mr-2">
                    <div className="space-y-2 flex-grow flex flex-col">
                        <label htmlFor="topic" className="block text-sm font-semibold text-slate-300">1. Prompt</label>
                        <SpeechToTextInput
                            id="topic"
                            rows={5}
                            value={topic}
                            onTextChange={setTopic}
                            placeholder={selectedTemplate.placeholder}
                            className="w-full h-full flex-grow bg-slate-800/50 border border-slate-700 rounded-lg p-3 pr-14 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] focus:border-[var(--gradient-end)] transition"
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-300">2. Starting Image (Optional)</label>
                        <FileInput 
                            onFileSelect={handleFileSelect}
                            acceptedTypes="image/png, image/jpeg, image/webp"
                            label="Upload a starting image"
                            value={uploadedImage}
                        />
                    </div>
                    <div className="space-y-4">
                         <h3 className="text-sm font-semibold text-slate-300">3. Settings</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedTemplate.fields?.map(field => (
                                <div key={field.name}>
                                    <label htmlFor={field.name} className="block text-sm font-medium text-slate-400 mb-1">{field.label}</label>
                                    <div className="relative">
                                        <select 
                                            id={field.name} 
                                            value={extraFields[field.name] || ''} 
                                            onChange={(e) => handleFieldChange(field.name, e.target.value)} 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[var(--gradient-end)] transition appearance-none"
                                        >
                                            {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                            <ChevronDownIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-auto pt-6 border-t border-slate-800">
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20">
                        {isLoading ? <LoadingSpinner/> : <span className="flex items-center">
                            <SparklesIcon className="w-5 h-5 mr-2" /> 
                            {user.plan === 'freemium' ? 'Upgrade to Generate Video' : `Generate (${cost} `}
                            {user.plan !== 'freemium' && <DiamondIcon className="w-4 h-4 ml-1 inline-block" />}
                            {user.plan !== 'freemium' && `)`}
                        </span>}
                    </button>
                </div>
            </div>

            {/* Output Column */}
            <GenerationOutput
                isLoading={isLoading}
                generatedContent={generatedContent}
                generatedContents={generatedContents}
                activeVariation={activeVariation}
                setActiveVariation={setActiveVariation}
                contentStats={contentStats}
                handleCopy={handleCopy}
                selectedTemplate={selectedTemplate}
                topic={topic}
                originalImageUrl={null}
                videoStatus={videoStatus}
                videoUrl={videoUrl}
                onEditImage={onEditImage}
                onGenerateImage={onGenerateImage}
                onAnalyzeResonance={onAnalyzeResonance}
                onUpgrade={onUpgrade}
            />
        </div>
    );
};

export default VideoGeneratorLayout;

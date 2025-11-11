import React, { useEffect, useState } from 'react';
import { Template, ContentType } from '../types';
import { markdownToHtml } from './Dashboard';
import SynapseCoreIcon from './icons/SynapseCoreIcon'; // Changed from BrainCircuitIcon
import CopyIcon from './icons/CopyIcon';
import ImageIcon from './icons/ImageIcon';
import SparklesIcon from './icons/SparklesIcon';
import ImageComparator from './ImageComparator';
import VideoPlayer from './VideoPlayer';
import FilmIcon from './icons/FilmIcon';
import EditImageIcon from './icons/EditImageIcon';

interface GenerationOutputProps {
    isLoading: boolean;
    generatedContent: string;
    generatedContents: string[];
    activeVariation: number;
    setActiveVariation: (value: number) => void;
    contentStats: { words: number; chars: number };
    handleCopy: (content: string, templateName: string, topic?: string) => void;
    selectedTemplate: Template;
    topic: string;
    originalImageUrl: string | null;
    videoStatus: string;
    videoUrl: string | null;
}

const textLoadingMessages = [
    "Accessing language models...",
    "Constructing narrative flow...",
    "Weaving words together...",
    "Optimizing for tone and style...",
    "Polishing the final draft...",
];

const imageLoadingMessages = [
    "Consulting visual cortex...",
    "Calibrating color matrix...",
    "Rendering photon data...",
    "Applying artistic filters...",
    "Focusing the digital lens...",
];

const videoLoadingMessages = [
    "Initializing render farm...",
    "Synthesizing motion vectors...",
    "Assembling keyframes...",
    "Encoding video stream...",
    "This may take a few minutes...",
];

const campaignLoadingMessages = [
    "Analyzing strategic vectors...",
    "Mapping audience engagement...",
    "Formulating multi-phase plan...",
    "Defining key marketing assets...",
    "Finalizing campaign blueprint...",
];


const LoadingState: React.FC<{ template: Template }> = ({ template }) => {
    let messages: string[];

    switch(template.id) {
        case ContentType.AIImage:
        case ContentType.AIImageEditor:
            messages = imageLoadingMessages;
            break;
        case ContentType.AIVideoGenerator:
            messages = videoLoadingMessages;
            break;
        case ContentType.Campaign:
            messages = campaignLoadingMessages;
            break;
        default:
            messages = textLoadingMessages;
    }

    const [message, setMessage] = useState(messages[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = messages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % messages.length;
                return messages[nextIndex];
            });
        }, 2200);
        return () => clearInterval(interval);
    }, [messages]);
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 animate-fade-in-up">
            <SynapseCoreIcon className="w-24 h-24 mb-6"/>
            <h3 className="text-lg font-semibold text-white mb-2">AI is Thinking...</h3>
            <p className="transition-opacity duration-500">{message}</p>
        </div>
    );
};


const GenerationOutput: React.FC<GenerationOutputProps> = (props) => {
    const {
        isLoading, generatedContent, generatedContents, activeVariation, setActiveVariation,
        contentStats, handleCopy, selectedTemplate, topic,
        originalImageUrl, videoStatus, videoUrl
    } = props;
    
    const isImageTool = selectedTemplate.id === ContentType.AIImage;
    const isImageEditTool = selectedTemplate.id === ContentType.AIImageEditor;
    const isVideoTool = selectedTemplate.id === ContentType.AIVideoGenerator;

    const renderMainContent = () => {
        // --- LOADING STATES ---
        if (isLoading) {
            if (isVideoTool) {
                return <VideoPlayer status={videoStatus} url={null} />;
            }
            if (isImageEditTool && originalImageUrl) {
                return (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img src={originalImageUrl} alt="Editing in progress" className="max-w-full max-h-full object-contain rounded-md opacity-30" />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center">
                            <LoadingState template={selectedTemplate} />
                        </div>
                    </div>
                );
            }
            return <LoadingState template={selectedTemplate} />;
        }

        // --- GENERATED CONTENT STATES ---
        if (videoUrl) {
            return <VideoPlayer status="" url={videoUrl} />;
        }

        if (generatedContent) {
            if (isImageEditTool && originalImageUrl) {
                return <ImageComparator before={originalImageUrl} after={generatedContent} />;
            }
            if (isImageTool || isImageEditTool) {
                return <img src={generatedContent} alt={topic} className="object-contain max-w-full max-h-full rounded-md animate-fade-in-up" />;
            }
            // Default to text content
            return (
                <div className="w-full">
                    <div
                        className="prose prose-invert prose-sm max-w-none text-slate-300"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedContent) }}
                    />
                </div>
            );
        }

        // --- PLACEHOLDER STATES ---
        let PlaceholderIcon = SparklesIcon;
        let placeholderTitle = "Your masterpiece awaits...";
        let placeholderText = "Your AI-generated content will appear here.";

        if (isImageTool) {
            PlaceholderIcon = ImageIcon;
            placeholderTitle = "The canvas is ready";
            placeholderText = "Your generated image will appear here.";
        } else if (isImageEditTool) {
            PlaceholderIcon = EditImageIcon;
             placeholderTitle = "Ready to edit";
            placeholderText = "Your edited image will appear here.";
        } else if (isVideoTool) {
            PlaceholderIcon = FilmIcon;
            placeholderTitle = "Ready for action";
            placeholderText = "Your generated video will appear here.";
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <div className="relative w-20 h-20 mb-4">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] opacity-10 blur-xl"></div>
                    <PlaceholderIcon className="w-20 h-20 text-slate-700"/>
                </div>
                <h3 className="font-semibold text-slate-400">{placeholderTitle}</h3>
                <p>{placeholderText}</p>
            </div>
        );
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 flex flex-col p-0 lg:h-full">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 flex-shrink-0">
                <h2 className="font-semibold text-white">Creation Canvas</h2>
                <div className="flex items-center gap-4">
                    {generatedContent && !isLoading && !isImageTool && !isVideoTool && (
                        <div className="text-xs text-slate-400 flex justify-end gap-4">
                            <span>{contentStats.words} words</span>
                            <span>{contentStats.chars} characters</span>
                        </div>
                    )}
                     {(isImageTool || isImageEditTool) && generatedContent && !isLoading && (
                        <a href={generatedContent} download={`synapse-ai-${topic.substring(0, 20)}.png`} className="flex items-center text-sm text-slate-300 hover:text-white transition-colors">
                            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10H18L12 16L6 10H11V3H13V10ZM4 19H20V12H22V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V12H4V19Z"></path></svg>
                            Download
                        </a>
                    )}
                     {isVideoTool && videoUrl && !isLoading && (
                        <a href={videoUrl} download={`synapse-ai-video.mp4`} className="flex items-center text-sm text-slate-300 hover:text-white transition-colors">
                           <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10H18L12 16L6 10H11V3H13V10ZM4 19H20V12H22V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V12H4V19Z"></path></svg>
                           Download
                        </a>
                    )}
                    <button onClick={() => handleCopy(generatedContent, selectedTemplate.name, topic)} disabled={!generatedContent && !topic || isLoading} className="flex items-center text-sm text-slate-300 hover:text-white disabled:text-slate-500 disabled:cursor-not-allowed transition-colors">
                        <CopyIcon className="w-4 h-4 mr-2" /> {isImageTool || isVideoTool || isImageEditTool ? 'Copy Prompt' : 'Copy'}
                    </button>
                </div>
            </div>

            {generatedContents.length > 1 && !isLoading && (
                <div className="flex border-b border-slate-800 px-4 flex-shrink-0">
                    {generatedContents.map((_, index) => {
                        const label = selectedTemplate.id === ContentType.BlogIdea ? 'Idea' : 'Variation';
                        return (
                            <button
                                key={index}
                                onClick={() => setActiveVariation(index)}
                                className={`px-4 py-2 text-sm font-semibold transition-colors focus:outline-none -mb-px ${activeVariation === index ? 'text-white border-b-2 border-[var(--gradient-end)]' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}
                            >
                                {label} {index + 1}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="p-6 flex-1 overflow-y-auto bg-black/40 shadow-inner shadow-black/20 min-h-[200px] lg:min-h-0 flex items-center justify-center">
                {renderMainContent()}
            </div>
        </div>
    );
};

export default GenerationOutput;
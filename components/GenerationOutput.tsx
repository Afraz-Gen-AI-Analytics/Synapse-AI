import React, { useEffect, useState } from 'react';
import { Template, ContentType, ResonanceFeedback } from '../types';
import { markdownToHtml } from './Dashboard';
import SynapseCoreIcon from './icons/SynapseCoreIcon'; // Changed from BrainCircuitIcon
import CopyIcon from './icons/CopyIcon';
import ImageIcon from './icons/ImageIcon';
import SparklesIcon from './icons/SparklesIcon';
import ImageSliderComparator from './ImageSliderComparator';
import VideoPlayer from './VideoPlayer';
import FilmIcon from './icons/FilmIcon';
import EditImageIcon from './icons/EditImageIcon';
import ResonanceIcon from './icons/ResonanceIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import TargetIcon from './icons/TargetIcon';
import DownloadIcon from './icons/DownloadIcon';
import EditIcon from './icons/EditIcon';
import { useToast } from '../contexts/ToastContext';
import ExternalLinkIcon from './icons/ExternalLinkIcon';

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
    onEditImage: (imageDataUrl: string) => void;
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

const resonanceLoadingMessages = [
    "Embodying target audience persona...",
    "Simulating gut reactions...",
    "Analyzing for clarity and persuasion...",
    "Identifying potential objections...",
    "Formulating actionable feedback...",
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
        case ContentType.ResonanceEngine:
            messages = resonanceLoadingMessages;
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

const ScoreDial: React.FC<{ score: number; label: string; color: string }> = ({ score, label, color }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 10) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="56" cy="56" />
                    <circle
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="56"
                        cy="56"
                        style={{ color, transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{score}</span>
                    <span className="text-sm text-slate-400">/10</span>
                </div>
            </div>
            <p className="font-semibold text-slate-300 mt-2">{label}</p>
        </div>
    );
};

const ResonanceReport: React.FC<{ feedback: ResonanceFeedback }> = ({ feedback }) => {
    return (
        <div className="w-full space-y-6 text-sm animate-fade-in-up">
            {/* Scores Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-800/50 rounded-lg">
                <ScoreDial score={feedback.clarityScore} label="Clarity Score" color="var(--gradient-start)" />
                <ScoreDial score={feedback.persuasionScore} label="Persuasion Score" color="var(--gradient-end)" />
            </div>

            {/* Feedback Details */}
            <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2 text-green-400" /> First Impression</h4>
                    <p className="text-slate-400 italic">"{feedback.firstImpression}"</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center"><TargetIcon className="w-5 h-5 mr-2 text-sky-400" /> Goal Alignment</h4>
                    <p className="text-slate-400">{feedback.goalAlignment}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-fuchsia-400" /> Emotional Resonance</h4>
                    <p className="text-slate-400">{feedback.emotionAnalysis}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center"><QuestionMarkCircleIcon className="w-5 h-5 mr-2 text-yellow-400" /> Key Questions & Doubts</h4>
                    <ul className="list-disc list-inside text-slate-400 space-y-1">
                        {feedback.keyQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center"><LightbulbIcon className="w-5 h-5 mr-2 text-sky-400" /> Suggested Improvement</h4>
                    <p className="text-slate-400">{feedback.suggestedImprovement}</p>
                </div>
            </div>
        </div>
    );
};


const GenerationOutput: React.FC<GenerationOutputProps> = (props) => {
    const {
        isLoading, generatedContent, generatedContents, activeVariation, setActiveVariation,
        contentStats, handleCopy, selectedTemplate, topic,
        originalImageUrl, videoStatus, videoUrl, onEditImage
    } = props;
    
    const { addToast } = useToast();
    
    const isImageTool = selectedTemplate.id === ContentType.AIImage;
    const isImageEditTool = selectedTemplate.id === ContentType.AIImageEditor;
    const isVideoTool = selectedTemplate.id === ContentType.AIVideoGenerator;
    const isResonanceTool = selectedTemplate.id === ContentType.ResonanceEngine;

    const copyButtonText = isResonanceTool 
        ? 'Copy Report' 
        : (isImageTool || isVideoTool || isImageEditTool) 
            ? 'Copy Prompt' 
            : 'Copy';

    const handleOpenInGmail = () => {
        let subject = '';
        let body = generatedContent;

        const subjectMatch = generatedContent.match(/^## Subject:\s*(.*)/);
        if (subjectMatch && subjectMatch[1]) {
            subject = subjectMatch[1].trim();
            // Remove subject line from body
            body = generatedContent.replace(/^## Subject:\s*(.*)\r?\n/, '').trim();
        }

        // Convert markdown body to plain text for the URL
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = markdownToHtml(body).replace(/<br\s*\/?>/gi, '\n');
        const plainTextBody = tempDiv.textContent || tempDiv.innerText || '';

        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainTextBody)}`;
        
        window.open(gmailUrl, '_blank');
        addToast("Opening email in Gmail compose window.", "info");
    };

    const renderMainContent = () => {
        if (isLoading) {
            if (isVideoTool) {
                return <VideoPlayer status={videoStatus} url={null} />;
            }
            return <LoadingState template={selectedTemplate} />;
        }

        if (videoUrl) {
            return <VideoPlayer status="" url={videoUrl} />;
        }

        if (generatedContent) {
             if (isResonanceTool) {
                try {
                    const feedback = JSON.parse(generatedContent);
                    return <ResonanceReport feedback={feedback} />;
                } catch (e) {
                    return <p className="text-red-400">Error: Could not parse feedback report.</p>;
                }
            }
            if (isImageEditTool && originalImageUrl) {
                return <ImageSliderComparator before={originalImageUrl} after={generatedContent} />;
            }
            if (isImageTool || isImageEditTool) {
                return <img src={generatedContent} alt={topic} className="object-contain max-w-full max-h-full rounded-md animate-fade-in-up" />;
            }
            return (
                <div className="w-full">
                    <div
                        className="prose prose-invert prose-sm max-w-none text-slate-300"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedContent) }}
                    />
                </div>
            );
        }

        let PlaceholderIcon = SparklesIcon;
        let placeholderTitle = "Your masterpiece awaits...";
        let placeholderText = "Your AI-generated content will appear here.";
        
        if (isResonanceTool) {
            PlaceholderIcon = ResonanceIcon;
            placeholderTitle = "Ready to Analyze";
            placeholderText = "Your content's resonance report will appear here.";
        } else if (isImageTool) {
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
                <div className="flex items-center">
                    {generatedContent && !isLoading && !isImageTool && !isImageEditTool && !isVideoTool && !isResonanceTool && (
                        <div className="text-xs text-slate-400 flex justify-end gap-4 mr-4">
                            <span>{contentStats.words} words</span>
                            <span>{contentStats.chars} characters</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 md:gap-3 text-sm text-slate-300">
                        {isImageTool && generatedContent && !isLoading && onEditImage && (
                            <button onClick={() => onEditImage(generatedContent)} className="flex items-center p-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors" title="Edit Image">
                                <EditIcon className="w-4 h-4 md:mr-1.5"/>
                                <span className="hidden md:inline">Edit</span>
                            </button>
                        )}

                        {((isImageTool || isImageEditTool) && generatedContent && !isLoading) && (
                            <a href={generatedContent} download={`synapse-ai-${topic.substring(0, 20)}.png`} className="flex items-center p-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors" title="Download">
                                <DownloadIcon className="w-4 h-4 md:mr-1.5"/>
                                <span className="hidden md:inline">Download</span>
                            </a>
                        )}
                        {isVideoTool && videoUrl && !isLoading && (
                            <a href={videoUrl} download={`synapse-ai-video.mp4`} className="flex items-center p-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors" title="Download">
                               <DownloadIcon className="w-4 h-4 md:mr-1.5"/>
                               <span className="hidden md:inline">Download</span>
                            </a>
                        )}
                        
                        {selectedTemplate.id === ContentType.EmailCopy && generatedContent && !isLoading && (
                             <button onClick={handleOpenInGmail} className="flex items-center p-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors" title="Open in Gmail">
                                <ExternalLinkIcon className="w-4 h-4 md:mr-1.5" />
                                <span className="hidden md:inline">Email</span>
                            </button>
                        )}

                        <button onClick={() => handleCopy(generatedContent, selectedTemplate.name, topic)} disabled={(!generatedContent && !topic) || isLoading} className="flex items-center p-2 rounded-md hover:bg-slate-700 hover:text-white disabled:text-slate-500 disabled:cursor-not-allowed transition-colors" title={copyButtonText}>
                            <CopyIcon className="w-4 h-4 md:mr-1.5" />
                            <span className="hidden md:inline">{copyButtonText}</span>
                        </button>
                    </div>
                </div>
            </div>

            {generatedContents.length > 1 && !isLoading && !isResonanceTool && (
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

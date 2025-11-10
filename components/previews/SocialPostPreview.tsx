import React, { useState, useCallback, useEffect } from 'react';
import { SocialPostContent, BrandProfile } from '../../types';
import { generateImage } from '../../services/geminiService';
import SparklesIcon from '../icons/SparklesIcon';
import AtSignIcon from '../icons/AtSignIcon';
import ImageIcon from '../icons/ImageIcon';
import DownloadIcon from '../icons/DownloadIcon';
import TwitterIcon from '../icons/TwitterIcon';
import LinkedInIcon from '../icons/LinkedInIcon';
import FacebookIcon from '../icons/FacebookIcon';

interface SocialPostPreviewProps {
    content: SocialPostContent;
    onChange?: (newContent: SocialPostContent) => void;
    brandProfile: BrandProfile | null;
}

const GeneratedImageViewer: React.FC<{prompt: string}> = ({ prompt }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await generateImage(prompt, '16:9', 'Photorealistic');
            setImageUrl(result);
        } catch (e: any) {
            setError(e.message || 'Image generation failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);
    
    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `synapse-ai-image-${prompt.substring(0, 20)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="mt-4 aspect-video rounded-lg border border-slate-700/80 overflow-hidden flex flex-col justify-center relative bg-slate-900/50">
            {imageUrl ? (
                 <div className="relative group w-full h-full">
                    <img src={imageUrl} alt={prompt} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2">
                         <button onClick={handleDownload} className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs backdrop-blur-sm border border-slate-600/50">
                            <DownloadIcon className="w-3.5 h-3.5" /> Download
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center p-4">
                    <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2"/>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2" title={prompt}>
                        <span className="font-semibold text-slate-400">Image Prompt:</span> {prompt}
                    </p>
                    
                    {!isLoading && (
                        <button onClick={handleGenerate} className="flex items-center mx-auto text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-1.5 px-3 rounded-md transition-colors">
                           <SparklesIcon className="w-3.5 h-3.5 mr-1.5"/> Generate Image
                        </button>
                    )}
                    
                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                </div>
            )}
            
            {isLoading && (
                <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center">
                    <div className="text-center">
                         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                         <p className="text-xs text-slate-300 mt-2">Generating...</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const platformIcons: { [key in SocialPostContent['platform']]: React.FC<{ className?: string }> } = {
    Twitter: TwitterIcon,
    LinkedIn: LinkedInIcon,
    Facebook: FacebookIcon,
};

const SocialPostPreview: React.FC<SocialPostPreviewProps> = ({ content, onChange, brandProfile }) => {
    const [copy, setCopy] = useState(content.copy);
    const [hashtags, setHashtags] = useState(content.hashtags);
    
    useEffect(() => {
        setCopy(content.copy);
        setHashtags(content.hashtags);
    }, [content]);

    const handleCopyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCopy(e.target.value);
        if (onChange) {
            onChange({ ...content, copy: e.target.value });
        }
    };

    const handleHashtagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHashtags(e.target.value);
        if (onChange) {
            onChange({ ...content, hashtags: e.target.value });
        }
    };
    
    const handleName = brandProfile?.brandName || 'Your Brand';
    const platformKey = content.platform.toLowerCase() as keyof BrandProfile['socialMediaHandles'];
    const handle = brandProfile?.socialMediaHandles?.[platformKey] || 'yourhandle';
    const PlatformIcon = platformIcons[content.platform] || TwitterIcon;

    return (
        <div className="bg-slate-800/40 p-5 rounded-lg border border-slate-700/80 w-full text-sm h-full flex flex-col">
            <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex-shrink-0 mr-3"></div>
                <div className="flex-1">
                    <p className="font-bold text-white">{handleName}</p>
                    <p className="text-slate-400 flex items-center"><AtSignIcon className="w-3.5 h-3.5 mr-0.5"/>{handle}</p>
                </div>
                <PlatformIcon className="w-5 h-5 text-slate-500" />
            </div>
            <div className="mt-3 space-y-3 flex-grow">
                {onChange ? (
                    <textarea 
                        value={copy} 
                        onChange={handleCopyChange} 
                        rows={5} 
                        className="w-full bg-transparent text-slate-300 focus:outline-none resize-none"
                    />
                ) : (
                    <p className="text-slate-300 whitespace-pre-wrap">{copy}</p>
                )}
                
                {onChange ? (
                    <input 
                        type="text" 
                        value={hashtags} 
                        onChange={handleHashtagsChange} 
                        className="w-full bg-transparent text-sky-400 focus:outline-none"
                    />
                ) : (
                     <p className="text-sky-400">{hashtags}</p>
                )}
            </div>

            <GeneratedImageViewer prompt={content.imagePrompt} />
        </div>
    );
};

export default SocialPostPreview;

import React, { useEffect, useState } from 'react';
import SynapseCoreIcon from './icons/SynapseCoreIcon';

interface VideoPlayerProps {
    status: string;
    url: string | null;
}

const loadingMessages = [
  "Warming up the video synthesizer...",
  "Gathering pixels from the digital ether...",
  "Directing the digital actors...",
  "Rendering cinematic frames...",
  "Applying special effects...",
  "This can take a few minutes, the AI is working hard!",
  "Finalizing the cut...",
];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ status, url }) => {
    const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        if (status) {
            const interval = setInterval(() => {
                setCurrentMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [status]);

    if (url) {
        return <video src={url} controls autoPlay loop className="w-full h-full object-contain rounded-md bg-black" />;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 animate-fade-in-up">
            <SynapseCoreIcon className="w-24 h-24 mb-6"/>
            <h3 className="text-lg font-semibold text-white mb-2">{status || "Initializing..."}</h3>
            <p className="transition-opacity duration-500 max-w-xs mx-auto">{currentMessage}</p>
        </div>
    );
};

export default VideoPlayer;

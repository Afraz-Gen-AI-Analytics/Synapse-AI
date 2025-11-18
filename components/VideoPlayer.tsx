import React, { useEffect, useState } from 'react';

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
        return <video src={url} controls autoPlay loop className="w-full h-full object-contain rounded-md" />;
    }

    return (
        <div className="w-full h-full bg-slate-700/50 rounded-md animate-pulse flex items-center justify-center p-4">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="font-semibold text-white">{status || "Initializing..."}</p>
                <p className="text-sm text-slate-300 mt-2">{currentMessage}</p>
            </div>
        </div>
    );
};

export default VideoPlayer;
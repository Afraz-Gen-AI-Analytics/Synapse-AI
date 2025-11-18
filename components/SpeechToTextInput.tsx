import React, { useState, useEffect, useRef, useCallback } from 'react';
import MicrophoneIcon from './icons/MicrophoneIcon';
import { useToast } from '../contexts/ToastContext';
import Tooltip from './Tooltip';

// Type declarations for the Web Speech API
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// This is the constructor type
interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}

// This is the instance type
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

// Cross-browser compatibility for the Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

interface SpeechToTextInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onTextChange: (value: string) => void;
}

const SpeechToTextInput: React.FC<SpeechToTextInputProps> = ({ value, onTextChange, ...props }) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const originalTextRef = useRef(''); // To store text before starting dictation
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { addToast } = useToast();

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [value]);

    const handleResult = useCallback((event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');

        // Ensure a space between original text and transcript, but only if needed.
        const prefix = originalTextRef.current;
        const separator = (prefix && prefix.length > 0 && !/\s$/.test(prefix)) ? ' ' : '';

        const newText = `${prefix}${separator}${transcript}`;
        
        onTextChange(newText);
    }, [onTextChange]);

    useEffect(() => {
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Keep listening until manually stopped
        recognition.interimResults = true; // Show results as they are recognized
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = handleResult;
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            let errorMessage = event.error;
            if (event.error === 'not-allowed') {
                errorMessage = "Microphone access denied. Please allow microphone permissions in your browser settings.";
            } else if (event.error === 'no-speech') {
                errorMessage = "No speech was detected. Please try again.";
            }
            addToast(`Speech recognition error: ${errorMessage}`, 'error');
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
        
        recognitionRef.current = recognition;

        // Cleanup on unmount
        return () => {
            recognitionRef.current?.abort();
        };
    }, [addToast, handleResult]);

    const toggleListening = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!recognitionRef.current) {
            addToast("Speech recognition is not supported on this browser.", "error");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            originalTextRef.current = String(value || ''); // Save current text
            recognitionRef.current.start();
        }
    };

    if (!SpeechRecognition) {
        // Fallback to a normal textarea if the browser doesn't support the API
        return <textarea ref={textareaRef} value={value} onChange={(e) => onTextChange(e.target.value)} {...props} />;
    }

    return (
        <div className="relative w-full h-full">
            <textarea ref={textareaRef} value={value} onChange={(e) => onTextChange(e.target.value)} {...props} />
            <Tooltip text={isListening ? "Stop Listening" : "Start Listening"} position="top">
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${isListening ? 'bg-red-500 text-white animate-pulse ring-red-500/50' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white ring-transparent'}`}
                    aria-label={isListening ? "Stop voice input" : "Start voice input"}
                >
                    <MicrophoneIcon className="w-5 h-5" />
                </button>
            </Tooltip>
        </div>
    );
};

export default SpeechToTextInput;
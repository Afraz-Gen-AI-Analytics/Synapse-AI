import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { User } from '../types';
import HeadsetIcon from './icons/HeadsetIcon';
import SynapseCoreIcon from './icons/SynapseCoreIcon';
import UserIcon from './icons/UserIcon';


// Helper functions for audio encoding/decoding, defined in the component file for simplicity
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type AgentState = 'idle' | 'listening' | 'speaking';
type TranscriptItem = { speaker: 'user' | 'agent'; text: string; isFinal: boolean };

// Define the shape of the live session object for type safety
interface LiveSession {
    sendRealtimeInput(input: { media: Blob }): void;
    close(): void;
}

interface LiveAgentViewProps {
    user: User;
}

const professionalSystemInstruction = `You are Synapse, the AI assistant for the Synapse AI platform. Your role is to guide users. Be professional, clear, and only discuss Synapse AI features.

**KNOWLEDGE BASE**

*   **Platform:** Synapse AI - AI Command Center for marketing.
*   **Your Role:** Onboard assistant.
*   **Your Name:** Synapse.

**FEATURES (TABS)**
*   **Home:** Welcome screen, quick-starts, summaries.
*   **Tools:** Main content creation suite.
*   **Live Agent:** You! Real-time voice chat for help.
*   **Agents (PRO):** Deploy autonomous AI to run marketing campaigns.
*   **Analytics (PRO):** Dashboards for KPIs, content performance, ROI.
*   **History:** Log of all past generations.
*   **Settings:** Configure "Brand Voice" for on-brand content.

**TOOLS**
*   **Campaign Builder (PRO):** Full campaign from one goal.
*   **AI Image & Editor:** Create and edit images with text.
*   **AI Video Generator (PRO):** Create videos from text or images.
*   **Social Media Post:** For Twitter, LinkedIn, etc.
*   **Video Script Hook:** Catchy intros for short videos.
*   **Blog Post Ideas:** Brainstorm blog topics.
*   **Marketing Email:** Write persuasive emails.
*   **Ad Copy:** For Google/Facebook ads.

**PLANS**
*   **Freemium ($0/mo):** 10 generations/month, 1 Agent. No Pro features.
*   **Pro ($49/mo or $39/mo annually):** Unlimited access to everything.
*   **Enterprise (Custom):** For large teams, includes custom solutions.

**RULES**
1.  Introduce yourself as Synapse.
2.  Explain features clearly when asked.
3.  For Pro features, mention their value and that they are part of the Pro plan.
4.  End conversations helpfully (e.g., "What else can I help you with?").
`;

const LiveAgentView: React.FC<LiveAgentViewProps> = ({ user }) => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [agentState, setAgentState] = useState<AgentState>('idle');
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const [systemInstruction, setSystemInstruction] = useState(professionalSystemInstruction);
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
        }
    }, [transcript]);

    const cleanup = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        inputAudioContextRef.current?.close();
        inputAudioContextRef.current = null;
        outputAudioContextRef.current?.close();
        outputAudioContextRef.current = null;
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        setStatus('disconnected');
        setAgentState('idle');
    }, []);
    
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const handleConnect = useCallback(async () => {
        if (status === 'connected' || status === 'connecting') {
            cleanup();
            return;
        }
        
        setStatus('connecting');
        setError(null);
        setTranscript([]);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API Key is not configured.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Your browser does not support the necessary audio APIs.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('connected');
                        setAgentState('listening');

                        if (!inputAudioContextRef.current) return;
                        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };

                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        setAgentState('speaking');

                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscription += text;
                            setTranscript(prev => {
                                const last = prev[prev.length -1];
                                if (last?.speaker === 'user' && !last.isFinal) {
                                    return [...prev.slice(0, -1), { ...last, text: currentInputTranscription }];
                                }
                                return [...prev, { speaker: 'user', text, isFinal: false }];
                            });
                        }

                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputTranscription += text;
                             setTranscript(prev => {
                                const last = prev[prev.length -1];
                                if (last?.speaker === 'agent' && !last.isFinal) {
                                    return [...prev.slice(0, -1), { ...last, text: currentOutputTranscription }];
                                }
                                return [...prev, { speaker: 'agent', text, isFinal: false }];
                            });
                        }
                        
                        if (message.serverContent?.turnComplete) {
                            setTranscript(prev => prev.map(item => ({ ...item, isFinal: true })));
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const outputCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const sourceNode = outputCtx.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputCtx.destination);
                            
                            sourceNode.addEventListener('ended', () => {
                                sourcesRef.current.delete(sourceNode);
                                if(sourcesRef.current.size === 0) {
                                    setAgentState('listening');
                                }
                            });
                            
                            sourceNode.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(sourceNode);
                        }
                        
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            for (const source of sourcesRef.current.values()) {
                                source.stop();
                                sourcesRef.current.delete(source);
                            }
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError('A connection error occurred. Please try again.');
                        cleanup();
                        setStatus('error');
                    },
                    onclose: () => {
                        cleanup();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    systemInstruction,
                },
            });

        } catch (err: any) {
            console.error('Connection failed:', err);
            setError(err.message || 'Failed to start the session.');
            cleanup();
            setStatus('error');
        }
    }, [status, systemInstruction, cleanup]);

    const isConnected = status === 'connected' || status === 'connecting';
    const connectButtonText = isConnected ? 'Disconnect' : 'Connect & Start Talking';
    const connectButtonClass = isConnected 
      ? "bg-red-500 hover:bg-red-600" 
      : "bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90";

    let statusText: string;
    let visualizerAnimationClass: string = '';

    switch (status) {
        case 'connecting':
            statusText = 'Connecting...';
            visualizerAnimationClass = 'animate-visualizer-pulse';
            break;
        case 'connected':
            if (agentState === 'speaking') {
                statusText = 'Speaking...';
                visualizerAnimationClass = 'animate-visualizer-speaking';
            } else {
                statusText = 'Listening...';
                visualizerAnimationClass = 'animate-visualizer-pulse';
            }
            break;
        case 'error':
            statusText = 'Connection Error';
            visualizerAnimationClass = ''; // No animation on error
            break;
        case 'disconnected':
        default:
            statusText = 'Ready to Connect';
            visualizerAnimationClass = ''; // No animation when disconnected
            break;
    }


    return (
        <div className="flex-1 flex flex-col bg-slate-900 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex-shrink-0">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3"><HeadsetIcon className="w-7 h-7"/> Live Conversational Agent</h1>
                <p className="text-slate-400 mt-1">Speak directly with an AI co-pilot for real-time brainstorming and content creation.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-hidden">
                {/* Transcript Panel (Left) */}
                <div className="md:col-span-7 flex flex-col bg-black/20 rounded-lg shadow-inner overflow-hidden">
                     <div className="p-4 border-b border-slate-800 flex-shrink-0">
                        <h2 className="font-semibold text-white">Conversation Transcript</h2>
                    </div>
                    <div ref={transcriptContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                        {transcript.map((item, index) => (
                            <div key={index} className={`flex items-start gap-3 ${item.speaker === 'user' ? 'justify-end' : ''}`}>
                                {item.speaker === 'agent' && 
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]/80 flex-shrink-0 p-px">
                                        <div className="w-full h-full bg-slate-800 rounded-[7px] flex items-center justify-center">
                                            <SynapseCoreIcon className="w-6 h-6"/>
                                        </div>
                                    </div>
                                }
                                <div className={`p-3 rounded-lg max-w-sm md:max-w-md animate-fade-in-up ${item.speaker === 'agent' ? 'bg-slate-700' : 'bg-blue-800'}`}>
                                    <p className={`text-sm ${item.isFinal ? 'text-white' : 'text-slate-300'}`}>{item.text}</p>
                                </div>
                                 {item.speaker === 'user' && <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center"><UserIcon className="w-5 h-5 text-slate-300"/></div>}
                            </div>
                        ))}
                         {transcript.length === 0 && (
                            <div className="flex items-center justify-center h-full text-center text-slate-500">
                                <p>Your conversation will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Panel (Right) */}
                <div className="md:col-span-5 flex flex-col bg-black/20 rounded-lg shadow-inner">
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <div className="relative w-40 h-40">
                             {/* Glow effect */}
                            <div 
                                className={`absolute -inset-2 rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] transition-all duration-1000`}
                                style={{ filter: 'blur(32px)', opacity: isConnected ? 0.4 : 0.15 }}
                            ></div>
                            
                            {/* Main framed visualizer */}
                            <div className="relative w-full h-full p-px rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]/40">
                                <div 
                                    className="w-full h-full rounded-[11px] flex items-center justify-center"
                                    style={{ background: 'radial-gradient(circle at 70% 30%, #293140, #161b22 80%)' }}
                                >
                                    <SynapseCoreIcon className={`w-24 h-24 opacity-90 transition-transform duration-1000 ${visualizerAnimationClass}`} />
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-300 mt-8 font-semibold text-lg">{statusText}</p>
                    </div>

                    <div className="p-6 flex-shrink-0 border-t border-slate-800/50">
                        <button 
                            onClick={handleConnect} 
                            disabled={status === 'connecting'} 
                            className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 shadow-lg ${connectButtonClass} ${!isConnected && 'shadow-fuchsia-500/20'}`}
                        >
                            {connectButtonText}
                        </button>
                        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveAgentView;
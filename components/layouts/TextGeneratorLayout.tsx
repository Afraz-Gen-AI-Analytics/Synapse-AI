import React from 'react';
import { Template, ContentType } from '../../types';
import GenerationOutput from '../GenerationOutput'; // New component for the output panel
import ProFeatureBadge from '../ProFeatureBadge';

import SparklesIcon from '../icons/SparklesIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import ResonanceIcon from '../icons/ResonanceIcon';

interface TextGeneratorLayoutProps {
    selectedTemplate: Template;
    topic: string;
    setTopic: (value: string) => void;
    tone: string;
    setTone: (value: string) => void;
    tones: string[];
    extraFields: { [key: string]: string };
    handleFieldChange: (name: string, value: string) => void;
    isLoading: boolean;
    handleGenerate: () => void;
    generatedContent: string;
    contentStats: { words: number, chars: number };
    handleCopy: (content: string, templateName: string) => void;
    onEditImage: (imageDataUrl: string) => void;
    numOutputs: number;
    setNumOutputs: (value: number) => void;
    generatedContents: string[];
    activeVariation: number;
    setActiveVariation: (value: number) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const TextGeneratorLayout: React.FC<TextGeneratorLayoutProps> = (props) => {
    const {
        selectedTemplate, topic, setTopic, tone, setTone, tones,
        extraFields, handleFieldChange, isLoading, handleGenerate,
        generatedContent, contentStats, handleCopy, onEditImage,
        numOutputs, setNumOutputs, generatedContents, activeVariation, setActiveVariation
    } = props;
    
    const isImageTool = selectedTemplate.id === ContentType.AIImage;
    const isBlogTool = selectedTemplate.id === ContentType.BlogIdea;
    const isResonanceTool = selectedTemplate.id === ContentType.ResonanceEngine;

    const showFineTune = !isImageTool || (selectedTemplate.fields && selectedTemplate.fields.length > 0);

    return (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-full">
            {/* Input Column */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 flex flex-col p-6">
                <div className="mb-6 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <h1 className={`text-2xl font-bold ${selectedTemplate.isPro ? 'gradient-text' : 'text-white'}`}>{selectedTemplate.name}</h1>
                    {selectedTemplate.isPro && <ProFeatureBadge />}
                  </div>
                  <p className="text-slate-400 mt-1">{selectedTemplate.description}</p>
                </div>
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 -mr-2">
                 <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-2">
                    { isImageTool ? '1. Describe the image you want to create' : 
                      isResonanceTool ? '1. Content to Analyze' :
                      selectedTemplate.name === 'Blog Post Ideas' ? 'Topic' : '1. Describe your product, service, or goal'
                    }
                  </label>
                  <textarea
                    id="topic"
                    rows={isImageTool ? 4 : isResonanceTool ? 8 : 6}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={selectedTemplate.placeholder}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] focus:border-[var(--gradient-end)] transition"
                  />
                </div>
                
                {showFineTune && (
                    <>
                        <hr className="border-slate-700/60" />
                        <div>
                            <h3 className="text-base font-semibold text-slate-200 mb-4">{isResonanceTool ? '2. Define Analysis Context' : '2. Fine-tune (Optional)'}</h3>
                            <div className="space-y-6">
                                {selectedTemplate.supportsVariations && (
                                    <div>
                                        <label htmlFor="numOutputs" className="block text-sm font-medium text-slate-300 mb-2">{isBlogTool ? 'Number of Ideas' : 'Number of Outputs'}</label>
                                        <div className="relative">
                                            <select id="numOutputs" value={numOutputs} onChange={e => setNumOutputs(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[var(--gradient-end)] focus:border-[var(--gradient-end)] transition appearance-none">
                                                <option value={1}>1</option>
                                                <option value={2}>2</option>
                                                <option value={3}>3</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                                <ChevronDownIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!isImageTool && !isResonanceTool && (
                                    <div>
                                        <label htmlFor="tone" className="block text-sm font-medium text-slate-300 mb-2">Tone of Voice</label>
                                        <div className="relative">
                                            <select id="tone" value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[var(--gradient-end)] focus:border-[var(--gradient-end)] transition appearance-none">
                                                {tones.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                                <ChevronDownIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {selectedTemplate.fields?.map(field => (
                                    <div key={field.name}>
                                        <label htmlFor={field.name} className="block text-sm font-medium text-slate-300 mb-2">{field.label}</label>
                                        {field.options ? (
                                            <div className="relative">
                                                <select id={field.name} value={extraFields[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[var(--gradient-end)] transition appearance-none">
                                                    {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                                    <ChevronDownIcon className="w-5 h-5" />
                                                </div>
                                            </div>
                                        ) : (
                                            <input
                                                id={field.name}
                                                type="text"
                                                value={extraFields[field.name] || ''}
                                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] transition"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                </div>
                <div className="mt-6 flex-shrink-0">
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20">
                    {isLoading ? <LoadingSpinner/> : (
                        <span className="flex items-center">
                            {isResonanceTool ? <ResonanceIcon className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                            {isResonanceTool ? 'Test Resonance' : 'Generate'}
                        </span>
                    )}
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
                onEditImage={onEditImage}
                // Pass props for shared component that are not used in this context.
                originalImageUrl={null}
                videoStatus=""
                videoUrl={null}
            />
        </div>
    );
};

export default TextGeneratorLayout;
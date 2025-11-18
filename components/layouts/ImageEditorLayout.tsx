import React from 'react';
import { Template } from '../../types';
import FileInput from '../FileInput';
import GenerationOutput from '../GenerationOutput';
import SpeechToTextInput from '../SpeechToTextInput';
import SparklesIcon from '../icons/SparklesIcon';

type UploadedFile = { data: string; mimeType: string; name: string; dataUrl: string };

interface ImageEditorLayoutProps {
    selectedTemplate: Template;
    topic: string;
    setTopic: (value: string) => void;
    isLoading: boolean;
    handleGenerate: () => void;
    generatedContent: string;
    handleCopy: (content: string, templateName: string) => void;
    uploadedImage: UploadedFile | null;
    handleFileSelect: (file: UploadedFile | null) => void;
    originalImageUrl: string | null;
    onEditImage: (imageDataUrl: string) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const ImageEditorLayout: React.FC<ImageEditorLayoutProps> = (props) => {
    const {
        selectedTemplate, topic, setTopic, isLoading, handleGenerate,
        generatedContent, handleCopy, uploadedImage, handleFileSelect, originalImageUrl,
        onEditImage
    } = props;

    return (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-full">
            {/* Input Column */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30 flex flex-col p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">{selectedTemplate.name}</h1>
                    <p className="text-slate-400 mt-1">{selectedTemplate.description}</p>
                </div>
                <div className="flex-1 flex flex-col gap-4 pr-2 -mr-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-300">1. Upload Image</label>
                        <FileInput 
                            onFileSelect={handleFileSelect}
                            acceptedTypes="image/png, image/jpeg, image/webp"
                            label="Upload an image to edit"
                            value={uploadedImage}
                        />
                    </div>
                    <div className="space-y-2 flex-grow flex flex-col">
                        <label htmlFor="topic" className="block text-sm font-semibold text-slate-300">2. Describe Your Edit</label>
                        <SpeechToTextInput
                            id="topic"
                            rows={4}
                            value={topic}
                            onTextChange={setTopic}
                            placeholder={selectedTemplate.placeholder}
                            className="w-full h-full flex-grow bg-slate-800/50 border border-slate-700 rounded-lg p-3 pr-14 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] focus:border-[var(--gradient-end)] transition"
                        />
                    </div>
                </div>
                <button 
                    onClick={handleGenerate} 
                    disabled={isLoading || !uploadedImage || !topic} 
                    className="w-full mt-6 flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20"
                >
                    {isLoading ? <LoadingSpinner/> : <span className="flex items-center"><SparklesIcon className="w-5 h-5 mr-2" /> Generate Edit</span>}
                </button>
            </div>

            {/* Output Column */}
            <GenerationOutput
                isLoading={isLoading}
                generatedContent={generatedContent}
                generatedContents={generatedContent ? [generatedContent] : []}
                activeVariation={0}
                setActiveVariation={() => {}}
                contentStats={{ words: 0, chars: 0 }}
                handleCopy={handleCopy}
                selectedTemplate={selectedTemplate}
                topic={topic}
                originalImageUrl={originalImageUrl}
                videoStatus=""
                videoUrl={null}
                onEditImage={onEditImage}
            />
        </div>
    );
};

export default ImageEditorLayout;
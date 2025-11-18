import React, { useState, useCallback, useEffect } from 'react';
import ImageIcon from './icons/ImageIcon';
import TrashIcon from './icons/TrashIcon';

type UploadedFile = { data: string; mimeType: string; name: string; dataUrl: string };

interface FileInputProps {
  onFileSelect: (file: UploadedFile | null) => void;
  acceptedTypes: string; // e.g., "image/png, image/jpeg"
  label: string;
  value: UploadedFile | null;
}

const FileInput: React.FC<FileInputProps> = ({ onFileSelect, acceptedTypes, label, value }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        setPreviewUrl(value?.dataUrl || null);
    }, [value]);

    const handleFile = useCallback((file: File | null) => {
        if (file && acceptedTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                setPreviewUrl(dataUrl);
                const base64Data = dataUrl.split(',')[1];
                onFileSelect({ data: base64Data, mimeType: file.type, name: file.name, dataUrl: dataUrl });
            };
            reader.readAsDataURL(file);
        }
    }, [onFileSelect, acceptedTypes]);

    const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
        // Reset file input to allow re-uploading the same file
        e.target.value = '';
    };
    
    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setPreviewUrl(null);
        onFileSelect(null);
    }
    
    return (
        <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative w-full border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-[var(--gradient-end)] bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}`}
        >
            <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2 sr-only">{label}</label>
            <input id="file-upload" type="file" className="absolute w-full h-full opacity-0 cursor-pointer" accept={acceptedTypes} onChange={onFileChange} />
            
            {previewUrl ? (
                <div className="relative group p-2">
                    <img src={previewUrl} alt="Preview" className="w-full h-40 object-contain rounded-md" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={clearFile} className="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg">
                            <TrashIcon className="w-4 h-4" /> Remove
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center cursor-pointer h-40">
                    <ImageIcon className="w-8 h-8 mb-3 text-slate-500"/>
                    <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-500">PNG, JPG, or WEBP</p>
                </div>
            )}
        </div>
    );
};

export default FileInput;
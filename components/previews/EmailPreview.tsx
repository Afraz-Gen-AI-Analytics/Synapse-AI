import React, { useState, useEffect } from 'react';
import { EmailContent } from '../../types';
import SendIcon from '../icons/SendIcon';

interface EmailPreviewProps {
    content: EmailContent;
    isReadOnly?: boolean;
    onChange?: (newContent: EmailContent) => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ content, isReadOnly = false, onChange }) => {
    const [subject, setSubject] = useState(content.subject);
    const [body, setBody] = useState(content.body);
    
    useEffect(() => {
        setSubject(content.subject);
        setBody(content.body);
    }, [content]);

    const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSubject(e.target.value);
        if (onChange) {
            onChange({ ...content, subject: e.target.value });
        }
    };

    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBody(e.target.value);
        if (onChange) {
            onChange({ ...content, body: e.target.value });
        }
    };

    return (
        <div className="bg-slate-800/40 rounded-lg border border-slate-700/80 w-full text-sm h-full flex flex-col">
            <div className="p-3 border-b border-slate-700/80 flex justify-between items-center flex-shrink-0">
                <h4 className="font-semibold text-white">New Message</h4>
                <SendIcon className="w-5 h-5 text-slate-400"/>
            </div>
            <div className="p-4 space-y-3 flex-shrink-0">
                 <div className="flex items-center border-b border-slate-700/80 pb-2">
                    <span className="text-slate-400 mr-2">To:</span>
                    <span className="text-slate-300">[Target Audience]</span>
                </div>
                 <div className="flex items-center">
                    <span className="text-slate-400 mr-2 shrink-0">Subject:</span>
                     {isReadOnly ? (
                        <p className="font-semibold text-white truncate">{subject}</p>
                     ) : (
                         <input 
                            type="text" 
                            value={subject} 
                            onChange={handleSubjectChange} 
                            className="w-full bg-transparent text-white font-semibold focus:outline-none p-1 -m-1"
                         />
                     )}
                </div>
            </div>
            <div className="p-4 border-t border-slate-700/80 flex-grow overflow-y-auto">
                {isReadOnly ? (
                    <p className="text-slate-300 whitespace-pre-wrap">{body}</p>
                ) : (
                    <textarea 
                        value={body} 
                        onChange={handleBodyChange} 
                        className="w-full h-full bg-transparent text-slate-300 focus:outline-none resize-none p-1 -m-1"
                    />
                )}
            </div>
        </div>
    );
};

export default EmailPreview;
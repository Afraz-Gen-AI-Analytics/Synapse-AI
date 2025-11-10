import React, { useState, useMemo } from 'react';
import Tooltip from './Tooltip';
import InfoIcon from './icons/InfoIcon';

type Platform = 'twitter' | 'linkedin' | 'facebook' | 'email';

interface ConnectionModalProps {
  platformName: Platform;
  onClose: () => void;
  onConnect: () => void;
}

interface FieldConfig {
    name: string;
    label: string;
    placeholder: string;
    type: 'text' | 'password';
    tooltip?: string;
}

const platformConfig: { [key in Platform]: { title: string; description: string; fields: FieldConfig[] } } = {
    twitter: {
        title: 'Connect to X (Twitter)',
        description: 'Provide your X developer app Client ID and Secret. This allows agents to post tweets on your behalf. For this demo, any non-empty value will work unless it contains the word "invalid".',
        fields: [
            { name: 'clientId', label: 'Client ID', placeholder: 'Enter your Client ID', type: 'password' },
            { name: 'clientSecret', label: 'Client Secret', placeholder: 'Enter your Client Secret', type: 'password' },
        ]
    },
    linkedin: {
        title: 'Connect to LinkedIn',
        description: 'Provide your LinkedIn developer app credentials to allow agents to publish updates. For this demo, any non-empty value will work unless it contains the word "invalid".',
        fields: [
            { name: 'clientId', label: 'Client ID', placeholder: 'Enter your Client ID', type: 'password' },
            { name: 'clientSecret', label: 'Client Secret', placeholder: 'Enter your Client Secret', type: 'password' },
        ]
    },
    facebook: {
        title: 'Connect to Facebook',
        description: 'Provide your Facebook Page Access Token to allow agents to manage your page. For this demo, any non-empty value will work unless it contains the word "invalid".',
        fields: [
            { name: 'pageAccessToken', label: 'Page Access Token', placeholder: 'Enter your Page Access Token', type: 'password', tooltip: 'This is a long-lived token specific to a Facebook Page, found in your developer settings.' },
        ]
    },
    email: {
        title: 'Connect Your Email',
        description: 'Provide an API key from a service like SendGrid, or an App Password for your Google/Outlook account, to allow agents to send emails. For this demo, any non-empty value will work unless it contains the word "invalid".',
        fields: [
            { name: 'emailApiKey', label: 'API Key or App Password', placeholder: 'Enter your key or password', type: 'password', tooltip: 'For Gmail/Outlook with 2FA, create a specific App Password in your account security settings.' },
        ]
    }
};

const ConnectionModal: React.FC<ConnectionModalProps> = ({ platformName, onClose, onConnect }) => {
    const [credentials, setCredentials] = useState<{ [key: string]: string }>({});
    const [isConnecting, setIsConnecting] = useState(false);
    const [validationError, setValidationError] = useState('');

    const config = useMemo(() => platformConfig[platformName], [platformName]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValidationError(''); // Clear error on new input
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleConnectClick = () => {
        setValidationError('');
        
        const isMissingFields = config.fields.some(field => !credentials[field.name]?.trim());
        if (isMissingFields) {
            setValidationError('Please fill in all required fields.');
            return;
        }

        setIsConnecting(true);
        // Simulate a network request for validation
        setTimeout(() => {
            // Realistic validation simulation: fail if any key contains "invalid"
            const isInvalid = Object.values(credentials).some(val => typeof val === 'string' && val.toLowerCase().includes('invalid'));

            if (isInvalid) {
                setValidationError('The provided credentials could not be validated. Please check them and try again.');
                setIsConnecting(false);
            } else {
                onConnect(); // Success
            }
        }, 1500);
    };

    return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl shadow-black/30 w-full max-w-md transform transition-all animate-pop-in"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-2">{config.title}</h2>
        <p className="text-slate-400 mb-6 text-sm">{config.description}</p>
        
        <div className="space-y-4">
            {config.fields.map(field => (
                 <div key={field.name}>
                    <label htmlFor={field.name} className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                        {field.label}
                        {field.tooltip && (
                             <Tooltip text={field.tooltip} position="top">
                                <InfoIcon className="w-4 h-4 ml-2 text-slate-500 cursor-help" />
                            </Tooltip>
                        )}
                    </label>
                    <input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        value={credentials[field.name] || ''}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)]"
                    />
                </div>
            ))}
        </div>
        
        {validationError && <p className="text-red-400 text-sm mt-4 text-center bg-red-900/20 p-3 rounded-md">{validationError}</p>}
        
        <div className="flex justify-end gap-4 mt-6">
            <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Cancel
            </button>
            <button 
                onClick={handleConnectClick} 
                disabled={isConnecting} 
                className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
            >
                {isConnecting ? 'Validating...' : 'Connect'}
            </button>
        </div>
      </div>
    </div>
    );
};

export default ConnectionModal;
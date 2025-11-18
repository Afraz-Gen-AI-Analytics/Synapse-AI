import React, { useState, useEffect } from 'react';
import { User, BrandProfile } from '../types';
import { getBrandProfile, updateBrandProfile, isBrandProfileComplete, updateUserDoc } from '../services/firebaseService';
import SettingsIcon from './icons/SettingsIcon';
import { useToast } from '../contexts/ToastContext';
import ThemeSwitcher from './ThemeSwitcher';
import Tooltip from './Tooltip';
import InfoIcon from './icons/InfoIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface SettingsViewProps {
    user: User;
    onUserUpdate: (user: User) => void;
    onSaveSuccess: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUserUpdate, onSaveSuccess }) => {
    const [profile, setProfile] = useState<BrandProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useToast();


    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userProfile = await getBrandProfile(user.uid);
                if (userProfile) {
                    if (!userProfile.socialMediaHandles) {
                        userProfile.socialMediaHandles = { twitter: '', linkedin: '', facebook: '' };
                    }
                    // Make connection status initialization more robust by explicitly checking for `true`.
                    const existingConnections = userProfile.socialConnections;
                    userProfile.socialConnections = {
                        twitter: existingConnections?.twitter === true,
                        linkedin: existingConnections?.linkedin === true,
                        facebook: existingConnections?.facebook === true,
                        email: existingConnections?.email === true,
                    };
                    setProfile(userProfile);
                } else {
                     setError("No brand profile found for this account.");
                }
            } catch (err) {
                console.error("Failed to load brand profile:", err);
                setError("Could not load your brand profile. Please try again later.");
            }
        };
        loadProfile();
    }, [user.uid]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!profile) return;
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };
    
    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!profile) return;
        setProfile({ ...profile, socialMediaHandles: { ...profile.socialMediaHandles, [e.target.name]: e.target.value } });
    };

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        setError('');
        try {
            const { id, userId, ...profileData } = profile;
            await updateBrandProfile(user.uid, profileData);
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            onSaveSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to save brand profile.");
            addToast("Failed to save profile.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (!profile) {
        return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gradient-end)]"></div></div>;
    }
    
    const toneOptions = ["Professional", "Encouraging", "Slightly witty", "Casual", "Bold"];

    return (
        <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/30">
                <div className="flex items-center mb-6">
                    <SettingsIcon className="w-8 h-8 mr-3 text-[var(--gradient-start)]" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Settings</h1>
                        <p className="text-slate-400 mt-1">Configure your account and Brand Voice. A complete profile dramatically improves AI output.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Brand Voice</h2>
                        <div>
                            <label htmlFor="brandName" className="block text-sm font-medium text-slate-300 mb-2">Brand Name</label>
                            <input id="brandName" name="brandName" type="text" value={profile.brandName} onChange={handleInputChange} placeholder="e.g., 'Momentum Labs'"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)]" />
                        </div>
                        <div>
                            <label htmlFor="productDescription" className="block text-sm font-medium text-slate-300 mb-2">Product/Service Description</label>
                            <textarea id="productDescription" name="productDescription" rows={4} value={profile.productDescription} onChange={handleInputChange} placeholder="e.g., 'A comprehensive productivity suite that unifies tasks, notes, and calendars into a single, focused workspace.'"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)]" />
                        </div>
                         <div>
                            <label htmlFor="targetAudience" className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                                Target Audience
                                <Tooltip text="Describe your ideal customer. E.g., 'Tech-savvy project managers in startups' or 'Eco-conscious millennials who love hiking'.">
                                    <InfoIcon className="w-4 h-4 ml-2 text-slate-500" />
                                </Tooltip>
                            </label>
                            <textarea id="targetAudience" name="targetAudience" rows={3} value={profile.targetAudience} onChange={handleInputChange} placeholder="e.g., 'Early-stage startup founders and product managers in the SaaS industry who are struggling with tool overload.'"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)]" />
                        </div>
                        <div>
                            <label htmlFor="messagingPillars" className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                                Core Messaging Pillars (1-3)
                                <Tooltip text="List the main value propositions or themes you want to emphasize in your marketing.">
                                    <InfoIcon className="w-4 h-4 ml-2 text-slate-500" />
                                </Tooltip>
                            </label>
                            <textarea id="messagingPillars" name="messagingPillars" rows={3} value={profile.messagingPillars} onChange={handleInputChange} placeholder="e.g., '1. Unify Your Workflow. 2. Reclaim Your Focus. 3. Achieve More, Faster.'"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)]" />
                        </div>
                        <div>
                            <label htmlFor="toneOfVoice" className="block text-sm font-medium text-slate-300 mb-2">Tone of Voice</label>
                            <div className="relative">
                                <select
                                    id="toneOfVoice"
                                    name="toneOfVoice"
                                    value={profile.toneOfVoice}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[var(--gradient-end)] appearance-none"
                                >
                                    {toneOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                    <ChevronDownIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Social Media Handles (without @)</label>
                            <div className="space-y-3">
                                <input name="twitter" value={profile.socialMediaHandles.twitter} onChange={handleSocialChange} placeholder="X (Twitter)" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)]" />
                                <input name="linkedin" value={profile.socialMediaHandles.linkedin} onChange={handleSocialChange} placeholder="LinkedIn (company page name)" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)]" />
                                <input name="facebook" value={profile.socialMediaHandles.facebook} onChange={handleSocialChange} placeholder="Facebook" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)]" />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Appearance</h2>
                            <div className="pt-4">
                                <ThemeSwitcher showLabel={true} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center pt-6 mt-6 border-t border-slate-800">
                    {error && <p className="text-red-400 text-sm mr-4">{error}</p>}
                    {saveSuccess && <p className="text-green-400 text-sm mr-4 animate-checkmark-pop">Settings saved!</p>}
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import HomeIcon from './icons/HomeIcon';
import SparklesIcon from './icons/SparklesIcon';
import AgentIcon from './icons/AgentIcon';
import HistoryIcon from './icons/HistoryIcon';
import MoreIcon from './icons/MoreIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';
import HeadsetIcon from './icons/HeadsetIcon';

type Tab = 'home' | 'tools' | 'live-agent' | 'agents' | 'history' | 'analytics' | 'settings';

interface BottomNavBarProps {
    user: User;
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    onToggleToolsDrawer: () => void;
    onLogout: () => void;
}

const NavButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center w-full h-full text-xs transition-colors duration-200 focus:outline-none">
        <div className={`transition-transform duration-200 ease-in-out ${isActive ? 'scale-110' : 'scale-100'}`}>
            {icon}
        </div>
        <span className={`mt-1 ${isActive ? 'font-bold text-white' : 'text-slate-400'}`}>{label}</span>
    </button>
);

const BottomNavBar: React.FC<BottomNavBarProps> = ({ user, activeTab, onTabChange, onToggleToolsDrawer, onLogout }) => {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const tabs: {id: Tab; label: string; icon: React.FC<{className?: string}>; onClick: () => void}[] = [
        { id: 'home', label: 'Home', icon: HomeIcon, onClick: () => onTabChange('home') },
        { id: 'agents', label: 'Agents', icon: AgentIcon, onClick: () => onTabChange('agents') },
        { id: 'live-agent', label: 'Live', icon: HeadsetIcon, onClick: () => onTabChange('live-agent') },
        { id: 'history', label: 'History', icon: HistoryIcon, onClick: () => onTabChange('history') },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMoreMenuAction = (tab: Tab) => {
        onTabChange(tab);
        setIsMoreMenuOpen(false);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800/50 shadow-t-2xl md:hidden z-30">
            <div className="grid grid-cols-5 h-full">
                {tabs.map(tab => (
                    <NavButton
                        key={tab.id}
                        label={tab.label}
                        icon={<tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />}
                        isActive={activeTab === tab.id}
                        onClick={tab.onClick}
                    />
                ))}
                <div ref={menuRef} className="relative">
                    <NavButton
                        label="More"
                        icon={<MoreIcon className={`w-6 h-6 ${isMoreMenuOpen ? 'text-white' : 'text-slate-400'}`} />}
                        isActive={isMoreMenuOpen}
                        onClick={() => setIsMoreMenuOpen(prev => !prev)}
                    />
                    {isMoreMenuOpen && (
                        <div className="absolute bottom-full right-2 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-2 z-20 animate-pop-in">
                            <button onClick={onToggleToolsDrawer} className="w-full flex items-center text-left px-2 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-md">
                                <SparklesIcon className="w-4 h-4 mr-3" /> All Tools
                            </button>
                            <button onClick={() => handleMoreMenuAction('analytics')} className="w-full flex items-center text-left px-2 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-md">
                                <AnalyticsIcon className="w-4 h-4 mr-3" /> Analytics
                            </button>
                            <button onClick={() => handleMoreMenuAction('settings')} className="w-full flex items-center text-left px-2 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-md">
                                <SettingsIcon className="w-4 h-4 mr-3" /> Settings
                            </button>
                            <div className="border-t border-slate-700 my-1"></div>
                            <button onClick={onLogout} className="w-full flex items-center text-left px-2 py-2 text-sm text-red-400 hover:bg-slate-700/50 rounded-md">
                                <LogoutIcon className="w-4 h-4 mr-3" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BottomNavBar;
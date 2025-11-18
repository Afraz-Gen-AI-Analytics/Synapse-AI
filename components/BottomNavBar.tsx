import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import HomeIcon from './icons/HomeIcon';
import AgentIcon from './icons/AgentIcon';
import HistoryIcon from './icons/HistoryIcon';
import MoreIcon from './icons/MoreIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';
import HeadsetIcon from './icons/HeadsetIcon';
import CreateIcon from './icons/CreateIcon';

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
    const moreMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
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

    const handleLogoutClick = () => {
        onLogout();
        setIsMoreMenuOpen(false);
    };

    const handleTabClick = (action: () => void) => {
        setIsMoreMenuOpen(false); // Close more menu if another tab is clicked
        action();
    };
    
    const tabs = [
        { id: 'home', label: 'Home', icon: HomeIcon, action: () => onTabChange('home') },
        { id: 'agents', label: 'Agents', icon: AgentIcon, action: () => onTabChange('agents') },
        { id: 'create', label: 'Create', icon: CreateIcon, action: onToggleToolsDrawer },
        { id: 'history', label: 'History', icon: HistoryIcon, action: () => onTabChange('history') },
        { id: 'more', label: 'More', icon: MoreIcon, action: () => setIsMoreMenuOpen(prev => !prev) },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800/50 shadow-t-2xl md:hidden z-30">
            <div className="h-full flex items-center justify-around">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id || (tab.id === 'more' && isMoreMenuOpen) || (activeTab === 'tools' && tab.id === 'create');
                    const action = (tab.id === 'more') ? tab.action : () => handleTabClick(tab.action);

                    if (tab.id === 'create') {
                         return (
                            <div key={tab.id} className="flex-1 h-full">
                                <button
                                    onClick={action}
                                    className="flex flex-col items-center justify-center w-full h-full text-xs transition-colors duration-200 focus:outline-none"
                                    aria-label="Create new content"
                                >
                                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-lg shadow-[color:var(--gradient-start)]/30 transition-transform duration-200 hover:scale-105 active:scale-95">
                                        <CreateIcon className="w-6 h-6 text-white" />
                                    </div>
                                </button>
                            </div>
                         );
                    }

                    if (tab.id === 'more') {
                        return (
                             <div key={tab.id} className="relative flex-1 h-full" ref={moreMenuRef}>
                                <NavButton
                                    label={tab.label}
                                    icon={<tab.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
                                    isActive={isActive}
                                    onClick={action}
                                />
                                {isMoreMenuOpen && (
                                     <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-2 z-20 animate-pop-in">
                                        <button onClick={() => handleMoreMenuAction('analytics')} className="w-full flex items-center text-left px-2 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-md">
                                            <AnalyticsIcon className="w-4 h-4 mr-3" /> Analytics
                                        </button>
                                        <button onClick={() => handleMoreMenuAction('live-agent')} className="w-full flex items-center text-left px-2 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-md">
                                            <HeadsetIcon className="w-4 h-4 mr-3" /> Live Agent
                                        </button>
                                        <button onClick={() => handleMoreMenuAction('settings')} className="w-full flex items-center text-left px-2 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-md">
                                            <SettingsIcon className="w-4 h-4 mr-3" /> Settings
                                        </button>
                                        <div className="border-t border-slate-700 my-1"></div>
                                        <button onClick={handleLogoutClick} className="w-full flex items-center text-left px-2 py-2 text-sm text-red-400 hover:bg-slate-700/50 rounded-md">
                                            <LogoutIcon className="w-4 h-4 mr-3" /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    return (
                        <div key={tab.id} className="flex-1 h-full">
                            <NavButton
                                label={tab.label}
                                icon={<tab.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
                                isActive={isActive}
                                onClick={action}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavBar;
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';

interface UserProfileProps {
    user: User;
    onLogout: () => void;
    onSettingsClick: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onSettingsClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const getInitials = (email: string) => {
        if (!email) {
            return '??';
        }
        return email.substring(0, 2).toUpperCase();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white hover:opacity-90 transition-opacity overflow-hidden"
            >
                {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                    getInitials(user.email)
                )}
            </button>

            {isOpen && (
                <div className="absolute bottom-2 left-full ml-2 w-60 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-10">
                    <div className="p-2 border-b border-slate-700">
                        <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                        <p className="text-xs text-slate-400 capitalize">{user.plan} Plan</p>
                    </div>
                    <div className="p-2">
                        <button
                            onClick={() => {
                                onSettingsClick();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center text-left px-2 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-md"
                        >
                            <SettingsIcon className="w-4 h-4 mr-3" />
                            Settings & Brand
                        </button>
                    </div>
                    <div className="border-t border-slate-700 p-2">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center text-left px-2 py-2 text-sm text-red-400 hover:bg-slate-700/50 rounded-md"
                        >
                            <LogoutIcon className="w-4 h-4 mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
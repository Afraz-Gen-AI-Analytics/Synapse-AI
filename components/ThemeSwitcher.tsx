import React from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

interface ThemeSwitcherProps {
  showLabel?: boolean;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ showLabel = false }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div>
        {showLabel && <p className="text-xs text-slate-400 px-3 pb-2">Theme</p>}
        <div className={`flex gap-3 ${showLabel ? 'px-3' : ''}`}>
            {themes.map((t) => (
                <button
                    key={t.name}
                    onClick={() => setTheme(t)}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none ${theme.name === t.name ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white' : ''}`}
                    style={{
                        backgroundImage: `linear-gradient(to right, ${t.colors['--gradient-start']}, ${t.colors['--gradient-end']})`,
                    }}
                    aria-label={`Switch to ${t.name} theme`}
                />
            ))}
        </div>
    </div>
  );
};

export default ThemeSwitcher;
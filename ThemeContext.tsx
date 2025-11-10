import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { AuthContext } from '../App';
import { updateUserDoc } from '../services/firebaseService';

interface Theme {
  name: string;
  colors: {
    '--gradient-start': string;
    '--gradient-end': string;
  };
}

export const themes: Theme[] = [
  { name: 'Twilight', colors: { '--gradient-start': '#E025F0', '--gradient-end': '#4190F2' } },
  { name: 'Sunrise', colors: { '--gradient-start': '#FF8C00', '--gradient-end': '#FFD700' } },
  { name: 'Oceanic', colors: { '--gradient-start': '#13B1B7', '--gradient-end': '#05E5B9' } },
  { name: 'Crimson', colors: { '--gradient-start': '#DC143C', '--gradient-end': '#FF4500' } },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user, setUser } = useContext(AuthContext);

  const theme = useMemo(() => {
    const userThemeName = user?.theme;
    const foundTheme = themes.find(t => t.name === userThemeName);
    return foundTheme || themes[0]; // Default to Twilight if not found or no user
  }, [user]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    if (user && setUser) {
      const oldThemeName = user.theme;
      // Optimistic UI update
      setUser(prevUser => prevUser ? { ...prevUser, theme: newTheme.name } : null);
      
      try {
        await updateUserDoc(user.uid, { theme: newTheme.name });
      } catch (error) {
        console.error("Failed to save theme to database:", error);
        // Revert on failure
        setUser(prevUser => prevUser ? { ...prevUser, theme: oldThemeName } : null);
        // Optionally, show a toast to the user
      }
    }
  }, [user, setUser]);
  
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
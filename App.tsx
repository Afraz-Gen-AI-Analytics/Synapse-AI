import React, { useState, useCallback, useEffect, createContext } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import { onAuthStateChanged, signOutUser } from './services/firebaseService';
import { User } from './types';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';

type View = 'landing' | 'login' | 'signup' | 'dashboard' | 'terms' | 'privacy';

// Create a context to provide user state throughout the app
export const AuthContext = createContext<{ user: User | null; setUser: React.Dispatch<React.SetStateAction<User | null>> }>({ user: null, setUser: () => {} });


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('landing');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((currentUser) => {
        setIsLoadingUser(true);
        if (currentUser) {
            setUser(currentUser);
            setView('dashboard');
        } else {
            setUser(null);
            // Only switch to landing if not on a persistent page like login, signup or legal pages
            setView(currentView => (['login', 'signup', 'terms', 'privacy'].includes(currentView) ? currentView : 'landing'));
        }
        setIsLoadingUser(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  const handleNavigation = (targetView: View) => {
    setView(targetView);
    window.scrollTo(0, 0);
  };
  
  const handleAuthSuccess = (authedUser: User) => {
    // Directly set user and view to avoid race condition on signup.
    // The onAuthStateChanged listener will also fire and update state, which is fine.
    setUser(authedUser);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await signOutUser();
    // The onAuthStateChanged listener will handle the rest, but for immediate feedback:
    setUser(null);
    setView('landing');
  };

  const renderView = () => {
    if (isLoadingUser) {
      return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--gradient-end)]"></div>
        </div>
      );
    }
    switch(view) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigation} />;
      case 'login':
        return <Login onLoginSuccess={handleAuthSuccess} onNavigate={handleNavigation} />;
      case 'signup':
        return <Signup onSignupSuccess={handleAuthSuccess} onNavigate={handleNavigation} />;
      case 'terms':
        return <TermsAndConditions onNavigate={handleNavigation} />;
      case 'privacy':
        return <PrivacyPolicy onNavigate={handleNavigation} />;
      case 'dashboard':
        return user ? <Dashboard onLogout={handleLogout} /> : <Login onLoginSuccess={handleAuthSuccess} onNavigate={handleNavigation} />;
      default:
        return <LandingPage onNavigate={handleNavigation} />;
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <ThemeProvider>
        <ToastProvider>
          <div className="bg-[#0D1117] text-white min-h-screen">
            {renderView()}
          </div>
        </ToastProvider>
      </ThemeProvider>
    </AuthContext.Provider>
  );
};

export default App;

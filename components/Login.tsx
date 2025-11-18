
import React, { useState } from 'react';
import SynapseLogo from './icons/SynapseLogo';
import { signInWithEmail, signInWithGoogle } from '../services/firebaseService';
import { User } from '../types';
import GoogleIcon from './icons/GoogleIcon';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (view: 'signup' | 'landing' | 'terms' | 'privacy') => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      // Provide more specific error messages to help diagnose issues.
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled for this project. Please contact the administrator.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (err.message?.includes('User document not found')) {
        setError('Sign-in failed: Could not find a user profile associated with this account.');
      }
      else {
        setError(err.message || 'An unexpected error occurred during sign-in.');
      }
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
        const user = await signInWithGoogle();
        onLoginSuccess(user);
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during Google sign-in.');
    } finally {
        setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <SynapseLogo className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
            <p className="text-slate-400">Sign in to continue your journey with Synapse.</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl shadow-black/30">
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex justify-center items-center gap-3 bg-white hover:bg-gray-200 text-slate-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed border border-slate-300"
            >
                {isGoogleLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-800"></div>
                ) : (
                    <>
                        <GoogleIcon className="w-5 h-5" />
                        Continue with Google
                    </>
                )}
            </button>
            
            <div className="flex items-center my-6">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-sm">OR</span>
                <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] focus:border-[var(--gradient-end)] transition"
                    />
                </div>
                <div>
                    <label htmlFor="password"className="block text-sm font-medium text-slate-300 mb-2">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] focus:border-[var(--gradient-end)] transition"
                    />
                </div>
                
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading || isGoogleLoading}
                        className="w-full flex justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In with Email'}
                    </button>
                </div>
            </form>
             <p className="text-center text-slate-500 text-xs mt-6">
                By signing in, you agree to our{' '}
                <button onClick={() => onNavigate('terms')} className="font-semibold text-slate-400 hover:text-white underline">
                    Terms of Service
                </button>
                 {' '}and{' '}
                <button onClick={() => onNavigate('privacy')} className="font-semibold text-slate-400 hover:text-white underline">
                    Privacy Policy
                </button>.
            </p>
        </div>
        <p className="text-center text-slate-400 mt-6">
            Don't have an account?{' '}
            <button onClick={() => onNavigate('signup')} className="font-semibold gradient-text hover:opacity-80">
                Sign up
            </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
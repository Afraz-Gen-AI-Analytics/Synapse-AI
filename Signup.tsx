import React, { useState } from 'react';
import SynapseLogo from './icons/SynapseLogo';
import { signUpWithEmail } from '../services/firebaseService';
import { User } from '../types';

interface SignupProps {
  onSignupSuccess: (user: User) => void;
  onNavigate: (view: 'login' | 'landing') => void;
}

const Signup: React.FC<SignupProps> = ({ onSignupSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic password validation
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    
    setIsLoading(true);
    try {
      const newUser = await signUpWithEmail(email, password);
      onSignupSuccess(newUser);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This account is already in use');
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1117] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <SynapseLogo className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
            <p className="text-slate-400">Join Synapse and start building your empire.</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl shadow-black/30">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-[var(--gradient-end)] focus:border-[var(--gradient-end)] transition"
                    />
                </div>
                
                {error && <p className="text-red-400 text-sm">{error}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20"
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </div>
            </form>
        </div>
        <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="font-semibold gradient-text hover:opacity-80">
                Sign In
            </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
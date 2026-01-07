
import React, { useState } from 'react';
import { Button } from './Button';
import { UserRole } from '../types';
import { X, Lock, Mail, LogIn } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: UserRole, email?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { signIn, isConfigured, error: authError, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Show auth context errors (e.g., profile not found)
  const displayError = error || authError;

  // Auto-close modal when user is successfully authenticated with profile
  React.useEffect(() => {
    if (user && !authLoading && isOpen) {
      console.log('User authenticated with profile, closing modal');
      onClose();
    }
  }, [user, authLoading, isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!isConfigured) {
      setError('Supabase not configured. Please set up environment variables.');
      setIsLoading(false);
      return;
    }

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message || 'Invalid email or password.');
      }
      // Don't close modal here - useEffect will close it when user is set
      // This allows error messages from profile fetch to be displayed
    } catch (err) {
      setError('An error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-60 backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full sm:max-w-sm relative animate-in zoom-in-95 duration-200">

           <div className="absolute top-4 right-4 z-20">
              <button onClick={onClose} className="bg-white/80 backdrop-blur rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white focus:outline-none transition-colors shadow-sm border border-gray-100">
                <X className="h-4 w-4" />
              </button>
           </div>

           <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 theme-bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <LogIn className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Welcome Back</h3>
                <p className="text-xs text-gray-500 mt-1">Sign in to continue to your dashboard</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="focus:ring-2 theme-ring-primary focus:border-transparent block w-full pl-10 pr-4 text-sm border-gray-200 rounded-xl py-3 border outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="focus:ring-2 theme-ring-primary focus:border-transparent block w-full pl-10 pr-4 text-sm border-gray-200 rounded-xl py-3 border outline-none transition-all"
                    />
                  </div>
                </div>

                {displayError && (
                  <div className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{displayError}</span>
                  </div>
                )}

                <Button type="submit" isLoading={isLoading} className="w-full py-3 rounded-xl shadow-lg text-sm font-bold">
                  Sign In
                </Button>
              </form>

              <p className="text-[10px] text-gray-400 text-center mt-4">
                Students, Parents & Teachers - use your registered email
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

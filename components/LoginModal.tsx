
import React, { useState } from 'react';
import { Button } from './Button';
import { UserRole } from '../types';
import { GraduationCap, Users, X, Lock, Mail, BookOpen } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'student' | 'parent' | 'teacher'>('student');
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

  const handleTabChange = (tab: 'student' | 'parent' | 'teacher') => {
    setActiveTab(tab);
    setError('');
    setEmail('');
    setPassword('');
  };

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

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full sm:max-w-md relative animate-in zoom-in-95 duration-200">

           <div className="absolute top-4 right-4 z-20">
              <button onClick={onClose} className="bg-white/80 backdrop-blur rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-white focus:outline-none transition-colors shadow-sm border border-gray-100">
                <X className="h-4 w-4" />
              </button>
           </div>

           <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-7 h-7 theme-bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">E</div>
                 <span className="text-lg font-bold text-gray-800 tracking-tight">ELC<span className="theme-text-accent">{t.app_name}</span></span>
              </div>

              <h3 className="text-xl font-extrabold text-gray-900 mb-4">Sign in</h3>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={() => handleTabChange('student')} className={`flex items-center justify-center gap-1.5 px-2 py-2 border rounded-xl text-xs font-bold transition-all ${activeTab === 'student' ? 'theme-border-primary bg-blue-50 theme-text-primary ring-1 theme-ring-primary' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                  <GraduationCap className="w-3.5 h-3.5" /> Student
                </button>
                <button onClick={() => handleTabChange('parent')} className={`flex items-center justify-center gap-1.5 px-2 py-2 border rounded-xl text-xs font-bold transition-all ${activeTab === 'parent' ? 'theme-border-primary bg-blue-50 theme-text-primary ring-1 theme-ring-primary' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                  <Users className="w-3.5 h-3.5" /> Parent
                </button>
                <button onClick={() => handleTabChange('teacher')} className={`flex items-center justify-center gap-1.5 px-2 py-2 border rounded-xl text-xs font-bold transition-all ${activeTab === 'teacher' ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                  <BookOpen className="w-3.5 h-3.5" /> Teacher
                </button>
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="focus:ring-1 theme-ring-primary focus:border-transparent block w-full pl-9 text-xs border-gray-200 rounded-xl py-2.5 border outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="focus:ring-1 theme-ring-primary focus:border-transparent block w-full pl-9 text-xs border-gray-200 rounded-xl py-2.5 border outline-none" />
                  </div>
                </div>

                {displayError && <div className="text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{displayError}</div>}

                <Button type="submit" isLoading={isLoading} className="w-full py-3 rounded-xl shadow-lg mt-2 text-xs">Sign In Now</Button>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};

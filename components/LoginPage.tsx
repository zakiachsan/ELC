
import React, { useState } from 'react';
import { Button } from './Button';
import { UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { GraduationCap, Users, ArrowLeft, Lock, Mail, AlertCircle, BookOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onLogin: (role: UserRole, email?: string) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const { t } = useLanguage();
  const { signIn, isConfigured } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'parent' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill for demo purposes
  const handleTabChange = (tab: 'student' | 'parent' | 'teacher') => {
    setActiveTab(tab);
    setError('');
    if (tab === 'student') {
      setEmail('sarah@student.com');
      setPassword('password123');
    } else if (tab === 'parent') {
      setEmail('kyle@parent.com');
      setPassword('password123');
    } else {
      // Teacher - clear for real authentication
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Teacher login uses real Supabase authentication
    if (activeTab === 'teacher') {
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
        // On success, AuthContext will handle navigation automatically
      } catch (err) {
        setError('An error occurred during sign in.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Student/Parent mock login
    setTimeout(() => {
      const roleToFind = activeTab === 'student' ? UserRole.STUDENT : UserRole.PARENT;
      const user = MOCK_USERS.find(u => u.email === email && u.role === roleToFind);

      if (user) {
        onLogin(roleToFind, email);
      } else {
        setError('Invalid email or password. Please try again.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-bold px-4 py-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200"
        >
          Back to Home
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-6">
           <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
             E
           </div>
           <span className="text-2xl font-bold text-gray-800 tracking-tight">ELC<span className="text-orange-500">{t.app_name}</span></span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button
              onClick={() => handleTabChange('student')}
              className={`flex items-center justify-center gap-2 px-3 py-3 border rounded-lg text-sm font-medium transition-all ${
                activeTab === 'student'
                  ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <GraduationCap className={`w-5 h-5 ${activeTab === 'student' ? 'text-teal-600' : 'text-gray-400'}`} />
              Student
            </button>
            <button
              onClick={() => handleTabChange('parent')}
              className={`flex items-center justify-center gap-2 px-3 py-3 border rounded-lg text-sm font-medium transition-all ${
                activeTab === 'parent'
                  ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'parent' ? 'text-teal-600' : 'text-gray-400'}`} />
              Parent
            </button>
            <button
              onClick={() => handleTabChange('teacher')}
              className={`flex items-center justify-center gap-2 px-3 py-3 border rounded-lg text-sm font-medium transition-all ${
                activeTab === 'teacher'
                  ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <BookOpen className={`w-5 h-5 ${activeTab === 'teacher' ? 'text-teal-600' : 'text-gray-400'}`} />
              Teacher
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder={activeTab === 'student' ? 'student@example.com' : 'parent@example.com'}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Sign in as {activeTab === 'student' ? 'Student' : activeTab === 'parent' ? 'Parent' : 'Teacher'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

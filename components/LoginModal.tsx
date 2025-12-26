
import React, { useState } from 'react';
import { Button } from './Button';
import { UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { GraduationCap, Users, X, Lock, Mail, AlertCircle, Video } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: UserRole, email?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const { t } = useLanguage();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTabChange = (tab: 'student' | 'parent') => {
    setActiveTab(tab);
    setError('');
    if (tab === 'student') {
      setEmail('sarah@student.com');
      setPassword('password123');
    } else {
      setEmail('kyle@parent.com');
      setPassword('password123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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

  const isPortrait = settings.videoOrientation === 'portrait';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-60 backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className={`inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full relative animate-in zoom-in-95 duration-200 ${isPortrait ? 'sm:max-w-2xl' : 'sm:max-w-xl'}`}>
           
           <div className="absolute top-4 right-4 z-20">
              <button onClick={onClose} className="bg-white/80 backdrop-blur rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-white focus:outline-none transition-colors shadow-sm border border-gray-100">
                <X className="h-4 w-4" />
              </button>
           </div>

           <div className="flex flex-col md:flex-row">
              {/* Video Section */}
              <div className={`bg-gray-900 flex flex-col justify-center p-6 space-y-3 ${isPortrait ? 'md:w-2/5' : 'md:w-1/2'}`}>
                 <div className="flex items-center gap-2 text-white/90 mb-1">
                    <Video className="w-3.5 h-3.5 theme-text-accent" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{settings.videoTitle}</span>
                 </div>
                 <div className={`relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`}>
                    <iframe className="w-full h-full" src={settings.videoUrl} title="Welcome" allowFullScreen></iframe>
                 </div>
                 <p className="text-gray-400 text-[9px] leading-relaxed italic line-clamp-2">
                    {settings.videoDescription}
                 </p>
              </div>

              {/* Login Form Section */}
              <div className={`p-6 flex items-center ${isPortrait ? 'md:w-3/5' : 'md:w-1/2'}`}>
                 <div className="w-full">
                    <div className="flex items-center gap-2 mb-6">
                       <div className="w-7 h-7 theme-bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">E</div>
                       <span className="text-lg font-bold text-gray-800 tracking-tight">ELC<span className="theme-text-accent">{t.app_name}</span></span>
                    </div>

                    <h3 className="text-xl font-extrabold text-gray-900 mb-4">Sign in</h3>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button onClick={() => handleTabChange('student')} className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all ${activeTab === 'student' ? 'theme-border-primary bg-blue-50 theme-text-primary ring-1 theme-ring-primary' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                        <GraduationCap className="w-3.5 h-3.5" /> Student
                      </button>
                      <button onClick={() => handleTabChange('parent')} className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all ${activeTab === 'parent' ? 'theme-border-primary bg-blue-50 theme-text-primary ring-1 theme-ring-primary' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                        <Users className="w-3.5 h-3.5" /> Parent
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

                      {error && <div className="text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{error}</div>}

                      <Button type="submit" isLoading={isLoading} className="w-full py-3 rounded-xl shadow-lg mt-2 text-xs">Sign In Now</Button>
                    </form>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

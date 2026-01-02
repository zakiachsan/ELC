import React, { useEffect, useRef } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from './types';
import { LanguageProvider } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppRoutes } from './routes';

const MainAppContent: React.FC = () => {
  const { user: authUser, loading: authLoading, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasNavigated = useRef(false);

  // Navigate to dashboard when user logs in
  useEffect(() => {
    if (authUser && !authLoading && !hasNavigated.current) {
      // Only auto-navigate if on homepage or login pages
      const isOnPublicPage = location.pathname === '/' ||
                             location.pathname === '/admin-login' ||
                             location.pathname.startsWith('/cefr') ||
                             location.pathname.startsWith('/news') ||
                             location.pathname === '/live-quiz' ||
                             location.pathname === '/olympiad' ||
                             location.pathname === '/hall-of-fame';

      if (isOnPublicPage) {
        hasNavigated.current = true;
        navigate(`/${authUser.role.toLowerCase()}`);
      }
    }

    // Reset flag when user logs out
    if (!authUser && !authLoading) {
      hasNavigated.current = false;
    }
  }, [authUser, authLoading, navigate, location.pathname]);

  const handleLogin = () => {
    // This is now just a callback for when modal closes
    // Navigation is handled by useEffect above
  };

  const handleLogout = async () => {
    if (isConfigured) {
      await signOut();
    }
    navigate('/');
  };

  // Show loading state while checking auth
  if (authLoading && isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fcfc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // User must be logged in to access protected routes
  const isAuthenticated = !!authUser;

  return (
    <AppRoutes
      isAuthenticated={isAuthenticated}
      currentUser={authUser || { id: '', name: 'Guest', email: '', role: UserRole.STUDENT, status: 'INACTIVE', needsAttention: false, assignedSubjects: [], skillLevels: {}, learningHubSubscription: { isActive: false } }}
      onLogin={handleLogin}
      onLogout={handleLogout}
    />
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <LanguageProvider>
            <MainAppContent />
          </LanguageProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

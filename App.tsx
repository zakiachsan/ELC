
import React, { useState, useEffect } from 'react';
import { UserRole, User } from './types';
import { MOCK_USERS } from './constants';
import { AccountManager } from './components/admin/FamilyCreator';
import { ScheduleManager } from './components/admin/ScheduleManager';
import { StudentList } from './components/admin/StudentList';
import { LocationManager } from './components/admin/LocationManager';
import { SiteSettings } from './components/admin/SiteSettings';
import { OlympiadManager } from './components/admin/OlympiadManager';
import { TransactionManager } from './components/admin/TransactionManager';
import { PlacementTestManager } from './components/admin/PlacementTestManager';
import { NewsManager } from './components/admin/NewsManager';
import { StudentOfMonthManager } from './components/admin/StudentOfMonthManager';
import { TeacherApplicationManager } from './components/admin/TeacherApplicationManager';
import { BillingManager } from './components/admin/BillingManager';
import { KahootManager } from './components/admin/KahootManager';

// Student Components
import { StudentView } from './components/student/StudentView';
import { StudentSchedule } from './components/student/StudentSchedule';
import { StudentOnlineLearning } from './components/student/StudentOnlineLearning';
import { StudentProgress } from './components/student/StudentProgress';
import { StudentOlympiad } from './components/student/StudentOlympiad';

// Parent Components
import { ParentOverview, ParentSchedule, ParentActivityLog } from './components/parent/ParentDashboard';

// Shared / Auth
import { SessionManager } from './components/teacher/SessionManager';
import { OnlineMaterialsManager } from './components/teacher/OnlineMaterialsManager';
import { TeacherView } from './components/teacher/TeacherView';
import { StudentGrades } from './components/teacher/StudentGrades';
import { Homepage } from './components/Homepage';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';

import {
  Users, GraduationCap, LayoutDashboard,
  CalendarDays, BookOpen, List, Home, TrendingUp, MapPin, Globe, Activity, Palette, Trophy, Sparkles, CreditCard, Search, Menu, X, Newspaper, Award, Briefcase, DollarSign, Gamepad2, BarChart3, MessageSquare
} from 'lucide-react';

// Shared Components
import { FeedbackForm } from './components/shared/FeedbackForm';

const MainAppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [appState, setAppState] = useState<'landing' | 'app'>('landing');
  const [currentView, setCurrentView] = useState<string>('default');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    setCurrentView('default');
  }, [currentUser]);

  const handleRoleSwitch = (role: UserRole) => {
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      setAppState('app');
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogin = (role: UserRole, email?: string) => {
    const user = MOCK_USERS.find(u => u.role === role && (email ? u.email === email : true));
    if (user) {
      setCurrentUser(user);
      setAppState('app');
    } else {
      alert("User not found in mock data");
    }
  };

  const handleLogout = () => {
    setAppState('landing');
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    if (currentUser.role === UserRole.ADMIN) {
      switch (currentView) {
        case 'accounts': return <AccountManager />;
        case 'schedule': return <ScheduleManager />;
        case 'locations': return <LocationManager />;
        case 'students': return <StudentList />;
        case 'billing': return <BillingManager />;
        case 'settings': return <SiteSettings />;
        case 'olympiad': return <OlympiadManager />;
        case 'transactions': return <TransactionManager />;
        case 'placement': return <PlacementTestManager />;
        case 'news': return <NewsManager />;
        case 'som': return <StudentOfMonthManager />;
        case 'teacher-apps': return <TeacherApplicationManager />;
        case 'kahoot': return <KahootManager />;
        default: return <AccountManager />;
      }
    }
    
    if (currentUser.role === UserRole.TEACHER) {
      switch (currentView) {
        case 'dashboard': return <TeacherView onNavigate={setCurrentView} />;
        case 'schedule': return <SessionManager />;
        case 'grades': return <StudentGrades />;
        case 'materials': return <OnlineMaterialsManager />;
        default: return <TeacherView onNavigate={setCurrentView} />;
      }
    }

    if (currentUser.role === UserRole.PARENT) {
      const linkedStudent = MOCK_USERS.find(u => u.id === currentUser.linkedStudentId);
      if (!linkedStudent) return <div>No student linked</div>;
      switch (currentView) {
        case 'dashboard': return <ParentOverview student={linkedStudent} />;
        case 'schedule': return <ParentSchedule student={linkedStudent} />;
        case 'history': return <ParentActivityLog student={linkedStudent} />;
        case 'feedback': return <FeedbackForm user={currentUser} />;
        default: return <ParentOverview student={linkedStudent} />;
      }
    }

    if (currentUser.role === UserRole.STUDENT) {
      switch (currentView) {
        case 'dashboard': return <StudentView student={currentUser} />;
        case 'schedule': return <StudentSchedule />;
        case 'progress': return <StudentProgress student={currentUser} />;
        case 'learning': return <StudentOnlineLearning student={currentUser} />;
        case 'feedback': return <FeedbackForm user={currentUser} />;
        default: return <StudentView student={currentUser} />;
      }
    }
    
    return <div>Unknown Role</div>;
  };

  const SidebarItem: React.FC<{
    id: string,
    label: string,
    icon: React.ElementType,
    active: boolean,
    highlight?: boolean
  }> = ({ id, label, icon: Icon, active, highlight }) => (
    <button
      onClick={() => {
        setCurrentView(id);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'theme-bg-primary-light theme-text-primary shadow-sm border theme-border-primary'
          : highlight ? 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 hover:from-yellow-100 hover:to-orange-100 border border-yellow-200' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'theme-text-primary' : highlight ? 'text-orange-600' : 'text-gray-400'}`} />
      <span className={active ? 'font-bold' : ''}>{label}</span>
      {highlight && <Sparkles className="w-2.5 h-2.5 text-orange-500 animate-pulse ml-auto" />}
    </button>
  );

  if (appState === 'landing') {
    return <Homepage onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fcfc]">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-2 font-extrabold text-lg text-gray-800">
          <div className="w-7 h-7 theme-bg-accent rounded flex items-center justify-center theme-text-on-accent shadow-sm">
             <GraduationCap className="w-4 h-4" />
          </div>
          <span>ELC<span className="theme-text-primary">{t.app_name}</span></span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="text-xs font-bold uppercase tracking-tight">Menu</span>
        </button>
      </div>

      {/* Sidebar Overlay (Mobile Only) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50 w-64 md:w-52 bg-white border-r theme-border-primary flex flex-col shadow-xl md:shadow-sm transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b theme-border-primary flex flex-col items-start gap-2">
          <div className="flex items-center gap-2 font-extrabold text-base text-gray-800">
            <div className="w-6 h-6 theme-bg-accent rounded-lg flex items-center justify-center theme-text-on-accent">
               <GraduationCap className="w-4 h-4" />
            </div>
            <span>ELC<span className="theme-text-primary">{t.app_name}</span></span>
          </div>
          <div className="flex flex-col gap-0.5">
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Management Portal</p>
             <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-[8px] font-black text-gray-500 uppercase tracking-tighter w-fit">
                <div className="w-1.5 h-1.5 theme-bg-primary rounded-full animate-pulse"></div>
                {currentUser.role}
             </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[9px] font-black theme-text-primary opacity-40 uppercase tracking-[0.15em] mb-1">
            {t.menu_main}
          </div>

          {currentUser.role === UserRole.ADMIN && (
            <>
              {/* Manajemen */}
              <SidebarItem id="accounts" label={t.nav_accounts} icon={Users} active={currentView === 'accounts' || currentView === 'default'} />

              {/* Akademik */}
              <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 opacity-40 uppercase tracking-[0.15em] mt-3 mb-1">Akademik</div>
              <SidebarItem id="students" label={t.nav_student_reports} icon={List} active={currentView === 'students'} />
              <SidebarItem id="schedule" label={t.nav_schedule} icon={CalendarDays} active={currentView === 'schedule'} />
              <SidebarItem id="locations" label={t.nav_locations} icon={MapPin} active={currentView === 'locations'} />

              {/* Publik */}
              <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 opacity-40 uppercase tracking-[0.15em] mt-3 mb-1">Publik</div>
              <SidebarItem id="placement" label="CEFR Center" icon={Search} active={currentView === 'placement'} />
              <SidebarItem id="kahoot" label="Live Quiz" icon={Gamepad2} active={currentView === 'kahoot'} highlight />
              <SidebarItem id="olympiad" label="Olimpiade" icon={Trophy} active={currentView === 'olympiad'} />
              <SidebarItem id="teacher-apps" label="Karir" icon={Briefcase} active={currentView === 'teacher-apps'} />

              {/* Keuangan */}
              <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 opacity-40 uppercase tracking-[0.15em] mt-3 mb-1">Keuangan</div>
              <SidebarItem id="billing" label="Billing & SPP" icon={DollarSign} active={currentView === 'billing'} />
              <SidebarItem id="transactions" label="Transaksi" icon={CreditCard} active={currentView === 'transactions'} />

              {/* Pengaturan */}
              <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 opacity-40 uppercase tracking-[0.15em] mt-3 mb-1">Pengaturan</div>
              <SidebarItem id="settings" label="Site Settings" icon={Palette} active={currentView === 'settings'} />
            </>
          )}

          {currentUser.role === UserRole.TEACHER && (
            <>
              <SidebarItem id="dashboard" label={t.nav_dashboard} icon={LayoutDashboard} active={currentView === 'dashboard' || currentView === 'default'} />
              <SidebarItem id="schedule" label={t.nav_schedule} icon={CalendarDays} active={currentView === 'schedule'} />
              <SidebarItem id="grades" label="Nilai Siswa" icon={BarChart3} active={currentView === 'grades'} />
              <SidebarItem id="materials" label="Afternoon Classes" icon={BookOpen} active={currentView === 'materials'} />
            </>
          )}

          {currentUser.role === UserRole.STUDENT && (
             <>
               <SidebarItem id="dashboard" label={t.nav_dashboard} icon={LayoutDashboard} active={currentView === 'dashboard' || currentView === 'default'} />
               <SidebarItem id="schedule" label={t.nav_schedule} icon={CalendarDays} active={currentView === 'schedule'} />
               <SidebarItem id="progress" label={t.nav_my_progress} icon={TrendingUp} active={currentView === 'progress'} />
               {/* Temporarily hidden - Afternoon Classes menu */}
               {/* <SidebarItem id="learning" label="Afternoon Classes" icon={BookOpen} active={currentView === 'learning'} /> */}
               <SidebarItem id="feedback" label="Feedback" icon={MessageSquare} active={currentView === 'feedback'} />
             </>
          )}

          {currentUser.role === UserRole.PARENT && (
             <>
                <SidebarItem id="dashboard" label={t.nav_dashboard} icon={LayoutDashboard} active={currentView === 'dashboard' || currentView === 'default'} />
                <SidebarItem id="schedule" label={t.nav_schedule} icon={CalendarDays} active={currentView === 'schedule'} />
                <SidebarItem id="history" label={t.nav_activity_log} icon={Activity} active={currentView === 'history'} />
                <SidebarItem id="feedback" label="Feedback" icon={MessageSquare} active={currentView === 'feedback'} />
             </>
          )}

        </nav>

        <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-2">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Developer Mode</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(UserRole) as Array<keyof typeof UserRole>).map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSwitch(UserRole[role])}
                className={`text-[8px] font-bold px-1 py-1.5 rounded border transition-all ${
                  currentUser.role === role
                    ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] px-2 py-2 rounded-lg border bg-red-50 text-red-600 border-red-100 hover:bg-red-100 font-bold uppercase tracking-tight"
          >
            <Home className="w-3 h-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-5 gap-3 border-b border-gray-100 sm:border-none pb-3 sm:pb-0">
          <div>
            <h1 className="text-base md:text-lg font-bold text-gray-900 leading-none flex items-center gap-2">
               {t.welcome},
               <span className="theme-text-primary">{currentUser.name}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
             <button
                onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
                className="flex items-center gap-1.5 text-[10px] font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm text-gray-800"
             >
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>{language === 'en' ? 'English' : 'Indonesia'}</span>
             </button>

             <div className="flex items-center gap-2">
                <div className="h-8 w-8 theme-bg-accent rounded-lg flex items-center justify-center theme-text-on-accent font-bold text-sm border-2 border-white shadow-md">
                   {currentUser.name.charAt(0)}
                </div>
             </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <SettingsProvider>
            <LanguageProvider>
                <MainAppContent />
            </LanguageProvider>
        </SettingsProvider>
    );
}

export default App;

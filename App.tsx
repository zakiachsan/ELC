
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
import { StudentRoster } from './components/teacher/StudentRoster';
import { OnlineMaterialsManager } from './components/teacher/OnlineMaterialsManager';
import { TeacherView } from './components/teacher/TeacherView';
import { Homepage } from './components/Homepage';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';

import { 
  Users, GraduationCap, LayoutDashboard, 
  CalendarDays, BookOpen, List, Home, TrendingUp, MapPin, Globe, Activity, Palette, Trophy, Sparkles, CreditCard, Search, Menu, X, Newspaper, Award, Briefcase, DollarSign
} from 'lucide-react';

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
        default: return <AccountManager />;
      }
    }
    
    if (currentUser.role === UserRole.TEACHER) {
      switch (currentView) {
        case 'dashboard': return <TeacherView onNavigate={setCurrentView} />;
        case 'schedule': return <SessionManager />;
        case 'students': return <StudentRoster />;
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
        default: return <ParentOverview student={linkedStudent} />;
      }
    }

    if (currentUser.role === UserRole.STUDENT) {
      switch (currentView) {
        case 'dashboard': return <StudentView student={currentUser} />;
        case 'schedule': return <StudentSchedule />;
        case 'progress': return <StudentProgress student={currentUser} />;
        case 'learning': return <StudentOnlineLearning student={currentUser} />;
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'theme-bg-primary-light theme-text-primary shadow-sm border theme-border-primary' 
          : highlight ? 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 hover:from-yellow-100 hover:to-orange-100 border border-yellow-200' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'theme-text-primary' : highlight ? 'text-orange-600' : 'text-gray-400'}`} />
      <span className={active ? 'font-bold' : ''}>{label}</span>
      {highlight && <Sparkles className="w-3 h-3 text-orange-500 animate-pulse ml-auto" />}
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
        fixed md:sticky top-0 left-0 h-screen z-50 w-72 md:w-64 bg-white border-r theme-border-primary flex flex-col shadow-xl md:shadow-sm transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b theme-border-primary flex flex-col items-start gap-3">
          <div className="flex items-center gap-2 font-extrabold text-xl text-gray-800">
            <div className="w-8 h-8 theme-bg-accent rounded-lg flex items-center justify-center theme-text-on-accent">
               <GraduationCap className="w-5 h-5" />
            </div>
            <span>ELC<span className="theme-text-primary">{t.app_name}</span></span>
          </div>
          {/* ROLE INDICATOR MOVED TO SIDEBAR - CLEANER CONTEXT */}
          <div className="flex flex-col gap-1">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Management Portal</p>
             <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-[9px] font-black text-gray-500 uppercase tracking-tighter w-fit">
                <div className="w-1.5 h-1.5 theme-bg-primary rounded-full animate-pulse"></div>
                {currentUser.role}
             </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-black theme-text-primary opacity-40 uppercase tracking-[0.2em] mb-2">
            {t.menu_main}
          </div>

          {currentUser.role === UserRole.ADMIN && (
            <>
              <SidebarItem id="accounts" label={t.nav_accounts} icon={Users} active={currentView === 'accounts' || currentView === 'default'} />
              <SidebarItem id="schedule" label={t.nav_schedule} icon={CalendarDays} active={currentView === 'schedule'} />
              <SidebarItem id="billing" label="Billing & SPP" icon={DollarSign} active={currentView === 'billing'} />
              <SidebarItem id="locations" label={t.nav_locations} icon={MapPin} active={currentView === 'locations'} />
              <SidebarItem id="students" label={t.nav_student_reports} icon={List} active={currentView === 'students'} />
              <SidebarItem id="placement" label="Placement Test" icon={Search} active={currentView === 'placement'} />
              <SidebarItem id="teacher-apps" label={t.nav_teacher_apps} icon={Briefcase} active={currentView === 'teacher-apps'} highlight />
              <SidebarItem id="olympiad" label="Olimpiade" icon={Trophy} active={currentView === 'olympiad'}  />
              <SidebarItem id="transactions" label="Transaksi" icon={CreditCard} active={currentView === 'transactions'} />
              <SidebarItem id="settings" label="Site Settings" icon={Palette} active={currentView === 'settings'} />
            </>
          )}

          {currentUser.role === UserRole.TEACHER && (
            <>
              <SidebarItem id="dashboard" label={t.nav_dashboard} icon={LayoutDashboard} active={currentView === 'dashboard' || currentView === 'default'} />
              <SidebarItem id="schedule" label={t.nav_schedule} icon={CalendarDays} active={currentView === 'schedule'} />
              <SidebarItem id="students" label={t.nav_my_students} icon={Users} active={currentView === 'students'} />
              <SidebarItem id="materials" label={t.nav_materials} icon={BookOpen} active={currentView === 'materials'} />
            </>
          )}

          {currentUser.role === UserRole.STUDENT && (
             <>
               <SidebarItem id="dashboard" label={t.nav_dashboard} icon={LayoutDashboard} active={currentView === 'dashboard' || currentView === 'default'} />
               <SidebarItem id="schedule" label={t.nav_schedule} icon={CalendarDays} active={currentView === 'schedule'} />
               <SidebarItem id="progress" label={t.nav_my_progress} icon={TrendingUp} active={currentView === 'progress'} />
               <SidebarItem id="learning" label={t.nav_learning_hub} icon={BookOpen} active={currentView === 'learning'} />
             </>
          )}

          {currentUser.role === UserRole.PARENT && (
             <>
                <SidebarItem id="dashboard" label={t.nav_dashboard} icon={LayoutDashboard} active={currentView === 'dashboard' || currentView === 'default'} />
                <SidebarItem id="schedule" label={t.nav_schedule} icon={CalendarDays} active={currentView === 'schedule'} />
                <SidebarItem id="history" label={t.nav_activity_log} icon={Activity} active={currentView === 'history'} />
             </>
          )}

        </nav>

        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Developer Mode</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(UserRole) as Array<keyof typeof UserRole>).map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSwitch(UserRole[role])}
                className={`text-[9px] font-bold px-1 py-2 rounded border transition-all ${
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
            className="w-full flex items-center justify-center gap-2 text-xs px-2 py-3 rounded-xl border bg-red-50 text-red-600 border-red-100 hover:bg-red-100 font-black uppercase tracking-tight"
          >
            <Home className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4 border-b border-gray-100 sm:border-none pb-4 sm:pb-0">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-none flex items-center gap-3">
               {t.welcome}, 
               <span className="theme-text-primary">{currentUser.name}</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
             <button 
                onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
                className="flex items-center gap-2 text-xs font-bold bg-white border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors shadow-sm text-gray-800"
             >
                <Globe className="w-4 h-4 text-blue-500" />
                <span>{language === 'en' ? 'English' : 'Indonesia'}</span>
             </button>

             <div className="flex items-center gap-3">
                <div className="h-10 w-10 theme-bg-accent rounded-xl flex items-center justify-center theme-text-on-accent font-black border-2 border-white shadow-md">
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

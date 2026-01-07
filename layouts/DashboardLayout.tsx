import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Users, GraduationCap, LayoutDashboard,
  CalendarDays, BookOpen, List, Home, TrendingUp, MapPin, Globe, Activity, Palette, Trophy, Sparkles, CreditCard, Search, Menu, X, Briefcase, DollarSign, Gamepad2, BarChart3, MessageSquare, Newspaper, Award, Clock, Star
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
}

interface SidebarItemProps {
  to: string;
  label: string;
  icon: React.ElementType;
  highlight?: boolean;
  onClick?: () => void;
}

const SidebarNavItem: React.FC<SidebarItemProps> = ({ to, label, icon: Icon, highlight, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? 'theme-bg-primary-light theme-text-primary shadow-sm border theme-border-primary'
          : highlight
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 hover:from-yellow-100 hover:to-orange-100 border border-yellow-200'
          : 'text-gray-600 hover:bg-gray-50'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon className={`w-4 h-4 ${isActive ? 'theme-text-primary' : highlight ? 'text-orange-600' : 'text-gray-400'}`} />
        <span className={isActive ? 'font-bold' : ''}>{label}</span>
        {highlight && <Sparkles className="w-2.5 h-2.5 text-orange-500 animate-pulse ml-auto" />}
      </>
    )}
  </NavLink>
);

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentUser,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
          onClick={closeMobileMenu}
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
              {/* Management */}
              <SidebarNavItem to="/admin/accounts" label={t.nav_accounts} icon={Users} onClick={closeMobileMenu} />

              {/* Academic */}
              <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 opacity-40 uppercase tracking-[0.15em] mt-3 mb-1">Academic</div>
              <SidebarNavItem to="/admin/students" label={t.nav_student_reports} icon={List} onClick={closeMobileMenu} />
              <SidebarNavItem to="/admin/teachers" label="Teacher" icon={GraduationCap} onClick={closeMobileMenu} />
              <SidebarNavItem to="/admin/reviews" label="Teacher Reviews" icon={Star} onClick={closeMobileMenu} />
              <SidebarNavItem to="/admin/schedule" label={t.nav_schedule} icon={CalendarDays} onClick={closeMobileMenu} />
              <SidebarNavItem to="/admin/locations" label={t.nav_locations} icon={MapPin} onClick={closeMobileMenu} />

              {/* Public */}
              <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 opacity-40 uppercase tracking-[0.15em] mt-3 mb-1">Public</div>
              <SidebarNavItem to="/admin/placement" label="CEFR Center" icon={Search} onClick={closeMobileMenu} />
              <SidebarNavItem to="/admin/kahoot" label="Live Quiz" icon={Gamepad2} highlight onClick={closeMobileMenu} />
              <SidebarNavItem to="/admin/olympiad" label="Olympiad" icon={Trophy} onClick={closeMobileMenu} />
              <SidebarNavItem to="/admin/news" label="News & Articles" icon={Newspaper} onClick={closeMobileMenu} />
              <SidebarNavItem to="/admin/student-of-month" label="Student of Month" icon={Award} onClick={closeMobileMenu} />
              <SidebarNavItem to="/admin/careers" label="Careers" icon={Briefcase} onClick={closeMobileMenu} />

              {/* Finance */}
              <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 opacity-40 uppercase tracking-[0.15em] mt-3 mb-1">Finance</div>
              <SidebarNavItem to="/admin/billing" label="Billing & SPP" icon={DollarSign} onClick={closeMobileMenu} />
              <SidebarNavItem to="/admin/transactions" label="Transactions" icon={CreditCard} onClick={closeMobileMenu} />

              {/* Settings */}
              <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 opacity-40 uppercase tracking-[0.15em] mt-3 mb-1">Settings</div>
              <SidebarNavItem to="/admin/settings" label="Site Settings" icon={Palette} onClick={closeMobileMenu} />
            </>
          )}

          {currentUser.role === UserRole.TEACHER && (
            <>
              <SidebarNavItem to="/teacher/dashboard" label={t.nav_dashboard} icon={LayoutDashboard} onClick={closeMobileMenu} />
              <SidebarNavItem to="/teacher/attendance" label="Attendance" icon={Clock} onClick={closeMobileMenu} />
              <SidebarNavItem to="/teacher/schedule" label={t.nav_schedule} icon={CalendarDays} onClick={closeMobileMenu} />
              <SidebarNavItem to="/teacher/tests" label="Test Schedule" icon={List} onClick={closeMobileMenu} />
              <SidebarNavItem to="/teacher/grades" label="Student Grades" icon={BarChart3} onClick={closeMobileMenu} />
              <SidebarNavItem to="/teacher/materials" label="Afternoon Classes" icon={BookOpen} onClick={closeMobileMenu} />
            </>
          )}

          {currentUser.role === UserRole.STUDENT && (
            <>
              <SidebarNavItem to="/student/dashboard" label={t.nav_dashboard} icon={LayoutDashboard} onClick={closeMobileMenu} />
              <SidebarNavItem to="/student/schedule" label={t.nav_schedule} icon={CalendarDays} onClick={closeMobileMenu} />
              <SidebarNavItem to="/student/progress" label={t.nav_my_progress} icon={TrendingUp} onClick={closeMobileMenu} />
              <SidebarNavItem to="/student/grades" label="Semester Grades" icon={BarChart3} onClick={closeMobileMenu} />
              <SidebarNavItem to="/student/review" label="Teacher Review" icon={Star} onClick={closeMobileMenu} />
              {/* Temporarily hidden - Afternoon Classes menu */}
              {/* <SidebarNavItem to="/student/learning" label="Afternoon Classes" icon={BookOpen} onClick={closeMobileMenu} /> */}
              <SidebarNavItem to="/student/feedback" label="Feedback" icon={MessageSquare} onClick={closeMobileMenu} />
            </>
          )}

          {currentUser.role === UserRole.PARENT && (
            <>
              <SidebarNavItem to="/parent/dashboard" label={t.nav_dashboard} icon={LayoutDashboard} onClick={closeMobileMenu} />
              <SidebarNavItem to="/parent/schedule" label={t.nav_schedule} icon={CalendarDays} onClick={closeMobileMenu} />
              <SidebarNavItem to="/parent/history" label={t.nav_activity_log} icon={Activity} onClick={closeMobileMenu} />
              <SidebarNavItem to="/parent/review" label="Teacher Review" icon={Star} onClick={closeMobileMenu} />
              <SidebarNavItem to="/parent/feedback" label="Feedback" icon={MessageSquare} onClick={closeMobileMenu} />
            </>
          )}
        </nav>

        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onLogout}
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
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

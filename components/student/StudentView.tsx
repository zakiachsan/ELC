
import React, { useState } from 'react';
import { User, SkillCategory, DifficultyLevel, ClassSession } from '../../types';
import { Card } from '../Card';

import { LEVEL_COLORS } from '../../constants';
import { useTodaySessions, useUpcomingSessions, useSessions } from '../../hooks/useSessions';
import { useModuleProgress, useModules } from '../../hooks/useModules';
import { useLocations } from '../../hooks/useProfiles';
import { Calendar, Clock, MapPin, Headphones, BookOpen, PenTool, Mic, AlignLeft, Book, Info, History, MonitorPlay, School, Loader2, Phone, Edit2, Check, X, GraduationCap } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Icon Mapper for Skills (exported for use in other components)
export const SKILL_ICONS: Record<SkillCategory, React.ElementType> = {
  [SkillCategory.LISTENING]: Headphones,
  [SkillCategory.READING]: BookOpen,
  [SkillCategory.WRITING]: PenTool,
  [SkillCategory.SPEAKING]: Mic,
  [SkillCategory.GRAMMAR]: AlignLeft,
  [SkillCategory.VOCABULARY]: Book,
};

export const StudentView: React.FC<{ student: User }> = ({ student }) => {
  const { t } = useLanguage();
  const { updateProfile } = useAuth();
  const navigate = useNavigate();
  const { sessions: todaySessionsData, loading: todayLoading } = useTodaySessions();
  const { sessions: upcomingSessionsData, loading: upcomingLoading } = useUpcomingSessions();
  // Only fetch last 20 sessions for "Recent Activity" - we only need 1 after filtering
  const { sessions: allSessionsData, loading: sessionsLoading } = useSessions({ past: true, limit: 20 });
  const { progress: progressData, loading: progressLoading } = useModuleProgress(student.id);
  const { modules: modulesData, loading: modulesLoading } = useModules();
  const { locations, loading: locationsLoading } = useLocations();

  // WhatsApp editing state
  const [isEditingWhatsApp, setIsEditingWhatsApp] = useState(false);
  const [whatsAppNumber, setWhatsAppNumber] = useState(student.phone || '');
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);

  // Parse class name from schoolOrigin (format: "SCHOOL - CLASS")
  const className = (() => {
    if (student.schoolOrigin && student.schoolOrigin.includes(' - ')) {
      const parts = student.schoolOrigin.split(' - ');
      if (parts.length > 1) {
        return parts.slice(1).join(' - '); // Get everything after first " - "
      }
    }
    return null;
  })();

  const handleSaveWhatsApp = async () => {
    setIsSavingWhatsApp(true);
    try {
      const { error } = await updateProfile({ phone: whatsAppNumber || null });
      if (error) {
        alert('Failed to save WhatsApp number. Please try again.');
      } else {
        setIsEditingWhatsApp(false);
      }
    } catch (err) {
      console.error('Error saving WhatsApp:', err);
      alert('Failed to save WhatsApp number. Please try again.');
    } finally {
      setIsSavingWhatsApp(false);
    }
  };

  const handleCancelWhatsApp = () => {
    setWhatsAppNumber(student.phone || '');
    setIsEditingWhatsApp(false);
  };

  // DEBUG: Log student data and locations
  console.log('StudentView DEBUG:', {
    studentId: student.id,
    assignedLocationId: student.assignedLocationId,
    schoolOrigin: student.schoolOrigin,
    locationsCount: locations.length,
    locationsLoading,
  });

  // Get school name from assignedLocationId (with fallback to schoolOrigin)
  const locationName = student.assignedLocationId
    ? locations.find(loc => loc.id === student.assignedLocationId)?.name
    : null;

  // Use locationName if found, otherwise fallback to schoolOrigin
  const schoolName = locationName || student.schoolOrigin || null;

  // DEBUG: Log school name result
  console.log('StudentView schoolName:', { locationName, schoolOrigin: student.schoolOrigin, final: schoolName });

  // Extract base school name for filtering (e.g., "SD ABDI SISWA ARIES" from "SD ABDI SISWA ARIES - 1 BILINGUAL")
  const baseSchoolName = schoolName?.split(' - ')[0] || student.schoolOrigin?.split(' - ')[0] || null;

  // Helper to normalize class name for comparison
  // Handles variations like "5A", "KELAS 5 A", "5 A", "KELAS 5A", etc.
  const normalizeClassName = (name: string): string => {
    return name
      .toUpperCase()
      .replace(/KELAS\s*/gi, '')  // Remove "KELAS" prefix
      .replace(/\s+/g, '')        // Remove all spaces
      .trim();
  };

  const now = new Date();


  // Map sessions from database
  const mapSession = (s: any): ClassSession => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategories: (Array.isArray(s.skill_category) ? s.skill_category : [s.skill_category]) as SkillCategory[],
    difficultyLevel: s.difficulty_level as DifficultyLevel,
    materials: s.materials || [],
  });

  // Filter sessions to only show those matching student's school AND class
  const filterByStudentClass = (sessions: ClassSession[]): ClassSession[] => {
    if (!baseSchoolName) return sessions;
    return sessions.filter(s => {
      // Check school matches
      const schoolMatches = s.location?.toLowerCase().includes(baseSchoolName.toLowerCase());
      if (!schoolMatches) return false;
      
      // If no className from student, just match school
      if (!className) return true;
      
      // Extract class from session location (format: "SCHOOL - CLASS")
      const locationParts = s.location?.split(' - ');
      if (locationParts && locationParts.length > 1) {
        const sessionClass = locationParts.slice(1).join(' - ');
        // Compare normalized class names
        return normalizeClassName(sessionClass) === normalizeClassName(className);
      }
      
      return false;
    });
  };

  // Class Logic - filter by student's school
  const todaySession = filterByStudentClass(todaySessionsData.map(mapSession))[0];

  const upcomingSession = filterByStudentClass(upcomingSessionsData
    .map(mapSession))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];

  // Recent Offline Activity (Last class attended) - filter by student's school
  const lastOfflineSession = filterByStudentClass(allSessionsData
    .map(mapSession))
    .filter(s => new Date(s.dateTime) < now)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0];

  // Recent Online Activity (Last module started/completed)
  const lastOnlineProgress = progressData
    .filter(p => p.student_id === student.id)
    .sort((a, b) => (b.completed_at ? new Date(b.completed_at).getTime() : 0) - (a.completed_at ? new Date(a.completed_at).getTime() : 0))[0];

  const lastOnlineModule = lastOnlineProgress
    ? modulesData.find(m => m.id === lastOnlineProgress.module_id)
    : null;

  if (todayLoading || upcomingLoading || sessionsLoading || progressLoading || modulesLoading || locationsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* SCHOOL INFO BANNER */}
      {schoolName && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-2 sm:p-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
              <School className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[8px] sm:text-[9px] font-bold text-blue-600 uppercase tracking-widest">School</p>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">{schoolName}</h3>
            </div>
          </div>
          {className && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm border border-blue-100">
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
              <span className="text-xs sm:text-sm font-bold text-gray-900">{className}</span>
            </div>
          )}
        </div>
      )}

      {/* WHATSAPP NUMBER SECTION */}
      <Card className="!p-2 sm:!p-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg shrink-0">
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp</p>
            {isEditingWhatsApp ? (
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                <input
                  type="tel"
                  value={whatsAppNumber}
                  onChange={(e) => setWhatsAppNumber(e.target.value)}
                  placeholder="08123456789"
                  className="w-28 sm:w-36 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveWhatsApp}
                  disabled={isSavingWhatsApp}
                  className="p-1 sm:p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                >
                  {isSavingWhatsApp ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
                <button
                  onClick={handleCancelWhatsApp}
                  disabled={isSavingWhatsApp}
                  className="p-1 sm:p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {student.phone || <span className="text-gray-400 italic text-[10px] sm:text-xs">Not set</span>}
                </span>
                <button
                  onClick={() => setIsEditingWhatsApp(true)}
                  className="p-0.5 sm:p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            )}
            <p className="hidden sm:block text-[10px] text-gray-400 mt-0.5">
              Optional - Used for important notifications from school
            </p>
          </div>
        </div>
      </Card>

      {/* SECTION 1: TODAY'S CLASSES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">

           {/* TODAY'S CLASS */}
           {todaySession && (
             <div className="space-y-1">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-yellow-600" /> {t.st_today_class}
                </h3>
                <Card
                  className="!p-3 border-l-4 border-l-yellow-400 bg-yellow-50/50 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/student/schedule?session=${todaySession.id}`)}
                >
                  <div className="flex gap-3 items-start">
                     {/* Time box - compact on mobile */}
                     <div className="bg-white rounded-lg p-2 md:p-3 text-center border border-yellow-100 shadow-sm shrink-0">
                        <span className="text-yellow-600 font-bold text-[8px] md:text-[9px] uppercase block">TODAY</span>
                        <span className="text-base md:text-xl font-extrabold text-gray-900">
                          {new Date(todaySession.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                     </div>
                     {/* Content */}
                     <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                           <span className="text-[8px] md:text-[9px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded uppercase">
                             {todaySession.skillCategories.join(', ')}
                           </span>
                           <span className={`text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${LEVEL_COLORS[todaySession.difficultyLevel]}`}>
                             {todaySession.difficultyLevel}
                           </span>
                        </div>
                        <h3 className="text-sm md:text-base font-bold text-gray-900 leading-tight">{todaySession.topic}</h3>
                        <p className="text-[10px] md:text-xs text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{todaySession.location}</span>
                        </p>
                     </div>
                  </div>
                </Card>
             </div>
           )}

           {/* UPCOMING CLASS */}
           {!todaySession && upcomingSession && (
             <div className="space-y-1">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" /> {t.st_upcoming_class}
                </h3>
                <Card
                  className="!p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/student/schedule?session=${upcomingSession.id}`)}
                >
                    <div className="flex gap-3 items-start">
                      {/* Date box - compact on mobile */}
                      <div className="bg-blue-50 rounded-lg p-2 md:p-3 flex flex-col items-center justify-center shrink-0 text-center border border-blue-100">
                          <span className="text-blue-500 font-bold text-[10px] md:text-xs uppercase">
                            {new Date(upcomingSession.dateTime).toLocaleDateString('default', {weekday: 'short'})}
                          </span>
                          <span className="text-xl md:text-2xl font-extrabold text-gray-900">
                            {new Date(upcomingSession.dateTime).getDate()}
                          </span>
                          <span className="text-[9px] md:text-[10px] text-gray-500 font-medium">
                            {new Date(upcomingSession.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                             <span className="text-[8px] md:text-[9px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded uppercase">
                               {upcomingSession.skillCategories.join(', ')}
                             </span>
                             <span className={`text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${LEVEL_COLORS[upcomingSession.difficultyLevel]}`}>
                               {upcomingSession.difficultyLevel}
                             </span>
                          </div>
                          <h3 className="text-sm md:text-base font-bold text-gray-900 leading-tight">{upcomingSession.topic}</h3>
                          <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3 text-[10px] md:text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{upcomingSession.location}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" /> 90 {t.st_minutes}
                            </span>
                          </div>
                      </div>
                    </div>
                </Card>
             </div>
           )}
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-1 space-y-3">
           <h3 className="font-bold text-gray-800 text-[10px] flex items-center gap-2 uppercase tracking-widest opacity-60">
             <History className="w-3 h-3" /> Aktivitas Terakhir
           </h3>

           <div className="space-y-2">
              {/* Last Offline Class */}
              <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm group hover:border-blue-400 transition-colors">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                       <School className="w-3 h-3" />
                    </div>
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Offline</span>
                 </div>
                 {lastOfflineSession ? (
                    <div>
                       <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{lastOfflineSession.topic}</h4>
                       <p className="text-[9px] text-gray-400 font-medium mt-0.5">{new Date(lastOfflineSession.dateTime).toLocaleDateString()}</p>
                    </div>
                 ) : (
                    <p className="text-[10px] text-gray-400 italic">Belum ada aktivitas.</p>
                 )}
              </div>

              {/* Last Online Material */}
              <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm group hover:border-purple-400 transition-colors">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
                       <MonitorPlay className="w-3 h-3" />
                    </div>
                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Online</span>
                 </div>
                 {lastOnlineModule ? (
                    <div>
                       <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{lastOnlineModule.title}</h4>
                       <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                          {lastOnlineProgress.status === 'COMPLETED' ? 'Selesai' : 'Sedang Dipelajari'}
                       </p>
                    </div>
                 ) : (
                    <p className="text-[10px] text-gray-400 italic">Belum ada materi.</p>
                 )}
              </div>

              {/* Tip */}
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex gap-2">
                 <Info className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                 <p className="text-[9px] text-blue-800 leading-relaxed font-medium">
                   {t.st_info_tip}
                 </p>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
};

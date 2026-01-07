
import React, { useState } from 'react';
import { User, SkillCategory, DifficultyLevel, ClassSession } from '../../types';
import { Card } from '../Card';
import { Button } from '../Button';
import { LEVEL_COLORS } from '../../constants';
import { useTodaySessions, useUpcomingSessions, useSessions } from '../../hooks/useSessions';
import { useModuleProgress, useModules } from '../../hooks/useModules';
import { useLocations } from '../../hooks/useProfiles';
import { Calendar, Clock, MapPin, Headphones, BookOpen, PenTool, Mic, AlignLeft, Book, Info, ChevronDown, ChevronUp, History, MonitorPlay, School, Loader2, Phone, Edit2, Check, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

// Icon Mapper for Skills
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
  const { sessions: todaySessionsData, loading: todayLoading } = useTodaySessions();
  const { sessions: upcomingSessionsData, loading: upcomingLoading } = useUpcomingSessions();
  const { sessions: allSessionsData, loading: sessionsLoading } = useSessions({ past: true });
  const { progress: progressData, loading: progressLoading } = useModuleProgress(student.id);
  const { modules: modulesData, loading: modulesLoading } = useModules();
  const { locations, loading: locationsLoading } = useLocations();

  // WhatsApp editing state
  const [isEditingWhatsApp, setIsEditingWhatsApp] = useState(false);
  const [whatsAppNumber, setWhatsAppNumber] = useState(student.phone || '');
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);

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

  const now = new Date();
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);

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

  // Filter sessions to only show those matching student's school
  const filterByStudentSchool = (sessions: ClassSession[]): ClassSession[] => {
    if (!baseSchoolName) return sessions;
    return sessions.filter(s =>
      s.location?.toLowerCase().includes(baseSchoolName.toLowerCase())
    );
  };

  // Class Logic - filter by student's school
  const todaySession = filterByStudentSchool(todaySessionsData.map(mapSession))[0];

  const upcomingSession = filterByStudentSchool(upcomingSessionsData
    .map(mapSession))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];

  // Recent Offline Activity (Last class attended) - filter by student's school
  const lastOfflineSession = filterByStudentSchool(allSessionsData
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

  // Skill logic
  const allSkills = Object.values(SkillCategory);
  const displayedSkills = isSkillsExpanded ? allSkills : allSkills.slice(0, 3);

  // Render Skill Card
  const renderSkillCard = (skill: SkillCategory) => {
    const level = student.skillLevels?.[skill];
    const Icon = SKILL_ICONS[skill] || AlignLeft;

    return (
      <div key={skill} className="bg-white px-3 py-3 rounded-lg border border-gray-100 shadow-sm flex items-center gap-3 hover:border-blue-200 transition-all">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${level ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300'}`}>
           <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{skill}</h4>
          <span className={`text-xs font-bold ${level ? 'text-gray-900' : 'text-gray-400'}`}>
             {level ? level.replace('-', ' ') : 'Not Assessed'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">

      {/* SCHOOL INFO BANNER */}
      {schoolName && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <School className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">School</p>
            <h3 className="text-sm font-bold text-gray-900">{schoolName}</h3>
          </div>
        </div>
      )}

      {/* WHATSAPP NUMBER SECTION */}
      <Card className="!p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp Number</p>
              {isEditingWhatsApp ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="tel"
                    value={whatsAppNumber}
                    onChange={(e) => setWhatsAppNumber(e.target.value)}
                    placeholder="e.g. 08123456789"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveWhatsApp}
                    disabled={isSavingWhatsApp}
                    className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                  >
                    {isSavingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCancelWhatsApp}
                    disabled={isSavingWhatsApp}
                    className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {student.phone || <span className="text-gray-400 italic">Not set</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
          {!isEditingWhatsApp && (
            <button
              onClick={() => setIsEditingWhatsApp(true)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Edit WhatsApp Number"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-2 ml-11">
          Optional - Used for important notifications from school
        </p>
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
                <Card className="!p-3 border-l-4 border-l-yellow-400 bg-yellow-50/50">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                     <div className="bg-white rounded-lg p-3 text-center border border-yellow-100 shadow-sm min-w-[90px]">
                        <span className="text-yellow-600 font-bold text-[9px] uppercase block">TODAY</span>
                        <span className="text-xl font-extrabold text-gray-900">
                          {new Date(todaySession.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                     </div>
                     <div className="flex-1 space-y-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                           <span className="text-[9px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded uppercase">
                             {todaySession.skillCategories.join(', ')}
                           </span>
                           <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${LEVEL_COLORS[todaySession.difficultyLevel]}`}>
                             {todaySession.difficultyLevel}
                           </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900">{todaySession.topic}</h3>
                        <p className="text-xs text-gray-600 flex items-center justify-center md:justify-start gap-1">
                          <MapPin className="w-3 h-3" /> {todaySession.location}
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
                <Card className="!p-3">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 flex flex-col items-center justify-center min-w-[80px] text-center border border-blue-100">
                          <span className="text-blue-500 font-bold text-xs uppercase">
                            {new Date(upcomingSession.dateTime).toLocaleDateString('default', {weekday: 'short'})}
                          </span>
                          <span className="text-2xl font-extrabold text-gray-900">
                            {new Date(upcomingSession.dateTime).getDate()}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(upcomingSession.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                      </div>

                      <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap gap-2">
                             <span className="text-[9px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded uppercase">
                               {upcomingSession.skillCategories.join(', ')}
                             </span>
                             <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${LEVEL_COLORS[upcomingSession.difficultyLevel]}`}>
                               {upcomingSession.difficultyLevel}
                             </span>
                          </div>

                          <h3 className="text-base font-bold text-gray-900">{upcomingSession.topic}</h3>

                          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {upcomingSession.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 90 {t.st_minutes}
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

      {/* SECTION 2: Skill Levels Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
           <div>
              <h2 className="text-base font-bold text-gray-900">{t.st_skill_levels}</h2>
              <p className="text-[10px] text-gray-500">{t.st_skill_desc}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
           {displayedSkills.map(skill => renderSkillCard(skill))}
        </div>

        {/* Tray Toggle Button */}
        <button
            onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
            className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest transition-colors"
        >
            {isSkillsExpanded ? (
                <>Show Less <ChevronUp className="w-3 h-3" /></>
            ) : (
                <>Show All Skills <ChevronDown className="w-3 h-3" /></>
            )}
        </button>
      </div>

    </div>
  );
};

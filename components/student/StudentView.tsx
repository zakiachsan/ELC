
import React, { useState } from 'react';
import { User, SkillCategory, DifficultyLevel } from '../../types';
import { Card } from '../Card';
import { MOCK_SESSIONS, MOCK_SESSION_REPORTS, LEVEL_COLORS, MOCK_MODULE_PROGRESS, MOCK_ONLINE_MODULES } from '../../constants';
import { Calendar, Clock, MapPin, Headphones, BookOpen, PenTool, Mic, AlignLeft, Book, Info, ChevronDown, ChevronUp, History, MonitorPlay, School, CheckCircle2, Navigation } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../Button';

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
  const now = new Date();
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Class Logic
  const todaySession = MOCK_SESSIONS.find(s => {
    const d = new Date(s.dateTime);
    return d.getDate() === now.getDate() && 
           d.getMonth() === now.getMonth() && 
           d.getFullYear() === now.getFullYear();
  });

  const upcomingSession = MOCK_SESSIONS
    .filter(s => new Date(s.dateTime) > now)
    .sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];

  // Recent Offline Activity (Last class attended)
  const lastOfflineSession = MOCK_SESSIONS
    .filter(s => new Date(s.dateTime) < now)
    .sort((a,b) => (b.dateTime ? new Date(b.dateTime).getTime() : 0) - (a.dateTime ? new Date(a.dateTime).getTime() : 0))[0];

  // Recent Online Activity (Last module started/completed)
  const lastOnlineProgress = MOCK_MODULE_PROGRESS
    .filter(p => p.studentId === student.id)
    .sort((a,b) => (b.completedDate ? new Date(b.completedDate).getTime() : 0) - (a.completedDate ? new Date(a.completedDate).getTime() : 0))[0];
  
  const lastOnlineModule = lastOnlineProgress 
    ? MOCK_ONLINE_MODULES.find(m => m.id === lastOnlineProgress.moduleId) 
    : null;

  // Stats Logic
  const completedModules = MOCK_MODULE_PROGRESS.filter(p => p.studentId === student.id && p.status === 'COMPLETED');

  // Skill logic
  const allSkills = Object.values(SkillCategory);
  const displayedSkills = isSkillsExpanded ? allSkills : allSkills.slice(0, 3);

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsCheckingIn(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Mock success check-in
        setTimeout(() => {
          setIsCheckingIn(false);
          setHasCheckedInToday(true);
          alert(`Absensi Berhasil! Lokasi Anda terverifikasi di ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        }, 1500);
      },
      (error) => {
        setIsCheckingIn(false);
        alert("Gagal memverifikasi lokasi. Pastikan GPS aktif dan berikan izin akses lokasi.");
      }
    );
  };

  // Render Minimalist Skill Card (Progress Bar Removed)
  const renderSkillCard = (skill: SkillCategory) => {
    const level = student.skillLevels?.[skill];
    const Icon = SKILL_ICONS[skill];
    
    return (
      <div key={skill} className="bg-white px-4 py-4 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${level ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300'}`}>
           <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide truncate mb-1">{skill}</h4>
          <span className={`text-sm font-bold ${level ? 'text-gray-900' : 'text-gray-400'}`}>
             {level ? level.replace('-', ' ') : 'Not Assessed'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: TODAY'S CLASSES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           
           {/* TODAY'S CLASS */}
           {todaySession && (
             <div className="space-y-2">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                   <Calendar className="w-5 h-5 text-yellow-600" /> {t.st_today_class}
                </h3>
                <Card className="border-l-4 border-l-yellow-400 bg-yellow-50/50">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                     <div className="bg-white rounded-xl p-4 text-center border border-yellow-100 shadow-sm min-w-[120px]">
                        <span className="text-yellow-600 font-bold text-xs uppercase block">TODAY</span>
                        <span className="text-2xl font-extrabold text-gray-900">
                          {new Date(todaySession.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                     </div>
                     <div className="flex-1 space-y-2 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                           <span className="text-[10px] font-bold bg-gray-800 text-white px-2 py-0.5 rounded uppercase">
                             {todaySession.skillCategory}
                           </span>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${LEVEL_COLORS[todaySession.difficultyLevel]}`}>
                             {todaySession.difficultyLevel}
                           </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{todaySession.topic}</h3>
                        <p className="text-sm text-gray-600 flex items-center justify-center md:justify-start gap-1">
                          <MapPin className="w-4 h-4" /> {todaySession.location}
                        </p>
                     </div>
                     
                     {/* CHECK-IN BUTTON SEJAJAR (ALIGNED) */}
                     <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                        {hasCheckedInToday ? (
                          <div className="bg-green-100 text-green-700 px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-xs border border-green-200">
                             <CheckCircle2 className="w-4 h-4" /> Checked-in
                          </div>
                        ) : (
                          <Button 
                            onClick={handleCheckIn} 
                            isLoading={isCheckingIn} 
                            className="w-full md:w-auto h-12 px-8 rounded-2xl shadow-lg flex items-center justify-center gap-2 font-black uppercase text-xs animate-pulse hover:animate-none"
                          >
                             <Navigation className="w-4 h-4" /> Check-in GPS
                          </Button>
                        )}
                     </div>
                  </div>
                </Card>
             </div>
           )}

           {/* UPCOMING CLASS (Show if no today session or as secondary) */}
           {!todaySession && upcomingSession && (
             <div className="space-y-2">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> {t.st_upcoming_class}
                </h3>
                <Card>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center justify-center min-w-[100px] text-center border border-blue-100">
                          <span className="text-blue-500 font-bold text-sm uppercase">
                            {new Date(upcomingSession.dateTime).toLocaleDateString('default', {weekday: 'short'})}
                          </span>
                          <span className="text-3xl font-extrabold text-gray-900">
                            {new Date(upcomingSession.dateTime).getDate()}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {new Date(upcomingSession.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap gap-2 mb-1">
                             <span className="text-[10px] font-bold bg-gray-800 text-white px-2 py-0.5 rounded uppercase">
                               {upcomingSession.skillCategory}
                             </span>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${LEVEL_COLORS[upcomingSession.difficultyLevel]}`}>
                               {upcomingSession.difficultyLevel}
                             </span>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-900">{upcomingSession.topic}</h3>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" /> {upcomingSession.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" /> 90 {t.st_minutes}
                            </span>
                          </div>
                      </div>
                    </div>
                </Card>
             </div>
           )}
        </div>

        {/* Right Column: Aktivitas Terakhir (RECENT ACTIVITY) */}
        <div className="lg:col-span-1 space-y-4">
           <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest opacity-60">
             <History className="w-4 h-4" /> Aktivitas Terakhir
           </h3>
           
           <div className="space-y-3">
              {/* Last Offline Class */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm group hover:border-blue-400 transition-colors">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                       <School className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Terakhir di Kelas (Offline)</span>
                 </div>
                 {lastOfflineSession ? (
                    <div>
                       <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{lastOfflineSession.topic}</h4>
                       <p className="text-[10px] text-gray-400 font-medium mt-1">Selesai pada {new Date(lastOfflineSession.dateTime).toLocaleDateString()}</p>
                    </div>
                 ) : (
                    <p className="text-xs text-gray-400 italic">Belum ada aktivitas kelas.</p>
                 )}
              </div>

              {/* Last Online Material */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm group hover:border-purple-400 transition-colors">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                       <MonitorPlay className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Materi Terakhir (Online)</span>
                 </div>
                 {lastOnlineModule ? (
                    <div>
                       <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{lastOnlineModule.title}</h4>
                       <p className="text-[10px] text-gray-400 font-medium mt-1">
                          {lastOnlineProgress.status === 'COMPLETED' ? 'Selesai' : 'Sedang Dipelajari'}
                       </p>
                    </div>
                 ) : (
                    <p className="text-xs text-gray-400 italic">Belum ada materi online dibuka.</p>
                 )}
              </div>

              {/* Learning Progress Tip */}
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-3">
                 <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                   {t.st_info_tip}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* SECTION 2: Skill Levels Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
           <div>
              <h2 className="text-xl font-bold text-gray-900">{t.st_skill_levels}</h2>
              <p className="text-xs text-gray-500 mt-1">{t.st_skill_desc}</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
           {displayedSkills.map(skill => renderSkillCard(skill))}
        </div>

        {/* Tray Toggle Button */}
        <div className="pt-2">
            <button 
                onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest transition-colors shadow-inner"
            >
                {isSkillsExpanded ? (
                    <>Show Less <ChevronUp className="w-4 h-4" /></>
                ) : (
                    <>Show All Skills <ChevronDown className="w-4 h-4" /></>
                )}
            </button>
        </div>
      </div>

    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { LEVEL_COLORS } from '../../constants';
import { useTodaySessions, useSessions } from '../../hooks/useSessions';
import { useStudents, useLocations } from '../../hooks/useProfiles';
import { useAttendance } from '../../hooks/useAttendance';
import { useAuth } from '../../contexts/AuthContext';
import { SkillCategory, DifficultyLevel, ClassSession } from '../../types';
import { Calendar, AlertCircle, TrendingUp, Clock, MapPin, ChevronRight, ClipboardList, CheckCircle, Loader2, LogIn, LogOut, Navigation } from 'lucide-react';
import { SKILL_ICONS } from '../student/StudentView';
import { useLanguage } from '../../contexts/LanguageContext';

interface TeacherViewProps {
  onNavigate: (view: string) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user: currentTeacher } = useAuth();
  const { sessions: todaySessionsData, loading: todayLoading, error: todayError } = useTodaySessions();
  const { sessions: allSessionsData, loading: sessionsLoading, error: sessionsError } = useSessions();
  const { profiles: studentsData, loading: studentsLoading, error: studentsError } = useStudents();
  const { locations: locationsData } = useLocations();
  const { todayAttendance, checkIn, checkOut, loading: attendanceLoading } = useAttendance(currentTeacher?.id);

  // Attendance states
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung browser ini');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        setLocationError('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
        console.error('Geolocation error:', error);
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleCheckIn = async () => {
    if (!currentTeacher?.id) return;
    if (!selectedLocation) {
      setShowLocationSelect(true);
      return;
    }

    setIsCheckingIn(true);
    try {
      const selectedLoc = locationsData.find(l => l.id === selectedLocation);
      await checkIn({
        teacher_id: currentTeacher.id,
        location_id: selectedLocation || null,
        location_name: selectedLoc?.name || 'Unknown',
        latitude: currentPosition?.lat || null,
        longitude: currentPosition?.lng || null,
      });
      setShowLocationSelect(false);
      setSelectedLocation('');
    } catch (err) {
      console.error('Check-in error:', err);
      alert('Gagal check-in. Silakan coba lagi.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance?.id) return;
    setIsCheckingIn(true);
    try {
      await checkOut(todayAttendance.id);
    } catch (err) {
      console.error('Check-out error:', err);
      alert('Gagal check-out. Silakan coba lagi.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Check if there are any errors
  const hasError = todayError || sessionsError || studentsError;

  const now = new Date();

  // Map database format to component format
  const todaySessions: ClassSession[] = todaySessionsData.map(s => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategory: s.skill_category as SkillCategory,
    difficultyLevel: s.difficulty_level as DifficultyLevel,
    materials: s.materials || [],
  })).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // 2. STUDENTS NEED ATTENTION LOGIC
  const studentsAtRisk = studentsData.filter(u => u.needs_attention).map(u => {
    // Mocking specific reasons for display purposes
    const reasons = [
        "Absent 3x in a row",
        "Grammar score dropped 15%",
        "Incomplete homework assignments",
        "Placement test failed twice"
    ];
    return {
        id: u.id,
        name: u.name,
        reason: reasons[Math.floor(Math.random() * reasons.length)]
    };
  });

  // 3. STATS LOGIC
  const pendingTasks = allSessionsData.filter(s => {
    return new Date(s.date_time) < now && (!s.description || s.description.length < 10);
  }).length;

  // Show loading only if still loading and no errors
  const isLoading = (todayLoading || sessionsLoading || studentsLoading) && !hasError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  // Show error message if there's an error but allow viewing the dashboard with partial data
  if (hasError) {
    console.error('Dashboard data errors:', { todayError, sessionsError, studentsError });
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
         <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" /> {t.tc_dashboard_title}
            </h2>
            <p className="text-gray-500 text-xs">{t.tc_dashboard_desc}</p>
         </div>
         <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
         </p>
       </div>

       {/* ATTENDANCE CHECK-IN/OUT CARD */}
       <Card className={`!p-4 ${todayAttendance && !todayAttendance.check_out_time ? 'bg-gradient-to-br from-green-50 to-white border-green-200' : 'bg-gradient-to-br from-orange-50 to-white border-orange-200'}`}>
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
           <div className="flex items-center gap-3">
             <div className={`p-3 rounded-xl ${todayAttendance && !todayAttendance.check_out_time ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
               {todayAttendance && !todayAttendance.check_out_time ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
             </div>
             <div>
               <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Absensi Hari Ini</div>
               {todayAttendance ? (
                 <div>
                   <div className="text-sm font-bold text-gray-900">
                     Check-in: {new Date(todayAttendance.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                     {todayAttendance.check_out_time && (
                       <span className="ml-2">
                         | Check-out: {new Date(todayAttendance.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                       </span>
                     )}
                   </div>
                   <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                     <MapPin className="w-3 h-3" /> {todayAttendance.location_name || 'Unknown Location'}
                   </div>
                 </div>
               ) : (
                 <div className="text-sm font-bold text-gray-900">Belum check-in hari ini</div>
               )}
             </div>
           </div>
           <div className="flex items-center gap-2">
             {currentPosition && (
               <div className="text-[9px] text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                 <Navigation className="w-3 h-3" /> GPS Aktif
               </div>
             )}
             {!todayAttendance ? (
               <Button
                 onClick={() => setShowLocationSelect(true)}
                 disabled={isCheckingIn || attendanceLoading}
                 className="text-xs py-2 px-4"
               >
                 {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check-in'}
               </Button>
             ) : !todayAttendance.check_out_time ? (
               <Button
                 onClick={handleCheckOut}
                 disabled={isCheckingIn}
                 variant="outline"
                 className="text-xs py-2 px-4 border-green-300 text-green-700 hover:bg-green-50"
               >
                 {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check-out'}
               </Button>
             ) : (
               <span className="text-[10px] font-bold text-green-600 bg-green-100 px-3 py-1.5 rounded-full">
                 Selesai
               </span>
             )}
           </div>
         </div>
       </Card>

       {/* Location Selection Modal */}
       {showLocationSelect && (
         <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <Card className="w-full max-w-md !p-4 space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-orange-600" /> Pilih Lokasi Check-in
               </h3>
               <button onClick={() => setShowLocationSelect(false)} className="p-1 text-gray-400 hover:text-gray-600">
                 ✕
               </button>
             </div>
             <div className="space-y-2">
               <label className="text-[9px] font-black text-gray-400 uppercase">Lokasi Sekolah</label>
               <select
                 value={selectedLocation}
                 onChange={(e) => setSelectedLocation(e.target.value)}
                 className="w-full border rounded-lg px-3 py-2 text-xs bg-white"
               >
                 <option value="">Pilih lokasi...</option>
                 {locationsData.map((loc) => (
                   <option key={loc.id} value={loc.id}>{loc.name}</option>
                 ))}
               </select>
             </div>
             {currentPosition && (
               <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                 <p className="text-[10px] text-green-700 flex items-center gap-1">
                   <Navigation className="w-3 h-3" /> Koordinat: {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                 </p>
               </div>
             )}
             {locationError && (
               <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                 <p className="text-[10px] text-yellow-700">{locationError}</p>
               </div>
             )}
             <div className="flex gap-2 pt-2">
               <button
                 onClick={() => setShowLocationSelect(false)}
                 className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
               >
                 Batal
               </button>
               <Button
                 onClick={handleCheckIn}
                 disabled={!selectedLocation || isCheckingIn}
                 className="flex-1 text-xs py-2"
               >
                 {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi Check-in'}
               </Button>
             </div>
           </Card>
         </div>
       )}

       {/* TOP STATS ROW */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
         <Card className="!p-3 bg-gradient-to-br from-blue-50 to-white border-blue-100">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                 <TrendingUp className="w-4 h-4" />
               </div>
               <div>
                 <div className="text-gray-500 text-[9px] font-black uppercase tracking-widest">{t.tc_avg_att}</div>
                 <div className="text-lg font-bold text-gray-900">94%</div>
               </div>
             </div>
             <CheckCircle className="w-8 h-8 text-blue-100" />
           </div>
         </Card>

         <Card className="!p-3 bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                 <ClipboardList className="w-4 h-4" />
               </div>
               <div>
                 <div className="text-gray-500 text-[9px] font-black uppercase tracking-widest">{t.tc_pending_tasks}</div>
                 <div className="text-lg font-bold text-gray-900">{pendingTasks} <span className="text-xs font-medium text-gray-400">{t.tc_items}</span></div>
               </div>
             </div>
             <div className="text-[9px] text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded font-bold">
                Action Needed
             </div>
           </div>
         </Card>
       </div>

       {/* MAIN CONTENT GRID */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

         {/* LEFT: TODAY'S SCHEDULE (2/3 Width) */}
         <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" /> {t.tc_today_schedule}
            </h3>

            {todaySessions.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 text-center">
                    <p className="text-gray-400 text-xs">{t.tc_no_classes}</p>
                    <button
                        onClick={() => onNavigate('schedule')}
                        className="text-blue-600 text-xs font-bold mt-2 hover:underline"
                    >
                        {t.tc_view_upcoming}
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {todaySessions.map(session => {
                        const Icon = SKILL_ICONS[session.skillCategory];
                        return (
                            <div
                                key={session.id}
                                onClick={() => onNavigate('schedule')}
                                className="group bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                            >
                                {/* Time Column */}
                                <div className="min-w-[60px] text-center sm:text-left">
                                    <div className="text-sm font-bold text-gray-900">
                                        {new Date(session.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="text-[9px] text-gray-500 font-medium uppercase">{t.tc_start}</div>
                                </div>

                                {/* Divider */}
                                <div className="hidden sm:block w-px h-8 bg-gray-100"></div>

                                {/* Info Column */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${LEVEL_COLORS[session.difficultyLevel]}`}>
                                            {session.difficultyLevel}
                                        </span>
                                        <span className="text-[9px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                            <Icon className="w-2.5 h-2.5" /> {session.skillCategory}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{session.topic}</h4>
                                    <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                                        <MapPin className="w-2.5 h-2.5" /> {session.location}
                                    </div>
                                </div>

                                {/* Action Icon */}
                                <div className="bg-gray-50 p-1.5 rounded-full group-hover:bg-blue-50 transition-colors">
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
         </div>

         {/* RIGHT: STUDENTS NEED ATTENTION (1/3 Width) */}
         <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" /> {t.tc_needs_attention}
            </h3>

            <Card className="!p-0 overflow-hidden border-red-100">
                <div className="divide-y divide-gray-100">
                    {studentsAtRisk.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-500">
                            {t.tc_no_flags}
                        </div>
                    )}
                    {studentsAtRisk.map(student => (
                        <div
                            key={student.id}
                            onClick={() => onNavigate('students')}
                            className="p-3 hover:bg-red-50/50 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {student.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">{student.name}</p>
                                    <p className="text-[10px] text-red-600 font-medium truncate">{student.reason}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                    <button onClick={() => onNavigate('students')} className="text-[10px] font-bold text-gray-500 hover:text-gray-800">
                        {t.tc_view_all_students}
                    </button>
                </div>
            </Card>
         </div>

       </div>
    </div>
  );
};

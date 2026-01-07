
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../Card';
import { Button } from '../Button';
import { LEVEL_COLORS } from '../../constants';
import { useTodaySessions, useSessions } from '../../hooks/useSessions';
import { useLocations } from '../../hooks/useProfiles';
import { useAttendance } from '../../hooks/useAttendance';
import { useAuth } from '../../contexts/AuthContext';
import { useTests } from '../../hooks/useTests';
import { SkillCategory, DifficultyLevel, ClassSession } from '../../types';
import { Calendar, Clock, MapPin, ChevronRight, Loader2, LogIn, LogOut, Navigation, AlignLeft, FileText, AlertTriangle, BookOpen } from 'lucide-react';
import { SKILL_ICONS } from '../student/StudentView';
import { useLanguage } from '../../contexts/LanguageContext';

interface TeacherViewProps {
  onNavigate: (view: string) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user: currentTeacher } = useAuth();
  const { sessions: todaySessionsData, loading: todayLoading, error: todayError } = useTodaySessions();
  const { sessions: upcomingSessions, loading: upcomingLoading } = useSessions({ teacherId: currentTeacher?.id, upcoming: true });
  const { tests: teacherTests, loading: testsLoading } = useTests({ teacherId: currentTeacher?.id });
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
      setLocationError('Geolocation is not supported by this browser');
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
        setLocationError('Failed to get location. Make sure GPS is active.');
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
      alert('Check-in failed. Please try again.');
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
      alert('Check-out failed. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Check if there are any errors
  const hasError = todayError;

  // Map database format to component format
  const todaySessions: ClassSession[] = todaySessionsData.map(s => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategories: (Array.isArray(s.skill_category) ? s.skill_category : [s.skill_category]) as SkillCategory[],
    difficultyLevel: s.difficulty_level as DifficultyLevel,
    materials: s.materials || [],
  })).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Get today's tests
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTests = teacherTests.filter(test => {
    const testDate = new Date(test.date_time);
    return testDate >= today && testDate < tomorrow;
  }).sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

  // Get upcoming sessions without materials (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const sessionsWithoutMaterials = upcomingSessions
    .filter(s => {
      const sessionDate = new Date(s.date_time);
      return sessionDate >= today && sessionDate <= nextWeek && (!s.materials || s.materials.length === 0);
    })
    .slice(0, 5); // Limit to 5 items

  // Show loading only if critical data is loading
  const isLoading = todayLoading && !hasError;

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
    console.error('Dashboard data errors:', { todayError });
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

       {/* ATTENDANCE CHECK-IN/OUT - Compact */}
       <div className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border ${todayAttendance && !todayAttendance.check_out_time ? 'bg-green-50/50 border-green-200' : todayAttendance?.check_out_time ? 'bg-gray-50 border-gray-200' : 'bg-orange-50/50 border-orange-200'}`}>
         <div className="flex items-center gap-2">
           <div className={`p-1.5 rounded-lg ${todayAttendance && !todayAttendance.check_out_time ? 'bg-green-100 text-green-600' : todayAttendance?.check_out_time ? 'bg-gray-200 text-gray-500' : 'bg-orange-100 text-orange-600'}`}>
             {todayAttendance && !todayAttendance.check_out_time ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
           </div>
           <div className="text-xs">
             {todayAttendance ? (
               <span className="text-gray-700">
                 <span className="font-semibold">In:</span> {new Date(todayAttendance.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                 {todayAttendance.check_out_time && (
                   <span className="ml-2"><span className="font-semibold">Out:</span> {new Date(todayAttendance.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                 )}
                 <span className="text-gray-400 ml-2">@ {todayAttendance.location_name || 'Unknown'}</span>
               </span>
             ) : (
               <span className="text-gray-600">Not checked in today</span>
             )}
           </div>
         </div>
         <div className="flex items-center gap-2">
           {currentPosition && (
             <span className="text-[9px] text-green-600 flex items-center gap-0.5">
               <Navigation className="w-3 h-3" /> GPS
             </span>
           )}
           {!todayAttendance ? (
             <Button onClick={() => setShowLocationSelect(true)} disabled={isCheckingIn || attendanceLoading} className="text-xs py-1 px-3 h-7">
               {isCheckingIn ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Check-in'}
             </Button>
           ) : !todayAttendance.check_out_time ? (
             <Button onClick={handleCheckOut} disabled={isCheckingIn} variant="outline" className="text-xs py-1 px-3 h-7 border-green-300 text-green-700 hover:bg-green-50">
               {isCheckingIn ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Check-out'}
             </Button>
           ) : (
             <span className="text-[10px] font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">Done</span>
           )}
         </div>
       </div>

       {/* Location Selection Modal */}
       {showLocationSelect && (
         <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <Card className="w-full max-w-md !p-4 space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-orange-600" /> Select Check-in Location
               </h3>
               <button onClick={() => setShowLocationSelect(false)} className="p-1 text-gray-400 hover:text-gray-600">
                 ✕
               </button>
             </div>
             <div className="space-y-2">
               <label className="text-[9px] font-black text-gray-400 uppercase">School Location</label>
               <select
                 value={selectedLocation}
                 onChange={(e) => setSelectedLocation(e.target.value)}
                 className="w-full border rounded-lg px-3 py-2 text-xs bg-white"
               >
                 <option value="">Select location...</option>
                 {locationsData.map((loc) => (
                   <option key={loc.id} value={loc.id}>{loc.name}</option>
                 ))}
               </select>
             </div>
             {currentPosition && (
               <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                 <p className="text-[10px] text-green-700 flex items-center gap-1">
                   <Navigation className="w-3 h-3" /> Coordinates: {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
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
                 Cancel
               </button>
               <Button
                 onClick={handleCheckIn}
                 disabled={!selectedLocation || isCheckingIn}
                 className="flex-1 text-xs py-2"
               >
                 {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Check-in'}
               </Button>
             </div>
           </Card>
         </div>
       )}

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
                        const primarySkill = session.skillCategories[0] || SkillCategory.GRAMMAR;
                        const Icon = SKILL_ICONS[primarySkill] || AlignLeft;
                        // Parse location to get school and class (format: "SCHOOL - CLASS")
                        const locationParts = session.location.split(' - ');
                        const schoolName = locationParts[0] || session.location;
                        const className = locationParts[1] || '';
                        return (
                            <div
                                key={session.id}
                                onClick={() => {
                                    if (className) {
                                        navigate(`/teacher/schedule/${encodeURIComponent(schoolName)}/${encodeURIComponent(className)}?session=${session.id}`);
                                    } else {
                                        navigate(`/teacher/schedule/${encodeURIComponent(schoolName)}?session=${session.id}`);
                                    }
                                }}
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
                                            <Icon className="w-2.5 h-2.5" /> {session.skillCategories.join(', ')}
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

         {/* RIGHT SIDEBAR */}
         <div className="space-y-4">
            {/* TODAY'S TESTS */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" /> Today's Tests
              </h3>
              <Card className="!p-0 overflow-hidden border-purple-100">
                {todayTests.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-500">
                    No tests scheduled for today
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {todayTests.map(test => (
                      <div key={test.id} onClick={() => onNavigate('tests')} className="p-2.5 hover:bg-purple-50/50 cursor-pointer transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg shrink-0">
                            <Clock className="w-3 h-3" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 truncate">{test.title}</p>
                            <p className="text-[10px] text-gray-500 truncate">{test.class_name} • {test.location}</p>
                            <p className="text-[10px] text-purple-600 font-medium mt-0.5">
                              {new Date(test.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {test.duration_minutes} mins
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* SESSIONS WITHOUT MATERIALS */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Materials
              </h3>
              <Card className="!p-0 overflow-hidden border-amber-100">
                {sessionsWithoutMaterials.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-500">
                    All upcoming sessions have materials
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {sessionsWithoutMaterials.map(session => {
                      const locationParts = session.location.split(' - ');
                      const schoolName = locationParts[0] || session.location;
                      const className = locationParts[1] || '';
                      return (
                        <div
                          key={session.id}
                          onClick={() => {
                            if (className) {
                              navigate(`/teacher/schedule/${encodeURIComponent(schoolName)}/${encodeURIComponent(className)}?session=${session.id}`);
                            } else {
                              navigate(`/teacher/schedule/${encodeURIComponent(schoolName)}?session=${session.id}`);
                            }
                          }}
                          className="p-2.5 hover:bg-amber-50/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                              <BookOpen className="w-3 h-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-gray-900 truncate">{session.topic}</p>
                              <p className="text-[10px] text-gray-500 truncate">{session.location}</p>
                              <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                                {new Date(session.date_time).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                  <button onClick={() => onNavigate('schedule')} className="text-[10px] font-bold text-gray-500 hover:text-gray-800">
                    View All Sessions →
                  </button>
                </div>
              </Card>
            </div>
         </div>

       </div>
    </div>
  );
};

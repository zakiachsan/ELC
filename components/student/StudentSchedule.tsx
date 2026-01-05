
import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { useSessions } from '../../hooks/useSessions';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../contexts/AuthContext';
import { useTests } from '../../hooks/useTests';
import { supabase } from '../../lib/supabase';
import { ClassSession, SkillCategory, DifficultyLevel, CEFRLevel, ClassType } from '../../types';
import { TestSchedule, TestType } from '../../services/tests.service';
import { Calendar, MapPin, Clock, User, FileText, Download, ChevronRight, Loader2, ClipboardList, Globe, UserCheck } from 'lucide-react';

const TEST_TYPE_LABELS: Record<TestType, string> = {
  'QUIZ': 'Quiz',
  'MID_SEMESTER': 'UTS',
  'FINAL_SEMESTER': 'UAS',
};

const TEST_TYPE_COLORS: Record<TestType, string> = {
  'QUIZ': 'bg-blue-100 text-blue-700 border-blue-200',
  'MID_SEMESTER': 'bg-orange-100 text-orange-700 border-orange-200',
  'FINAL_SEMESTER': 'bg-purple-100 text-purple-700 border-purple-200',
};

interface ScheduleItem {
  id: string;
  type: 'session' | 'test';
  dateTime: string;
  title: string;
  location: string;
  description?: string;
  // Session-specific
  session?: ClassSession;
  // Test-specific
  test?: TestSchedule;
}

export const StudentSchedule: React.FC = () => {
  const { user } = useAuth();
  const { sessions: sessionsData, loading: sessionsLoading, error: sessionsError } = useSessions();
  const { reports: reportsData } = useReports();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestSchedule | null>(null);
  const [studentProfile, setStudentProfile] = useState<{ school: string; class_name: string; class_type: ClassType | null } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch student profile to get school, class, and class type
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('school, class_name, class_type')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          const profileData = data as { school: string; class_name: string; class_type: string | null };
          setStudentProfile({
            school: profileData.school,
            class_name: profileData.class_name,
            class_type: profileData.class_type as ClassType | null
          });
        }
      } catch (err) {
        console.error('Error fetching student profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  // Fetch tests for student's school and class
  const { tests: testsData, loading: testsLoading } = useTests(
    studentProfile ? {
      location: studentProfile.school,
      className: studentProfile.class_name
    } : {}
  );

  const now = new Date();

  // Map sessions from database
  const allSessions: ClassSession[] = sessionsData.map(s => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategory: s.skill_category as SkillCategory,
    difficultyLevel: s.difficulty_level as DifficultyLevel,
    materials: s.materials || [],
    classType: (s as any).class_type as ClassType | undefined,
  }));

  // Filter sessions by student's class type
  const sessions = allSessions.filter(s => {
    // If student doesn't have a class_type, show all sessions
    if (!studentProfile?.class_type) return true;
    // If session doesn't have a class_type, show it (backwards compatibility)
    if (!s.classType) return true;
    // Filter by matching class type
    return s.classType === studentProfile.class_type;
  });

  // Build reports by session
  const sessionReportsMap: Record<string, any[]> = {};
  reportsData.forEach(r => {
    if (!sessionReportsMap[r.session_id]) {
      sessionReportsMap[r.session_id] = [];
    }
    sessionReportsMap[r.session_id].push({
      studentId: r.student_id,
      studentName: r.student_name || 'Unknown',
      writtenScore: r.written_score,
      oralScore: r.oral_score,
      cefrLevel: r.cefr_level as CEFRLevel,
      teacherNotes: r.notes,
    });
  });

  // Filter tests by student's class type
  const filteredTests = testsData.filter(t => {
    // If student doesn't have a class_type, show all tests
    if (!studentProfile?.class_type) return true;
    // If test doesn't have a class_type, show it (backwards compatibility)
    if (!(t as any).class_type) return true;
    // Filter by matching class type
    return (t as any).class_type === studentProfile.class_type;
  });

  // Create combined schedule items from sessions and tests
  const scheduleItems: ScheduleItem[] = [
    // Map sessions to schedule items
    ...sessions.map(s => ({
      id: s.id,
      type: 'session' as const,
      dateTime: s.dateTime,
      title: s.topic,
      location: s.location,
      description: s.description,
      session: s,
    })),
    // Map tests to schedule items
    ...filteredTests.map(t => ({
      id: t.id,
      type: 'test' as const,
      dateTime: t.date_time,
      title: `${TEST_TYPE_LABELS[t.test_type]} - ${t.title}`,
      location: t.location,
      description: t.description || undefined,
      test: t,
    })),
  ];

  // Filter Logic
  const upcomingItems = scheduleItems
    .filter(item => new Date(item.dateTime) > now)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const pastItems = scheduleItems
    .filter(item => new Date(item.dateTime) <= now)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // Helper to get my specific report for a session
  const getMyReport = (sessionId: string) => {
    const reports = sessionReportsMap[sessionId] || [];
    return reports.find(r => r.studentId === user?.id);
  };

  if (sessionsLoading || testsLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading schedule...</span>
      </div>
    );
  }

  if (sessionsError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading schedule: {sessionsError.message}
      </div>
    );
  }

  // --- SESSION DETAIL VIEW ---
  if (selectedSession) {
    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedSession(null)} className="text-xs py-1.5 px-3">
            Back
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Class Details</h2>
            <p className="text-xs text-gray-500">{selectedSession.topic}</p>
          </div>
        </div>

        <div className="space-y-4">
              <Card className="!p-4">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Session Info</h3>
                 <div className="space-y-3">
                    <div className="flex flex-wrap gap-4 text-xs">
                       <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-teal-500" />
                          <span className="font-medium">Date:</span> {new Date(selectedSession.dateTime).toLocaleDateString()}
                       </div>
                       <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-teal-500" />
                          <span className="font-medium">Time:</span> {new Date(selectedSession.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                       </div>
                       <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-teal-500" />
                          <span className="font-medium">Location:</span> {selectedSession.location}
                       </div>
                       <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-3.5 h-3.5 text-teal-500" />
                          <span className="font-medium">Teacher:</span> Mr. John Keating
                       </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</h4>
                       <p className="text-gray-600 text-xs leading-relaxed">
                         {selectedSession.description || "No description available."}
                       </p>
                    </div>

                    {selectedSession.materials && selectedSession.materials.length > 0 && (
                       <div>
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                             <FileText className="w-3 h-3 text-blue-500" /> Materials
                          </h4>
                          <div className="flex flex-wrap gap-2">
                             {selectedSession.materials.map((mat, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2 py-1.5 rounded text-[10px] border border-blue-100 cursor-pointer hover:bg-blue-100">
                                   <Download className="w-3 h-3" /> {mat}
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              </Card>
        </div>
      </div>
    );
  }

  // --- TEST DETAIL VIEW ---
  if (selectedTest) {
    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedTest(null)} className="text-xs py-1.5 px-3">
            Back
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Test Details</h2>
            <p className="text-xs text-gray-500">{selectedTest.title}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="!p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TEST_TYPE_COLORS[selectedTest.test_type]}`}>
                {TEST_TYPE_LABELS[selectedTest.test_type]}
              </span>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Test Info</h3>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-3.5 h-3.5 text-teal-500" />
                  <span className="font-medium">Date:</span> {new Date(selectedTest.date_time).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-3.5 h-3.5 text-teal-500" />
                  <span className="font-medium">Time:</span> {new Date(selectedTest.date_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  <span className="font-medium">Duration:</span> {selectedTest.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  <span className="font-medium">Location:</span> {selectedTest.location}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</h4>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {selectedTest.description || "No description available."}
                </p>
              </div>

              {selectedTest.materials && selectedTest.materials.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-500" /> Study Materials
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTest.materials.map((mat: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2 py-1.5 rounded text-[10px] border border-blue-100 cursor-pointer hover:bg-blue-100">
                        <Download className="w-3 h-3" /> {mat}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            My Schedule
            {studentProfile?.class_type && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                studentProfile.class_type === ClassType.BILINGUAL
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-teal-100 text-teal-700 border border-teal-200'
              }`}>
                {studentProfile.class_type === ClassType.BILINGUAL ? (
                  <><Globe className="w-2.5 h-2.5" /> Bilingual</>
                ) : (
                  <><UserCheck className="w-2.5 h-2.5" /> Regular</>
                )}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500">View classes and tests schedule.</p>
        </div>

        <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
           <button
             onClick={() => setActiveTab('upcoming')}
             className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${activeTab === 'upcoming' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Upcoming
           </button>
           <button
             onClick={() => setActiveTab('history')}
             className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${activeTab === 'history' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             History
           </button>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Topic</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(activeTab === 'upcoming' ? upcomingItems : pastItems).map(item => {
              const isHistory = activeTab === 'history';
              const report = isHistory && item.type === 'session' ? getMyReport(item.id) : null;

              return (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <div className="text-xs font-bold text-gray-900">
                      {new Date(item.dateTime).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {item.type === 'session' ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1 w-fit">
                        <Calendar className="w-2.5 h-2.5" /> Class
                      </span>
                    ) : (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${TEST_TYPE_COLORS[item.test!.test_type]}`}>
                        <ClipboardList className="w-2.5 h-2.5" /> {TEST_TYPE_LABELS[item.test!.test_type]}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs font-bold text-gray-900">
                      {item.type === 'session' ? item.session?.topic : item.test?.title}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1 text-[10px] text-gray-600">
                      <MapPin className="w-3 h-3 text-orange-500" /> {item.location}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {!isHistory ? (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        Upcoming
                      </span>
                    ) : item.type === 'session' && report ? (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        report.attendanceStatus === 'PRESENT' ? 'bg-green-50 text-green-700 border border-green-200' :
                        report.attendanceStatus === 'LATE' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {report.attendanceStatus}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                        {item.type === 'test' ? 'Completed' : 'Pending'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        if (item.type === 'session' && item.session) {
                          setSelectedSession(item.session);
                        } else if (item.type === 'test' && item.test) {
                          setSelectedTest(item.test);
                        }
                      }}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100 flex items-center gap-1 ml-auto"
                    >
                      Detail <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {activeTab === 'upcoming' && upcomingItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-400 text-[10px] italic">
                  No upcoming classes or tests scheduled.
                </td>
              </tr>
            )}

            {activeTab === 'history' && pastItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-400 text-[10px] italic">
                  No class or test history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

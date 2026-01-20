
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../Card';
import { Button } from '../Button';
import { useSessions, useTodaySessions } from '../../hooks/useSessions';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../contexts/AuthContext';
import { useTests } from '../../hooks/useTests';
import { ClassSession, SkillCategory, DifficultyLevel, CEFRLevel, ClassType } from '../../types';
import { LEVEL_COLORS } from '../../constants';
import { TestSchedule, TestType } from '../../services/tests.service';
import { Calendar, MapPin, Clock, User, FileText, Download, ChevronRight, ChevronLeft, Loader2, ClipboardList, Globe, UserCheck, Play, Lock, AlertCircle, ArrowLeft, GraduationCap, School, Paperclip, FileCheck, CalendarDays, BookOpen, File } from 'lucide-react';
import { SKILL_ICONS } from './StudentView';

// Helper to get academic year from date
const getAcademicYear = (date: Date): string => {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 6) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

// Helper to get semester from date (1 = Jul-Dec, 2 = Jan-Jun)
const getSemester = (date: Date): number => {
  const month = date.getMonth();
  return month >= 6 ? 1 : 2;
};

// Helper to get week number within semester
const getWeekInSemester = (date: Date): number => {
  const semester = getSemester(date);
  let semesterStart: Date;
  if (semester === 1) {
    semesterStart = new Date(date.getFullYear(), 6, 1);
  } else {
    semesterStart = new Date(date.getFullYear(), 0, 1);
  }
  const diffTime = date.getTime() - semesterStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
};

// Helper to get week date range
const getWeekDateRange = (year: string, semester: number, week: number): { start: Date; end: Date } => {
  const [startYear] = year.split('/').map(Number);
  let semesterStart: Date;
  if (semester === 1) {
    semesterStart = new Date(startYear, 6, 1);
  } else {
    semesterStart = new Date(startYear + 1, 0, 1);
  }
  const weekStart = new Date(semesterStart);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return { start: weekStart, end: weekEnd };
};

type CategoryType = 'materi' | 'lesson-plan' | 'task';

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
  categories?: string[];
  teacherName?: string;
  difficultyLevel?: DifficultyLevel;
  // Session-specific
  session?: ClassSession;
  // Test-specific
  test?: TestSchedule;
}

export const StudentSchedule: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Get school info early for optimized query
  const schoolOriginEarly = (user as any)?.schoolOrigin || '';
  const baseSchoolNameEarly = schoolOriginEarly?.split(' - ')[0] || '';
  
  // Use server-side filtering by school name for better performance
  const { sessions: sessionsData, loading: sessionsLoading, error: sessionsError } = useSessions(
    baseSchoolNameEarly ? { schoolName: baseSchoolNameEarly, className: '' } : {}
  );
  const { sessions: todaySessionsData, loading: todayLoading } = useTodaySessions();
  const { reports: reportsData } = useReports();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestSchedule | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Hierarchical view state
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const currentAcademicYear = getAcademicYear(new Date());

  // Get school info from AuthContext user (same approach as Dashboard)
  // Parse class name from schoolOrigin (format: "SCHOOL - CLASS")
  const schoolOrigin = (user as any)?.schoolOrigin || '';
  const className = schoolOrigin.includes(' - ')
    ? schoolOrigin.split(' - ').slice(1).join(' - ')
    : '';
  const classType = (user as any)?.classType as ClassType | null;

  // Extract base school name for filtering (same as Dashboard)
  const baseSchoolName = schoolOrigin?.split(' - ')[0] || '';

  // Helper to normalize class name for comparison
  // Handles variations like "5A", "KELAS 5 A", "5 A", "KELAS 5A", "1 BILINGUAL (Bilingual)", etc.
  const normalizeClassName = (name: string): string => {
    return name
      .toUpperCase()
      .replace(/\s*\(BILINGUAL\)\s*/gi, '')  // Remove "(Bilingual)" suffix
      .replace(/\s*\(REGULAR\)\s*/gi, '')    // Remove "(Regular)" suffix
      .replace(/KELAS\s*/gi, '')              // Remove "KELAS" prefix
      .replace(/\s+/g, '')                    // Remove all spaces
      .trim();
  };

  // Helper to check if session matches student's school AND class
  const matchesStudentClass = (sessionLocation: string | undefined): boolean => {
    if (!sessionLocation || !baseSchoolName) return false;
    
    // Check school matches
    const schoolMatches = sessionLocation.toLowerCase().includes(baseSchoolName.toLowerCase());
    if (!schoolMatches) return false;
    
    // If no className from student, just match school
    if (!className) return true;
    
    // Extract class from session location (format: "SCHOOL - CLASS")
    const locationParts = sessionLocation.split(' - ');
    if (locationParts.length > 1) {
      const sessionClass = locationParts.slice(1).join(' - ');
      // Compare normalized class names
      return normalizeClassName(sessionClass) === normalizeClassName(className);
    }
    
    return false;
  };

  // Fetch tests for student's school and class
  const { tests: testsData, loading: testsLoading } = useTests(
    schoolOrigin ? {
      location: baseSchoolName,
      className: className
    } : {}
  );

  const now = new Date();

  // Map sessions from database with teacher info
  const allSessions = sessionsData.map(s => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategories: (Array.isArray(s.skill_category) ? s.skill_category : [s.skill_category].filter(Boolean)) as SkillCategory[],
    difficultyLevel: s.difficulty_level as DifficultyLevel,
    materials: s.materials || [],
    classType: (s as any).class_type as ClassType | undefined,
    teacherName: (s as any).teacher?.name || null,
  }));

  // Filter sessions by student's school AND class
  const sessions = allSessions.filter(s => matchesStudentClass(s.location));

  // Group sessions by semester for hierarchical view
  const sessionsBySemester = {
    1: sessions.filter(s => getSemester(new Date(s.dateTime)) === 1),
    2: sessions.filter(s => getSemester(new Date(s.dateTime)) === 2),
  };

  // Get data for selected category
  const getCategoryData = () => {
    if (selectedSemester === null) return [];
    const semesterSessions = sessionsBySemester[selectedSemester as 1 | 2] || [];

    if (selectedCategory === 'materi') {
      return semesterSessions.filter(s => s.materials && s.materials.length > 0);
    } else if (selectedCategory === 'lesson-plan') {
      return semesterSessions;
    }
    return semesterSessions;
  };

  // Get weeks data for current category
  const getWeeksData = () => {
    if (!selectedCategory || selectedSemester === null) return [];

    const categoryData = getCategoryData();
    const weekMap: Record<number, { week: number; count: number; dateRange: { start: Date; end: Date } }> = {};

    categoryData.forEach(s => {
      const week = getWeekInSemester(new Date(s.dateTime));
      if (!weekMap[week]) {
        weekMap[week] = {
          week,
          count: 0,
          dateRange: getWeekDateRange(currentAcademicYear, selectedSemester!, week),
        };
      }
      weekMap[week].count++;
    });

    return Object.values(weekMap).sort((a, b) => a.week - b.week);
  };

  // Get sessions for selected week
  const getWeekSessions = () => {
    if (selectedWeek === null || !selectedCategory) return [];

    const categoryData = getCategoryData();
    return categoryData
      .filter(s => getWeekInSemester(new Date(s.dateTime)) === selectedWeek)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  };

  const weeksData = getWeeksData();
  const weekSessions = getWeekSessions();

  // Format date range helper
  const formatDateRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', options)}`;
  };

  // Navigation back in hierarchy
  const navigateBack = () => {
    if (selectedWeek !== null) {
      setSelectedWeek(null);
    } else if (selectedCategory !== null) {
      setSelectedCategory(null);
    } else if (selectedSemester !== null) {
      setSelectedSemester(null);
    }
  };

  // Map and filter today's sessions
  const todaySessions = todaySessionsData.map(s => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategories: (Array.isArray(s.skill_category) ? s.skill_category : [s.skill_category].filter(Boolean)) as string[],
    difficultyLevel: s.difficulty_level as DifficultyLevel,
    materials: s.materials || [],
    teacherName: (s as any).teacher?.name || null,
  })).filter(s => matchesStudentClass(s.location));

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
    if (!classType) return true;
    // If test doesn't have a class_type, show it (backwards compatibility)
    if (!(t as any).class_type) return true;
    // Filter by matching class type
    return (t as any).class_type === classType;
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
      categories: s.skillCategories,
      teacherName: s.teacherName,
      session: s as any,
    })),
    // Map tests to schedule items
    ...filteredTests.map(t => ({
      id: t.id,
      type: 'test' as const,
      dateTime: t.date_time,
      title: t.title,
      location: t.location,
      description: t.description || undefined,
      categories: (t as any).skill_category ? (Array.isArray((t as any).skill_category) ? (t as any).skill_category : [(t as any).skill_category]) : [],
      teacherName: (t as any).teacher?.name || null,
      test: t,
    })),
  ];

  // Filter Logic - Include items that are in progress (started but not ended)
  const getItemEndTime = (item: ScheduleItem): Date => {
    const startTime = new Date(item.dateTime);
    if (item.type === 'test' && item.test) {
      // For tests, end time = start time + duration
      return new Date(startTime.getTime() + (item.test.duration_minutes * 60 * 1000));
    } else {
      // For sessions/classes, assume 90 minutes duration
      return new Date(startTime.getTime() + (90 * 60 * 1000));
    }
  };

  const upcomingItems = scheduleItems
    .filter(item => {
      const endTime = getItemEndTime(item);
      // Show in upcoming if: not started yet OR still in progress (end time > now)
      return endTime > now;
    })
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const pastItems = scheduleItems
    .filter(item => {
      const endTime = getItemEndTime(item);
      // Show in history only if completely ended
      return endTime <= now;
    })
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // Pagination for history tab
  const totalHistoryPages = Math.ceil(pastItems.length / ITEMS_PER_PAGE);
  const paginatedPastItems = pastItems.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE
  );

  // Handle URL parameters to auto-select session or test
  useEffect(() => {
    const sessionId = searchParams.get('session');
    const testId = searchParams.get('test');

    if (sessionId && !selectedSession) {
      // Find the session in allSessions
      const session = allSessions.find(s => s.id === sessionId);
      if (session) {
        setSelectedSession(session as any);
        // Clear the URL parameter after selecting
        setSearchParams({}, { replace: true });
      }
    }

    if (testId && !selectedTest) {
      // Find the test in testsData
      const test = testsData.find(t => t.id === testId);
      if (test) {
        setSelectedTest(test);
        // Clear the URL parameter after selecting
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, allSessions, testsData, selectedSession, selectedTest, setSearchParams]);

  // Helper to get my specific report for a session
  const getMyReport = (sessionId: string) => {
    const reports = sessionReportsMap[sessionId] || [];
    return reports.find(r => r.studentId === user?.id);
  };

  if (sessionsLoading || testsLoading || todayLoading) {
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
                          <span className="font-medium">Teacher:</span> {selectedSession.teacherName || 'TBA'}
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
                          <div className="flex flex-col gap-2">
                             {selectedSession.materials.map((mat, i) => {
                                const fileName = mat.split('/').pop() || `Material ${i + 1}`;
                                return (
                                  <a
                                    key={i}
                                    href={mat}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2 py-1.5 rounded text-[10px] border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                                  >
                                    <Download className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{decodeURIComponent(fileName)}</span>
                                  </a>
                                );
                             })}
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
    const testDateTime = new Date(selectedTest.date_time);
    const testEndTime = new Date(testDateTime.getTime() + (selectedTest.duration_minutes * 60 * 1000));
    const isTestStarted = now >= testDateTime;
    const isTestEnded = now > testEndTime;
    const hasOnlineTest = (selectedTest as any).has_online_test !== false; // Default to true if not set
    
    // Calculate time until test starts
    const getTimeUntilTest = () => {
      const diff = testDateTime.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days} hari ${hours} jam lagi`;
      if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
      return `${minutes} menit lagi`;
    };

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
                  <div className="flex flex-col gap-2">
                    {selectedTest.materials.map((mat: string, i: number) => {
                      const fileName = mat.split('/').pop() || `Material ${i + 1}`;
                      return (
                        <a
                          key={i}
                          href={mat}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2 py-1.5 rounded text-[10px] border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          <Download className="w-3 h-3 shrink-0" />
                          <span className="truncate">{decodeURIComponent(fileName)}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Online Test CTA */}
          {hasOnlineTest && (
            <Card className="!p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-purple-500" />
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Online Test</h3>
              </div>
              
              {isTestEnded ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Test telah berakhir</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Berakhir pada {testEndTime.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              ) : isTestStarted ? (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-green-800">Test sedang berlangsung!</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        Berakhir pada {testEndTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate(`/student/test/${selectedTest.id}`)}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Mulai Test
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-orange-800 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Test belum dimulai
                      </p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        Dimulai dalam {getTimeUntilTest()}
                      </p>
                    </div>
                    <Button
                      disabled
                      className="bg-gray-300 text-gray-500 cursor-not-allowed flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Tunggu Waktu Test
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    );
  }

  // --- HIERARCHICAL VIEW ---
  
  // Breadcrumb navigation
  const renderBreadcrumb = () => {
    const items: { label: string; onClick: () => void }[] = [
      { label: 'Schedule', onClick: () => { setSelectedSemester(null); setSelectedCategory(null); setSelectedWeek(null); } }
    ];
    
    if (selectedSemester !== null) {
      items.push({ 
        label: `Semester ${selectedSemester}`, 
        onClick: () => { setSelectedCategory(null); setSelectedWeek(null); } 
      });
    }
    
    if (selectedCategory !== null) {
      const categoryLabels: Record<CategoryType, string> = {
        'materi': 'Materi',
        'lesson-plan': 'Lesson Plan',
        'task': 'Task'
      };
      items.push({ 
        label: categoryLabels[selectedCategory], 
        onClick: () => setSelectedWeek(null) 
      });
    }
    
    if (selectedWeek !== null) {
      items.push({ label: `Week ${selectedWeek}`, onClick: () => {} });
    }
    
    return (
      <div className="flex items-center gap-2 text-sm">
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <button
              onClick={item.onClick}
              className={`font-medium ${idx === items.length - 1 ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            My Schedule
            {classType && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                classType === ClassType.BILINGUAL
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-teal-100 text-teal-700 border border-teal-200'
              }`}>
                {classType === ClassType.BILINGUAL ? (
                  <><Globe className="w-2.5 h-2.5" /> Bilingual</>
                ) : (
                  <><UserCheck className="w-2.5 h-2.5" /> Regular</>
                )}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{currentAcademicYear} • {baseSchoolName} {className ? `- ${className}` : ''}</p>
        </div>
        {(selectedSemester !== null || selectedCategory !== null || selectedWeek !== null) && (
          <Button
            variant="secondary"
            onClick={navigateBack}
            className="flex items-center gap-2 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
      </div>

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Loading State */}
      {sessionsLoading && (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading schedule...</p>
        </Card>
      )}

      {/* Error State */}
      {sessionsError && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Failed to load schedule. Please try again.</p>
          </div>
        </Card>
      )}

      {!sessionsLoading && !sessionsError && (
        <>
          {/* Level 1: Semester Selection */}
          {selectedSemester === null && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(semester => {
                const count = sessionsBySemester[semester as 1 | 2]?.length || 0;
                return (
                  <Card
                    key={semester}
                    className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-teal-300 group"
                    onClick={() => setSelectedSemester(semester)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-bold text-white">{semester}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Semester {semester}</h3>
                          <p className="text-sm text-gray-500">
                            {semester === 1 ? 'Juli - Desember' : 'Januari - Juni'}
                          </p>
                          <p className="text-xs text-teal-600 font-medium mt-1">{count} schedule</p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-teal-600 transition-colors" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Level 2: Category Selection */}
          {selectedSemester !== null && selectedCategory === null && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'materi' as CategoryType, label: 'Materi', icon: BookOpen, color: 'from-blue-500 to-blue-600', desc: 'Learning materials' },
                { key: 'lesson-plan' as CategoryType, label: 'Lesson Plan', icon: FileText, color: 'from-green-500 to-green-600', desc: 'Lesson schedules' },
                { key: 'task' as CategoryType, label: 'Task', icon: ClipboardList, color: 'from-orange-500 to-orange-600', desc: 'Assignments & tasks' },
              ].map(cat => {
                const semesterSessions = sessionsBySemester[selectedSemester as 1 | 2] || [];
                const count = cat.key === 'materi' 
                  ? semesterSessions.filter(s => s.materials && s.materials.length > 0).length
                  : semesterSessions.length;
                return (
                  <Card
                    key={cat.key}
                    className="p-5 cursor-pointer hover:shadow-lg transition-all hover:border-teal-300 group"
                    onClick={() => setSelectedCategory(cat.key)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg mb-3`}>
                        <cat.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{cat.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
                      <p className="text-xs text-teal-600 font-medium mt-2">{count} items</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Level 3: Week Selection */}
          {selectedSemester !== null && selectedCategory !== null && selectedWeek === null && (
            <div>
              {weeksData.length === 0 ? (
                <Card className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No schedule data for this category.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {weeksData.map(w => (
                    <Card
                      key={w.week}
                      className="p-4 cursor-pointer hover:shadow-lg transition-all hover:border-teal-300 group text-center"
                      onClick={() => setSelectedWeek(w.week)}
                    >
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-teal-600 transition-colors">
                        <span className="text-sm font-bold text-teal-700 group-hover:text-white transition-colors">{w.week}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900">Week {w.week}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{formatDateRange(w.dateRange.start, w.dateRange.end)}</p>
                      <p className="text-[10px] text-teal-600 font-medium mt-1">{w.count} items</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Level 4: Session List */}
          {selectedSemester !== null && selectedCategory !== null && selectedWeek !== null && (
            <div className="space-y-3">
              {weekSessions.length === 0 ? (
                <Card className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No schedule for this week.</p>
                </Card>
              ) : (
                weekSessions.map(session => (
                  <Card
                    key={session.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-teal-500"
                    onClick={() => setSelectedSession(session as any)}
                  >
                    <div className="flex gap-4">
                      {/* Date/Time Box */}
                      <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100 shrink-0 min-w-[70px]">
                        <span className="text-[10px] font-bold text-teal-600 uppercase block">
                          {new Date(session.dateTime).toLocaleDateString('id-ID', { weekday: 'short' })}
                        </span>
                        <span className="text-lg font-extrabold text-gray-900 block">
                          {new Date(session.dateTime).getDate()}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(session.dateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {session.skillCategories.map((cat, idx) => (
                            <span key={idx} className="text-[9px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded uppercase">
                              {cat}
                            </span>
                          ))}
                          {session.difficultyLevel && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${LEVEL_COLORS[session.difficultyLevel]}`}>
                              {session.difficultyLevel}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 truncate">{session.topic}</h4>
                        <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {session.location}
                          </span>
                          {session.teacherName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {session.teacherName}
                            </span>
                          )}
                        </div>
                        {session.materials && session.materials.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-teal-600">
                            <Paperclip className="w-3 h-3" />
                            <span>{session.materials.length} attachment(s)</span>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { Card } from '../Card';
import {
  Calendar, Clock, MapPin, Eye,
  FolderOpen, Folder, ChevronRight,
  GraduationCap, BookOpen, ArrowLeft, Loader2,
  Users, FileText, School, CalendarDays,
  Paperclip, ClipboardList, FileCheck, Download,
  X, ExternalLink, Search
} from 'lucide-react';
import { useSessions } from '../../hooks/useSessions';
import { useTeachers } from '../../hooks/useProfiles';
import { useTests } from '../../hooks/useTests';
import { ClassSession, SkillCategory, DifficultyLevel } from '../../types';
import { LEVEL_COLORS } from '../../constants';
import { SKILL_ICONS } from '../student/StudentView';
import { TestSchedule } from '../../services/tests.service';

// Helper to get academic year from date
const getAcademicYear = (date: Date): string => {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 6) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

// Helper to get semester from date
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

type ViewLevel = 'teachers' | 'semesters' | 'categories' | 'weeks' | 'details';
type CategoryType = 'materi' | 'lesson-plan' | 'task';

// Logo URLs from Supabase Storage
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://prmjdngeuczatlspinql.supabase.co';
const ELC_LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/materials/Logo/elc_logo.jpeg`;
const CAMBRIDGE_LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/materials/Logo/cambridge_logo.jpeg`;

// Helper to load image as base64 with good quality
const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url + '?t=' + Date.now()); // Cache bust
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
};

// PDF Generation for Lesson Plan
const generateLessonPlanPDF = async (session: ClassSession, teacherName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // Set default line width for boxes
  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 180, 180);

  // Header with logos and title
  const headerHeight = 25;
  const logoWidth = 30;

  // Load logos
  const [elcLogo, cambridgeLogo] = await Promise.all([
    loadImageAsBase64(ELC_LOGO_URL),
    loadImageAsBase64(CAMBRIDGE_LOGO_URL)
  ]);

  // ELC Logo (left)
  if (elcLogo) {
    doc.addImage(elcLogo, 'JPEG', margin, y, logoWidth, headerHeight);
  }

  // Cambridge Logo (right)
  if (cambridgeLogo) {
    doc.addImage(cambridgeLogo, 'JPEG', pageWidth - margin - logoWidth, y, logoWidth, headerHeight);
  }

  // Center title - LESSON PLAN
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('LESSON PLAN', pageWidth / 2, y + 12, { align: 'center' });

  // CEFR subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('CEFR', pageWidth / 2, y + 20, { align: 'center' });

  y += headerHeight + 5;

  // CEFR full description
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text('(Common European Framework of Reference for languages)', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Row 1: Grade, Date, CEFR Level (3 columns)
  const col3Width = contentWidth / 3;
  const row1Height = 22;

  // Grade box
  doc.rect(margin, y, col3Width - 2, row1Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Grade :', margin + 3, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const gradeText = session.location || '';
  const gradeLines = doc.splitTextToSize(gradeText, col3Width - 8);
  doc.text(gradeLines, margin + 3, y + 13);

  // Date box
  doc.rect(margin + col3Width, y, col3Width - 2, row1Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Date:', margin + col3Width + 3, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const dateStr = new Date(session.dateTime).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(dateStr, margin + col3Width + 3, y + 13);

  // CEFR Level box
  doc.rect(margin + col3Width * 2 + 2, y, col3Width - 2, row1Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('CEFR Level :', margin + col3Width * 2 + 5, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(session.cefrLevel || '', margin + col3Width * 2 + 5, y + 13);

  y += row1Height + 5;

  // Row 2: Lesson topic, Materials needed (2 columns)
  const col2LeftWidth = contentWidth * 0.55;
  const col2RightWidth = contentWidth * 0.45 - 2;
  const row2Height = 35;

  // Lesson topic box
  doc.rect(margin, y, col2LeftWidth, row2Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Lesson topic:', margin + 3, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const topicLines = doc.splitTextToSize(session.topic || '', col2LeftWidth - 8);
  doc.text(topicLines, margin + 3, y + 13);

  // Materials needed box
  doc.rect(margin + col2LeftWidth + 2, y, col2RightWidth, row2Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Materials needed:', margin + col2LeftWidth + 5, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const materialsLines = doc.splitTextToSize(session.materialsNeeded || '', col2RightWidth - 8);
  doc.text(materialsLines, margin + col2LeftWidth + 5, y + 13);

  y += row2Height + 5;

  // Row 3: Learning objective/s (full width)
  const row3Height = 35;
  doc.rect(margin, y, contentWidth, row3Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Learning objective/s:', margin + 3, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const objectivesLines = doc.splitTextToSize(session.learningObjectives || '', contentWidth - 8);
  doc.text(objectivesLines.slice(0, 4), margin + 3, y + 13);

  y += row3Height + 5;

  // Row 4: Vocabulary table
  const vocabHeaderHeight = 10;
  const vocabColHeaderHeight = 10;
  const vocabContentHeight = 30;
  const vocabTotalHeight = vocabHeaderHeight + vocabColHeaderHeight + vocabContentHeight;
  const vocabColWidth = contentWidth / 3;

  // Outer vocabulary box
  doc.rect(margin, y, contentWidth, vocabTotalHeight);

  // Vocabulary header
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('Vocabulary:', margin + contentWidth / 2, y + 7, { align: 'center' });

  // Column headers row
  const colHeaderY = y + vocabHeaderHeight;
  doc.line(margin, colHeaderY, margin + contentWidth, colHeaderY);

  // Column header dividers
  doc.line(margin + vocabColWidth, colHeaderY, margin + vocabColWidth, y + vocabTotalHeight);
  doc.line(margin + vocabColWidth * 2, colHeaderY, margin + vocabColWidth * 2, y + vocabTotalHeight);

  // Column header text
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Verb', margin + vocabColWidth / 2, colHeaderY + 7, { align: 'center' });
  doc.text('Noun', margin + vocabColWidth + vocabColWidth / 2, colHeaderY + 7, { align: 'center' });
  doc.text('Adjective', margin + vocabColWidth * 2 + vocabColWidth / 2, colHeaderY + 7, { align: 'center' });

  // Content row line
  const contentRowY = colHeaderY + vocabColHeaderHeight;
  doc.line(margin, contentRowY, margin + contentWidth, contentRowY);

  // Vocabulary content
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  const verbLines = doc.splitTextToSize(session.vocabularyVerb || '', vocabColWidth - 6);
  const nounLines = doc.splitTextToSize(session.vocabularyNoun || '', vocabColWidth - 6);
  const adjLines = doc.splitTextToSize(session.vocabularyAdjective || '', vocabColWidth - 6);

  doc.text(verbLines.slice(0, 4), margin + 3, contentRowY + 6);
  doc.text(nounLines.slice(0, 4), margin + vocabColWidth + 3, contentRowY + 6);
  doc.text(adjLines.slice(0, 4), margin + vocabColWidth * 2 + 3, contentRowY + 6);

  y += vocabTotalHeight + 5;

  // Row 5: Lesson activity (full width, larger box)
  const row5Height = 50;
  doc.rect(margin, y, contentWidth, row5Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Lesson activity:', margin + 3, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const activityLines = doc.splitTextToSize(session.description || '', contentWidth - 8);
  doc.text(activityLines.slice(0, 7), margin + 3, y + 13);

  // Footer with teacher name
  y = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Teacher: ${teacherName}`, margin, y);
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US')}`, pageWidth - margin, y, { align: 'right' });

  // Save PDF
  const fileName = `Lesson_Plan_${session.topic.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(session.dateTime).toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

interface BreadcrumbItem {
  level: ViewLevel;
  label: string;
  value?: string;
}

export const ScheduleManagerV2: React.FC = () => {
  // Navigation state
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('teachers');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestSchedule | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load only teachers list initially
  const { profiles: teachersData, loading: teachersLoading } = useTeachers();

  // Load sessions only when teacher is selected (lazy loading)
  const { sessions: teacherSessionsData, loading: sessionsLoading } = useSessions({
    teacherId: selectedTeacherId || undefined,
    enabled: !!selectedTeacherId
  });

  // Load tests only when teacher is selected (lazy loading)
  const { tests: teacherTestsData, loading: testsLoading } = useTests({
    teacherId: selectedTeacherId || undefined,
    enabled: !!selectedTeacherId
  });

  // Map sessions for selected teacher
  const teacherSessions: ClassSession[] = useMemo(() =>
    teacherSessionsData.map(s => ({
      id: s.id,
      teacherId: s.teacher_id,
      topic: s.topic,
      description: s.description || '',
      dateTime: s.date_time,
      location: s.location,
      skillCategories: (Array.isArray(s.skill_category) ? s.skill_category : [s.skill_category]) as SkillCategory[],
      difficultyLevel: s.difficulty_level as DifficultyLevel,
      materials: s.materials || [],
      cefrLevel: s.cefr_level || '',
      learningObjectives: s.learning_objectives || '',
      vocabularyVerb: s.vocabulary_verb || '',
      vocabularyNoun: s.vocabulary_noun || '',
      vocabularyAdjective: s.vocabulary_adjective || '',
      materialsNeeded: s.materials_needed || '',
    })), [teacherSessionsData]);

  const teachers = useMemo(() =>
    teachersData.map(t => ({
      id: t.id,
      name: t.name,
      role: t.role,
    })).sort((a, b) => a.name.localeCompare(b.name)), [teachersData]);

  // Filter teachers by search query
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const query = searchQuery.toLowerCase().trim();
    return teachers.filter(t => t.name.toLowerCase().includes(query));
  }, [teachers, searchQuery]);

  // Get current academic year
  const currentAcademicYear = useMemo(() => getAcademicYear(new Date()), []);

  // Tests for selected teacher (already filtered by hook)
  const teacherTests = teacherTestsData;

  // Get sessions grouped by semester for selected teacher
  const sessionsBySemester = useMemo(() => {
    return {
      1: teacherSessions.filter(s => getSemester(new Date(s.dateTime)) === 1),
      2: teacherSessions.filter(s => getSemester(new Date(s.dateTime)) === 2),
    };
  }, [teacherSessions]);

  // Get tests grouped by semester
  const testsBySemester = useMemo(() => {
    return {
      1: teacherTests.filter(t => t.semester === '1' || getSemester(new Date(t.date_time)) === 1),
      2: teacherTests.filter(t => t.semester === '2' || getSemester(new Date(t.date_time)) === 2),
    };
  }, [teacherTests]);

  // Get data for selected semester and category
  const categoryData = useMemo(() => {
    if (selectedSemester === null || !selectedCategory) return { sessions: [], tests: [] };
    const semesterSessions = sessionsBySemester[selectedSemester as 1 | 2] || [];
    const semesterTests = testsBySemester[selectedSemester as 1 | 2] || [];

    if (selectedCategory === 'materi') {
      // Only sessions with materials
      return { sessions: semesterSessions.filter(s => s.materials && s.materials.length > 0), tests: [] };
    } else if (selectedCategory === 'lesson-plan') {
      // All sessions (lesson plans)
      return { sessions: semesterSessions, tests: [] };
    } else {
      // Task/Assessment - tests
      return { sessions: [], tests: semesterTests };
    }
  }, [selectedSemester, selectedCategory, sessionsBySemester, testsBySemester]);

  // Get weeks for current category
  const weeksData = useMemo(() => {
    if (!selectedCategory) return [];

    const weekMap: Record<number, { week: number; count: number; dateRange: { start: Date; end: Date } }> = {};

    if (selectedCategory === 'task') {
      categoryData.tests.forEach(t => {
        const week = getWeekInSemester(new Date(t.date_time));
        if (!weekMap[week]) {
          weekMap[week] = {
            week,
            count: 0,
            dateRange: getWeekDateRange(currentAcademicYear, selectedSemester!, week),
          };
        }
        weekMap[week].count++;
      });
    } else {
      categoryData.sessions.forEach(s => {
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
    }

    return Object.values(weekMap).sort((a, b) => a.week - b.week);
  }, [selectedCategory, categoryData, currentAcademicYear, selectedSemester]);

  // Get items for selected week
  const weekItems = useMemo(() => {
    if (selectedWeek === null) return { sessions: [], tests: [] };

    if (selectedCategory === 'task') {
      return {
        sessions: [],
        tests: categoryData.tests.filter(t => getWeekInSemester(new Date(t.date_time)) === selectedWeek)
          .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()),
      };
    }

    return {
      sessions: categoryData.sessions.filter(s => getWeekInSemester(new Date(s.dateTime)) === selectedWeek)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
      tests: [],
    };
  }, [selectedWeek, selectedCategory, categoryData]);

  // Breadcrumb navigation
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [{ level: 'teachers', label: 'Teachers' }];

    if (selectedTeacherId) {
      const teacher = teachers.find(t => t.id === selectedTeacherId);
      items.push({ level: 'semesters', label: teacher?.name || 'Teacher', value: selectedTeacherId });
    }
    if (selectedSemester !== null) {
      items.push({ level: 'categories', label: `Semester ${selectedSemester}`, value: String(selectedSemester) });
    }
    if (selectedCategory) {
      const categoryLabels = { 'materi': 'Materi', 'lesson-plan': 'Lesson Plan', 'task': 'Task/Assessment' };
      items.push({ level: 'weeks', label: categoryLabels[selectedCategory], value: selectedCategory });
    }
    if (selectedWeek !== null) {
      items.push({ level: 'details', label: `Week ${selectedWeek}`, value: String(selectedWeek) });
    }

    return items;
  }, [selectedTeacherId, selectedSemester, selectedCategory, selectedWeek, teachers]);

  // Navigation
  const goBack = () => {
    if (currentLevel === 'details') {
      setSelectedWeek(null);
      setCurrentLevel('weeks');
    } else if (currentLevel === 'weeks') {
      setSelectedCategory(null);
      setCurrentLevel('categories');
    } else if (currentLevel === 'categories') {
      setSelectedSemester(null);
      setCurrentLevel('semesters');
    } else if (currentLevel === 'semesters') {
      setSelectedTeacherId(null);
      setCurrentLevel('teachers');
    }
  };

  const navigateToLevel = (level: ViewLevel) => {
    setCurrentLevel(level);
    if (level === 'teachers') {
      setSelectedTeacherId(null);
      setSelectedSemester(null);
      setSelectedCategory(null);
      setSelectedWeek(null);
    } else if (level === 'semesters') {
      setSelectedSemester(null);
      setSelectedCategory(null);
      setSelectedWeek(null);
    } else if (level === 'categories') {
      setSelectedCategory(null);
      setSelectedWeek(null);
    } else if (level === 'weeks') {
      setSelectedWeek(null);
    }
  };

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown Teacher';

  const formatDateRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', options)}`;
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return 'File';
    }
  };

  // Show loading only when teachers list is loading
  if (teachersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500 text-sm">Loading teachers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Header - Compact */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            Class Schedule
          </h2>
          <p className="text-gray-500 text-xs">
            Browse by teacher, semester, and content type
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-1.5 text-center">
            <p className="text-lg font-bold text-blue-600">{teachers.length}</p>
            <p className="text-[9px] text-blue-500 uppercase font-medium">Teachers</p>
          </div>
        </div>
      </div>

      {/* Breadcrumb - Compact */}
      <div className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg p-2 border">
        {currentLevel !== 'teachers' && (
          <button onClick={goBack} className="p-1 hover:bg-gray-200 rounded transition-colors mr-1">
            <ArrowLeft className="w-3.5 h-3.5 text-gray-600" />
          </button>
        )}
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
            <button
              onClick={() => navigateToLevel(crumb.level)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                index === breadcrumbs.length - 1
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <Card className="!p-0 overflow-hidden">
        {/* Teachers List */}
        {currentLevel === 'teachers' && (
          <div>
            {/* Search Input - Compact */}
            <div className="p-2.5 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama guru..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-[10px] text-gray-500 mt-1.5">
                  Menampilkan {filteredTeachers.length} dari {teachers.length} guru
                </p>
              )}
            </div>
            {/* Teachers Grid - 3 columns */}
            <div className="p-3 max-h-[480px] overflow-y-auto">
              {filteredTeachers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs">{searchQuery ? `Tidak ada guru dengan nama "${searchQuery}"` : 'No teachers found'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredTeachers.map(teacher => (
                    <button
                      key={teacher.id}
                      onClick={() => {
                        setSelectedTeacherId(teacher.id);
                        setCurrentLevel('semesters');
                      }}
                      className="p-2.5 flex items-center gap-2.5 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-lg transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {teacher.name}
                        </h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Semesters View */}
        {currentLevel === 'semesters' && selectedTeacherId && (
          <div className="p-4">
            {/* Loading State */}
            {(sessionsLoading || testsLoading) ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500 text-sm">Loading data...</span>
              </div>
            ) : (
              <>
                {/* Academic Year Header - Compact */}
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm">
                    <School className="w-4 h-4" />
                    <span className="text-sm font-bold">Tahun Ajaran {currentAcademicYear}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2].map(semester => {
                    const semSessions = sessionsBySemester[semester as 1 | 2] || [];
                    const semTests = testsBySemester[semester as 1 | 2] || [];
                    const materiCount = semSessions.filter(s => s.materials && s.materials.length > 0).length;
                    const dateRange = semester === 1 ? 'Juli - Desember' : 'Januari - Juni';

                    return (
                      <button
                        key={semester}
                        onClick={() => {
                          setSelectedSemester(semester);
                          setCurrentLevel('categories');
                        }}
                        className={`group bg-gradient-to-br ${
                          semester === 1
                            ? 'from-emerald-50 to-teal-50 border-emerald-100 hover:border-emerald-300'
                            : 'from-purple-50 to-pink-50 border-purple-100 hover:border-purple-300'
                        } border-2 rounded-lg p-4 text-left hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-lg transition-colors ${
                            semester === 1 ? 'bg-emerald-100 group-hover:bg-emerald-200' : 'bg-purple-100 group-hover:bg-purple-200'
                          }`}>
                            <GraduationCap className={`w-5 h-5 ${semester === 1 ? 'text-emerald-600' : 'text-purple-600'}`} />
                          </div>
                          <ChevronRight className={`w-4 h-4 ${semester === 1 ? 'text-emerald-400' : 'text-purple-400'} group-hover:translate-x-0.5 transition-transform`} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mt-2">Semester {semester}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{dateRange}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded-full text-gray-600 border">
                            <Paperclip className="w-2.5 h-2.5 inline mr-0.5" />{materiCount} materi
                          </span>
                          <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded-full text-gray-600 border">
                            <ClipboardList className="w-2.5 h-2.5 inline mr-0.5" />{semSessions.length} plans
                          </span>
                          <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded-full text-gray-600 border">
                            <FileCheck className="w-2.5 h-2.5 inline mr-0.5" />{semTests.length} tasks
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Categories View - Compact */}
        {currentLevel === 'categories' && selectedSemester !== null && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Materi */}
              <button
                onClick={() => {
                  setSelectedCategory('materi');
                  setCurrentLevel('weeks');
                }}
                className="group bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-100 rounded-lg p-3 text-left hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Paperclip className="w-5 h-5 text-orange-600" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-2">Materi</h3>
                <p className="text-[10px] text-gray-500">File lampiran</p>
                <div className="mt-2">
                  <span className="text-xs font-semibold text-orange-600">
                    {categoryData.sessions.filter(s => s.materials && s.materials.length > 0).length || sessionsBySemester[selectedSemester as 1|2]?.filter(s => s.materials && s.materials.length > 0).length || 0} files
                  </span>
                </div>
              </button>

              {/* Lesson Plan */}
              <button
                onClick={() => {
                  setSelectedCategory('lesson-plan');
                  setCurrentLevel('weeks');
                }}
                className="group bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 rounded-lg p-3 text-left hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-2">Lesson Plan</h3>
                <p className="text-[10px] text-gray-500">Rencana pembelajaran</p>
                <div className="mt-2">
                  <span className="text-xs font-semibold text-blue-600">
                    {sessionsBySemester[selectedSemester as 1|2]?.length || 0} plans
                  </span>
                </div>
              </button>

              {/* Task/Assessment */}
              <button
                onClick={() => {
                  setSelectedCategory('task');
                  setCurrentLevel('weeks');
                }}
                className="group bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-100 rounded-lg p-3 text-left hover:border-violet-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-violet-100 rounded-lg group-hover:bg-violet-200 transition-colors">
                    <FileCheck className="w-5 h-5 text-violet-600" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-2">Task/Assessment</h3>
                <p className="text-[10px] text-gray-500">Quiz, UTS, UAS</p>
                <div className="mt-2">
                  <span className="text-xs font-semibold text-violet-600">
                    {testsBySemester[selectedSemester as 1|2]?.length || 0} tasks
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Weeks View - Compact */}
        {currentLevel === 'weeks' && selectedCategory && (
          <div className="p-4">
            {weeksData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-xs">No data found for this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {weeksData.map(weekData => (
                  <button
                    key={weekData.week}
                    onClick={() => {
                      setSelectedWeek(weekData.week);
                      setCurrentLevel('details');
                    }}
                    className="group bg-white border border-gray-200 rounded-lg p-2.5 text-left hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1.5 bg-blue-50 rounded group-hover:bg-blue-100 transition-colors">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-all" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900">Week {weekData.week}</h4>
                    <p className="text-[9px] text-gray-400">
                      {formatDateRange(weekData.dateRange.start, weekData.dateRange.end)}
                    </p>
                    <div className="mt-1.5">
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                        {weekData.count} items
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Details View - Compact */}
        {currentLevel === 'details' && selectedWeek !== null && (
          <div>
            {/* Header */}
            <div className={`p-3 text-white ${
              selectedCategory === 'materi' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
              selectedCategory === 'lesson-plan' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              'bg-gradient-to-r from-violet-500 to-purple-500'
            }`}>
              <div className="flex items-center gap-2">
                {selectedCategory === 'materi' && <Paperclip className="w-4 h-4" />}
                {selectedCategory === 'lesson-plan' && <ClipboardList className="w-4 h-4" />}
                {selectedCategory === 'task' && <FileCheck className="w-4 h-4" />}
                <div>
                  <h3 className="text-sm font-bold">Week {selectedWeek}</h3>
                  <p className="text-white/80 text-xs">
                    {weeksData.find(w => w.week === selectedWeek) &&
                      formatDateRange(
                        weeksData.find(w => w.week === selectedWeek)!.dateRange.start,
                        weeksData.find(w => w.week === selectedWeek)!.dateRange.end
                      )
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Materi List */}
            {selectedCategory === 'materi' && (
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {weekItems.sessions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Paperclip className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                    <p className="text-xs">No materials found</p>
                  </div>
                ) : (
                  weekItems.sessions.map(session => (
                    <div key={session.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{session.topic}</h4>
                          <p className="text-[10px] text-gray-500">
                            {new Date(session.dateTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {' • '}{session.location}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {session.materials?.map((material, idx) => (
                          <a
                            key={idx}
                            href={material}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 p-2 bg-orange-50 rounded hover:bg-orange-100 transition-colors group"
                          >
                            <FileText className="w-3.5 h-3.5 text-orange-600" />
                            <span className="text-xs text-gray-700 truncate flex-1">{getFileNameFromUrl(material)}</span>
                            <Download className="w-3 h-3 text-orange-500" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Lesson Plan List */}
            {selectedCategory === 'lesson-plan' && (
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {weekItems.sessions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <ClipboardList className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                    <p className="text-xs">No lesson plans found</p>
                  </div>
                ) : (
                  weekItems.sessions.map(session => {
                    const primarySkill = session.skillCategories[0] || SkillCategory.GRAMMAR;
                    const Icon = SKILL_ICONS[primarySkill] || BookOpen;

                    return (
                      <div
                        key={session.id}
                        className="px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-10 text-center flex-shrink-0">
                            <div className="text-sm font-bold text-gray-900">
                              {new Date(session.dateTime).getDate()}
                            </div>
                            <div className="text-[9px] text-gray-500 uppercase">
                              {new Date(session.dateTime).toLocaleDateString('id-ID', { month: 'short' })}
                            </div>
                          </div>
                          <div className="w-px h-10 bg-gray-200 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 mb-0.5">
                              <span className="text-[9px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                                <Icon className="w-2.5 h-2.5" /> {session.skillCategories.join(', ')}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${LEVEL_COLORS[session.difficultyLevel]}`}>
                                {session.difficultyLevel}
                              </span>
                            </div>
                            <h4 className="text-xs font-medium text-gray-900 truncate">{session.topic}</h4>
                            <p className="text-[10px] text-gray-500">
                              <MapPin className="w-2.5 h-2.5 inline mr-0.5" />{session.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateLessonPlanPDF(session, getTeacherName(selectedTeacherId!));
                              }}
                              className="px-2 py-1 text-[10px] font-medium text-green-600 hover:bg-green-50 rounded flex items-center gap-0.5"
                              title="Download PDF"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button className="px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 rounded flex items-center gap-0.5">
                              <Eye className="w-3 h-3" /> View
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Task/Assessment List */}
            {selectedCategory === 'task' && (
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {weekItems.tests.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <FileCheck className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                    <p className="text-xs">No tasks found</p>
                  </div>
                ) : (
                  weekItems.tests.map(test => (
                    <div
                      key={test.id}
                      className="px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTest(test)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-10 text-center flex-shrink-0">
                          <div className="text-sm font-bold text-gray-900">
                            {new Date(test.date_time).getDate()}
                          </div>
                          <div className="text-[9px] text-gray-500 uppercase">
                            {new Date(test.date_time).toLocaleDateString('id-ID', { month: 'short' })}
                          </div>
                        </div>
                        <div className="w-px h-10 bg-gray-200 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 mb-0.5">
                            <span className="text-[9px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded uppercase">
                              {test.test_type}
                            </span>
                            <span className="text-[9px] font-medium text-gray-500">
                              {test.duration_minutes} min
                            </span>
                          </div>
                          <h4 className="text-xs font-medium text-gray-900 truncate">{test.title}</h4>
                          <p className="text-[10px] text-gray-500">
                            <MapPin className="w-2.5 h-2.5 inline mr-0.5" />{test.location} - {test.class_name}
                          </p>
                        </div>
                        <button className="px-2 py-1 text-[10px] font-medium text-violet-600 hover:bg-violet-50 rounded flex items-center gap-0.5">
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Session Detail Modal - Compact */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedSession(null)}>
          <Card className="w-full max-w-xl !p-0 overflow-hidden max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 text-white sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Lesson Plan Details</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => generateLessonPlanPDF(selectedSession, getTeacherName(selectedTeacherId!))}
                    className="p-1.5 hover:bg-white/20 rounded flex items-center gap-1 text-xs"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button onClick={() => setSelectedSession(null)} className="p-0.5 hover:bg-white/20 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-2.5">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Lesson Topic</p>
                <p className="font-semibold text-gray-900 text-sm">{selectedSession.topic}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Date & Time</p>
                  <p className="text-xs text-gray-700">
                    {new Date(selectedSession.dateTime).toLocaleDateString('id-ID', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedSession.dateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Location</p>
                  <p className="text-xs text-gray-700">{selectedSession.location}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Skills</p>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {selectedSession.skillCategories.map(skill => (
                      <span key={skill} className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{skill}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Level</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${LEVEL_COLORS[selectedSession.difficultyLevel]}`}>
                    {selectedSession.difficultyLevel}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">CEFR Level</p>
                <span className="text-xs text-blue-600 font-medium">
                  {selectedSession.cefrLevel || <span className="text-gray-400 italic">-</span>}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Learning Objectives</p>
                {selectedSession.learningObjectives ? (
                  <p className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded">{selectedSession.learningObjectives}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">-</p>
                )}
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Vocabulary</p>
                {(selectedSession.vocabularyVerb || selectedSession.vocabularyNoun || selectedSession.vocabularyAdjective) ? (
                  <div className="bg-gray-50 p-2 rounded space-y-1">
                    {selectedSession.vocabularyVerb && (
                      <div>
                        <span className="text-[9px] font-medium text-gray-500 uppercase">Verb: </span>
                        <span className="text-xs text-gray-700">{selectedSession.vocabularyVerb}</span>
                      </div>
                    )}
                    {selectedSession.vocabularyNoun && (
                      <div>
                        <span className="text-[9px] font-medium text-gray-500 uppercase">Noun: </span>
                        <span className="text-xs text-gray-700">{selectedSession.vocabularyNoun}</span>
                      </div>
                    )}
                    {selectedSession.vocabularyAdjective && (
                      <div>
                        <span className="text-[9px] font-medium text-gray-500 uppercase">Adjective: </span>
                        <span className="text-xs text-gray-700">{selectedSession.vocabularyAdjective}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">-</p>
                )}
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Lesson Activity / Description</p>
                {selectedSession.description ? (
                  <p className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded">{selectedSession.description}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">-</p>
                )}
              </div>
              {selectedSession.materials && selectedSession.materials.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Materials</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                    {selectedSession.materials.map((material, index) => (
                      <a
                        key={index}
                        href={material}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 p-1.5 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] text-blue-700 truncate flex-1">{getFileNameFromUrl(material)}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-blue-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Test Detail Modal - Compact */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedTest(null)}>
          <Card className="w-full max-w-md !p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-3 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Task/Assessment Details</h3>
                <button onClick={() => setSelectedTest(null)} className="p-0.5 hover:bg-white/20 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-2.5">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Title</p>
                <p className="text-sm font-medium text-gray-900">{selectedTest.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Type</p>
                  <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">{selectedTest.test_type}</span>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Duration</p>
                  <p className="text-xs text-gray-700">{selectedTest.duration_minutes} min</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Date & Time</p>
                  <p className="text-xs text-gray-700">
                    {new Date(selectedTest.date_time).toLocaleDateString('id-ID', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedTest.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Location</p>
                  <p className="text-xs text-gray-700">{selectedTest.location}</p>
                  <p className="text-xs text-gray-500">{selectedTest.class_name}</p>
                </div>
              </div>
              {selectedTest.description && (
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Description</p>
                  <p className="text-xs text-gray-700">{selectedTest.description}</p>
                </div>
              )}
              {selectedTest.materials && selectedTest.materials.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Materials</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedTest.materials.map((material, index) => (
                      <a
                        key={index}
                        href={material}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-violet-600 hover:underline flex items-center gap-0.5"
                      >
                        <FileText className="w-2.5 h-2.5" /> Material {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagerV2;

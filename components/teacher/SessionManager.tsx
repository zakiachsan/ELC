
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../Card';
import { Button } from '../Button';
import { LEVEL_COLORS } from '../../constants';
import { useSessions } from '../../hooks/useSessions';
import { useLocations, useStudents, useClasses, useStudentsBySchoolAndClass } from '../../hooks/useProfiles';
import { useReports } from '../../hooks/useReports';
import { useHomeworks } from '../../hooks/useHomeworks';
import { useAuth } from '../../contexts/AuthContext';
import { ClassSession, StudentSessionReport, CEFRLevel, Homework, SkillCategory, DifficultyLevel, User, ClassType } from '../../types';
import { Clock, MapPin, Calendar, CheckCircle, FileText, Upload, Trash2, Download, ShieldCheck, ShieldAlert, UserCheck, PenLine, Save, X, BookOpen, ClipboardList, Award, Mic, FileEdit, Plus, School, ChevronRight, GraduationCap, Loader2, File, Globe, Copy, AlignLeft } from 'lucide-react';
import { uploadFile, isAllowedFileType, formatFileSize, UploadResult } from '../../lib/storage';
import { SKILL_ICONS } from '../student/StudentView';

// Type for multi-class schedule entry
interface MultiClassScheduleEntry {
  classId: string;
  startTime: string;
  endTime: string;
}

// Helper function to get timezone offset string (e.g., "+07:00" for WIB)
const getTimezoneOffset = (): string => {
  const offset = new Date().getTimezoneOffset();
  const sign = offset <= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
};

export const SessionManager: React.FC = () => {
  const { schoolId, classId } = useParams<{ schoolId?: string; classId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentTeacher } = useAuth();

  // Get session ID from URL params (for deep linking from dashboard)
  const sessionIdFromUrl = searchParams.get('session');

  // Derive selected school and class from URL params
  const selectedSchool = schoolId ? decodeURIComponent(schoolId) : null;
  const selectedClass = classId ? decodeURIComponent(classId) : null;

  // Only load heavy data when a class is selected (detail view)
  const isDetailView = !!(selectedSchool && selectedClass);

  // Stage 1: Always load locations (for school/class selection)
  const { locations: locationsData, loading: locationsLoading } = useLocations();

  // Get location ID for the selected school (needed for class filtering)
  const selectedLocationId = selectedSchool
    ? locationsData.find(l => l.name === selectedSchool)?.id
    : undefined;

  // Stage 1.5: Load classes for the selected school (to filter teacher's assigned classes)
  const { classes: locationClasses, loading: classesLoading } = useClasses(selectedLocationId);

  // Stage 2: Only load sessions/students/reports when viewing class details
  // OPTIMIZED: Filter at database level instead of loading all data
  const { sessions: sessionsData, loading: sessionsLoading, error: sessionsError, createSession, updateSession, deleteSession } = useSessions({
    schoolName: selectedSchool || undefined,
    className: selectedClass || undefined,
    enabled: isDetailView
  });
  const { reports: reportsData, loading: reportsLoading, createReport, updateReport } = useReports({ enabled: isDetailView });
  const { homeworks: homeworksData, loading: homeworksLoading, createHomework } = useHomeworks({ enabled: isDetailView });
  // OPTIMIZED: Load only students for selected school and class
  const { students: studentsData, loading: studentsLoading } = useStudentsBySchoolAndClass(selectedLocationId, selectedClass || undefined);

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMultiClassModal, setShowMultiClassModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editSessionForm, setEditSessionForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    topic: '',
    skillCategories: [] as SkillCategory[],
    description: '',
    materials: [] as string[]
  });
  const [editSessionFiles, setEditSessionFiles] = useState<UploadResult[]>([]);
  const [editSessionUploading, setEditSessionUploading] = useState(false);
  const [editSessionUploadError, setEditSessionUploadError] = useState<string | null>(null);
  const editSessionFileInputRef = useRef<HTMLInputElement>(null);
  const [detailTab, setDetailTab] = useState<'students' | 'materials'>('materials');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-class schedule form state
  const [multiClassDates, setMultiClassDates] = useState<string[]>([]);
  // tempDate state removed - dates are now auto-added on selection
  const [multiClassEntries, setMultiClassEntries] = useState<MultiClassScheduleEntry[]>([]);
  const [multiClassTopic, setMultiClassTopic] = useState('');
  const [multiClassSkills, setMultiClassSkills] = useState<SkillCategory[]>([]);
  // multiClassDifficulty removed - no longer needed
  // multiClassType removed - auto-detected from selected class
  const [multiClassDescription, setMultiClassDescription] = useState('');
  const [multiClassFiles, setMultiClassFiles] = useState<UploadResult[]>([]);
  const [multiClassUploading, setMultiClassUploading] = useState(false);
  const [multiClassUploadError, setMultiClassUploadError] = useState<string | null>(null);
  const multiClassFileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom calendar picker state
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Navigation helpers
  const navigateToSchool = (schoolName: string) => {
    navigate(`/teacher/schedule/${encodeURIComponent(schoolName)}`);
  };

  const navigateToClass = (className: string) => {
    if (selectedSchool) {
      navigate(`/teacher/schedule/${encodeURIComponent(selectedSchool)}/${encodeURIComponent(className)}`);
    }
  };

  const navigateBack = () => {
    if (selectedClass) {
      navigate(`/teacher/schedule/${encodeURIComponent(selectedSchool!)}`);
    } else if (selectedSchool) {
      navigate('/teacher/schedule');
    }
  };

  // Build reports by session from database - use local state for now
  const [reports, setReports] = useState<Record<string, StudentSessionReport[]>>({});
  const [homeworks, setHomeworks] = useState<Homework[]>(homeworksData || []);

  // Close calendar picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendarPicker(false);
      }
    };
    if (showCalendarPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendarPicker]);

  // Sync homeworks from database
  useEffect(() => {
    if (homeworksData) {
      setHomeworks(homeworksData.map(h => ({
        id: h.id,
        sessionId: h.session_id,
        studentId: h.student_id,
        title: h.title,
        description: h.description || '',
        dueDate: h.due_date,
        assignedDate: h.assigned_date,
        status: h.status as 'PENDING' | 'SUBMITTED' | 'GRADED',
        submissionUrl: h.submission_url || undefined,
        score: h.score ?? undefined,
        feedback: h.feedback || undefined
      })));
    }
  }, [homeworksData]);

  // Sync reports from database
  useEffect(() => {
    if (reportsData && reportsData.length > 0) {
      const newReports: Record<string, StudentSessionReport[]> = {};
      reportsData.forEach(r => {
        if (!newReports[r.session_id]) {
          newReports[r.session_id] = [];
        }
        newReports[r.session_id].push({
          studentId: r.student_id,
          studentName: r.student_name || 'Unknown',
          attendanceStatus: 'PRESENT',
          writtenScore: r.written_score || undefined,
          oralScore: r.oral_score || undefined,
          cefrLevel: r.cefr_level as CEFRLevel || undefined,
          teacherNotes: r.notes || undefined,
          isVerified: r.is_verified,
        });
      });
      setReports(newReports);
    }
  }, [reportsData]);

  // Map sessions from database
  const sessions: ClassSession[] = sessionsData.map(s => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategories: (Array.isArray(s.skill_category) ? s.skill_category : [s.skill_category]) as SkillCategory[],
    difficultyLevel: s.difficulty_level as DifficultyLevel,
    materials: s.materials || [],
  }));

  // Auto-select session from URL param (for deep linking from dashboard)
  useEffect(() => {
    if (sessionIdFromUrl && sessions.length > 0 && !selectedSession) {
      const sessionToSelect = sessions.find(s => s.id === sessionIdFromUrl);
      if (sessionToSelect) {
        setSelectedSession(sessionToSelect);
      }
    }
  }, [sessionIdFromUrl, sessions, selectedSession]);

  // Map schools/locations - filter to only show teacher's assigned schools
  const schools = locationsData
    .filter(l => {
      // If teacher has assigned locations (array), only show those schools
      if (currentTeacher?.assignedLocationIds && currentTeacher.assignedLocationIds.length > 0) {
        return currentTeacher.assignedLocationIds.includes(l.id);
      }
      // Fallback to single location if set
      if (currentTeacher?.assignedLocationId) {
        return l.id === currentTeacher.assignedLocationId;
      }
      // If no assignment, show all schools (flexible teacher)
      return true;
    })
    .map(l => ({
      id: l.id,
      name: l.name,
      level: l.level || null,
    }));

  // Calendar helper functions
  const getCalendarDays = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDateForInput = (date: Date): string => {
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateSelected = (date: Date): boolean => {
    return multiClassDates.includes(formatDateForInput(date));
  };

  const toggleDate = (date: Date) => {
    const dateStr = formatDateForInput(date);
    if (multiClassDates.includes(dateStr)) {
      setMultiClassDates(multiClassDates.filter(d => d !== dateStr));
    } else {
      setMultiClassDates([...multiClassDates, dateStr].sort());
    }
  };

  // Type for available class with class_type info
  type AvailableClass = { name: string; classType: string | null };

  // Helper function to sort classes with inconsistent naming (handles "KELAS 2 B" vs "KELAS 2A")
  const sortClasses = (classes: AvailableClass[]): AvailableClass[] => {
    return [...classes].sort((a, b) => {
      // Extract grade number and section from class name
      const parseClassName = (name: string): { prefix: string; grade: number; section: string } => {
        const upperName = name.toUpperCase().trim();
        
        // Handle TK/KB classes - put them at the beginning
        if (upperName.includes('TK') || upperName.includes('KB')) {
          // Extract any number/letter after TK/KB for sub-sorting
          const match = upperName.match(/(?:TK|KB)[\s-]*([A-Z])?[\s-]*(\d)?/i);
          const section = match?.[1] || '';
          const num = match?.[2] || '0';
          return { prefix: 'A', grade: 0, section: section + num };
        }
        
        // Pattern: "KELAS 2 B", "KELAS 2A", "2A", "2 B", "1 BILINGUAL", etc.
        // Extract the grade number
        const gradeMatch = upperName.match(/(\d+)/);
        const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 999;
        
        // Extract section letter (last letter that follows the number)
        // Handle patterns like "2 B", "2A", "KELAS 2D", "1 BILINGUAL"
        let section = '';
        
        // Check if it's a bilingual class (no section letter)
        if (upperName.includes('BILINGUAL')) {
          section = 'ZZBILINGUAL'; // Put bilingual at end of grade group
        } else {
          // Find section letter - look for single letter after the grade number
          const afterNumber = upperName.substring(upperName.indexOf(String(grade)) + String(grade).length);
          const sectionMatch = afterNumber.match(/^\s*([A-Z])\b/i);
          section = sectionMatch ? sectionMatch[1].toUpperCase() : '';
        }
        
        return { prefix: 'B', grade, section };
      };
      
      const parsedA = parseClassName(a.name);
      const parsedB = parseClassName(b.name);
      
      // Compare prefix first (TK/KB before regular classes)
      if (parsedA.prefix !== parsedB.prefix) {
        return parsedA.prefix.localeCompare(parsedB.prefix);
      }
      
      // Then compare by grade number
      if (parsedA.grade !== parsedB.grade) {
        return parsedA.grade - parsedB.grade;
      }
      
      // Finally compare by section letter
      return parsedA.section.localeCompare(parsedB.section);
    });
  };

  // Get teacher's assigned classes filtered by what's available in the selected school
  const getAvailableClasses = (): AvailableClass[] => {
    // Get class names that exist in the selected location from database
    const locationClassNames = locationClasses.map(c => c.name);

    // If teacher has assigned classes, filter to only show ones in this location
    if (currentTeacher?.assignedClasses && currentTeacher.assignedClasses.length > 0) {
      // Filter teacher's classes to only show ones that exist in this school's location
      const filteredClasses = currentTeacher.assignedClasses.filter(teacherClass =>
        locationClassNames.includes(teacherClass)
      );
      // If teacher has classes for this location, return them with class_type
      if (filteredClasses.length > 0) {
        return sortClasses(filteredClasses.map(className => {
          const classData = locationClasses.find(c => c.name === className);
          return { name: className, classType: classData?.class_type || null };
        }));
      }
      // If no matching classes, fall back to location classes
      if (locationClassNames.length > 0) {
        return sortClasses(locationClasses.map(c => ({ name: c.name, classType: c.class_type })));
      }
    }

    // If location has classes in database, use those
    if (locationClassNames.length > 0) {
      return sortClasses(locationClasses.map(c => ({ name: c.name, classType: c.class_type })));
    }

    // Otherwise, generate based on selected school's level
    const selectedSchoolData = schools.find(s => s.name === selectedSchool);
    const level = selectedSchoolData?.level;
    const classes: AvailableClass[] = [];
    switch (level?.toUpperCase()) {
      case 'KINDERGARTEN':
        ['TK-A', 'TK-B'].forEach(c => {
          for (let i = 1; i <= 3; i++) classes.push({ name: `${c}.${i}`, classType: null });
        });
        break;
      case 'PRIMARY':
      case 'ELEMENTARY':
        for (let grade = 1; grade <= 6; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push({ name: `${grade}.${section}`, classType: null });
          }
        }
        break;
      case 'JUNIOR':
        for (let grade = 7; grade <= 9; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push({ name: `${grade}.${section}`, classType: null });
          }
        }
        break;
      case 'SENIOR':
      case 'HIGH':
        for (let grade = 10; grade <= 12; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push({ name: `${grade}.${section}`, classType: null });
          }
        }
        break;
      default:
        // General - show common classes
        for (let grade = 1; grade <= 12; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push({ name: `${grade}.${section}`, classType: null });
          }
        }
    }
    return classes;
  };

  const availableClasses = getAvailableClasses();

  // Extract unique time presets from teacher's existing sessions
  const getTimePresets = (): { startTime: string; endTime: string; label: string }[] => {
    const presets: Map<string, { startTime: string; endTime: string; count: number }> = new Map();
    
    for (const session of sessionsData) {
      if (!session.date_time) continue;
      
      // Parse the datetime to extract time
      const dateObj = new Date(session.date_time);
      const startHour = dateObj.getHours().toString().padStart(2, '0');
      const startMin = dateObj.getMinutes().toString().padStart(2, '0');
      const startTime = `${startHour}:${startMin}`;
      
      // Estimate end time (assume 45 min default if not stored)
      // For now, use common class durations: 45 min
      const endDate = new Date(dateObj.getTime() + 45 * 60 * 1000);
      const endHour = endDate.getHours().toString().padStart(2, '0');
      const endMin = endDate.getMinutes().toString().padStart(2, '0');
      const endTime = `${endHour}:${endMin}`;
      
      const key = `${startTime}-${endTime}`;
      const existing = presets.get(key);
      if (existing) {
        existing.count++;
      } else {
        presets.set(key, { startTime, endTime, count: 1 });
      }
    }
    
    // Sort by frequency (most used first) and convert to array
    return Array.from(presets.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5) // Limit to top 5 presets
      .map(([_, preset]) => ({
        startTime: preset.startTime,
        endTime: preset.endTime,
        label: `${preset.startTime} - ${preset.endTime}`
      }));
  };

  const timePresets = getTimePresets();

  // Map students from database - already filtered by school and class at database level
  const enrolledStudents: User[] = studentsData.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone || undefined,
    address: s.address || undefined,
    role: s.role as any,
    status: s.status as 'ACTIVE' | 'INACTIVE',
    branch: s.branch || undefined,
    assignedLocationId: s.assigned_location_id || undefined,
  }));

  // NOTE: Removed auto-select for single school to match StudentGrades/TestManager UX
  // Teacher must always select school manually

  // Form states for student scores
  const [editForm, setEditForm] = useState<{
    writtenScore: string;
    oralScore: string;
    cefrLevel: CEFRLevel | '';
    teacherNotes: string;
  }>({ writtenScore: '', oralScore: '', cefrLevel: '', teacherNotes: '' });

  // Homework form
  const [hwForm, setHwForm] = useState({ title: '', description: '', dueDate: '' });

  // Create schedule form - supports multiple dates
  const [scheduleForm, setScheduleForm] = useState({
    dates: [] as string[],
    startTime: '',
    endTime: '',
    topic: '',
    skillCategories: [] as SkillCategory[],
    description: '',
    materials: [] as string[]
  });
  // newDate state removed - dates are now auto-added on selection

  // File upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const now = new Date();

  // Filter sessions by selected school and class
  // Sessions are already filtered at database level by school and class
  // Include sessions that are in progress (default 90 min duration)
  const getSessionEndTime = (session: any): Date => {
    const startTime = new Date(session.dateTime);
    return new Date(startTime.getTime() + (90 * 60 * 1000)); // Assume 90 min duration
  };
  
  const upcomingSessions = sessions.filter(s => getSessionEndTime(s) > now);
  const pastSessions = sessions.filter(s => getSessionEndTime(s) <= now);

  // Show loading spinner - only check heavy data loading when in detail view
  // Also check classesLoading when school is selected (for class selection view)
  const isLoading = locationsLoading || (selectedSchool && !selectedClass && classesLoading) || (isDetailView && (sessionsLoading || reportsLoading || homeworksLoading || studentsLoading));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">
          {isDetailView ? 'Loading sessions...' : selectedSchool ? 'Loading classes...' : 'Loading schools...'}
        </span>
      </div>
    );
  }

  if (sessionsError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading sessions: {sessionsError.message}
      </div>
    );
  }

  const cefrLevels = Object.values(CEFRLevel);
  const skillCategories = Object.values(SkillCategory);
  const difficultyLevels = Object.values(DifficultyLevel);

  const toggleVerify = (sessionId: string, studentId: string) => {
    const sessionReports = reports[sessionId] || [];
    const updated = sessionReports.map(r =>
        r.studentId === studentId ? { ...r, isVerified: !r.isVerified } : r
    );
    setReports({ ...reports, [sessionId]: updated });
  };

  const startEditStudent = (studentId: string, sessionId: string) => {
    const sessionReports = reports[sessionId] || [];
    const report = sessionReports.find(r => r.studentId === studentId);
    setEditForm({
      writtenScore: report?.writtenScore?.toString() || '',
      oralScore: report?.oralScore?.toString() || '',
      cefrLevel: report?.cefrLevel || '',
      teacherNotes: report?.teacherNotes || ''
    });
    setEditingStudent(studentId);
  };

  const saveStudentReport = (sessionId: string, studentId: string, studentName: string) => {
    const sessionReports = reports[sessionId] || [];
    const existingIdx = sessionReports.findIndex(r => r.studentId === studentId);

    const newReport: StudentSessionReport = {
      studentId,
      studentName,
      attendanceStatus: 'PRESENT',
      writtenScore: editForm.writtenScore ? parseInt(editForm.writtenScore) : undefined,
      oralScore: editForm.oralScore ? parseInt(editForm.oralScore) : undefined,
      cefrLevel: editForm.cefrLevel || undefined,
      teacherNotes: editForm.teacherNotes || undefined,
      isVerified: true
    };

    if (existingIdx >= 0) {
      sessionReports[existingIdx] = { ...sessionReports[existingIdx], ...newReport };
    } else {
      sessionReports.push(newReport);
    }

    setReports({ ...reports, [sessionId]: sessionReports });
    setEditingStudent(null);
    setEditForm({ writtenScore: '', oralScore: '', cefrLevel: '', teacherNotes: '' });
  };

  const addHomework = (sessionId: string) => {
    if (!hwForm.title || !hwForm.dueDate) {
      alert('Title and due date are required!');
      return;
    }
    const newHomeworks: Homework[] = enrolledStudents.map(student => ({
      id: `hw-${Date.now()}-${student.id}`,
      sessionId,
      studentId: student.id,
      title: hwForm.title,
      description: hwForm.description,
      dueDate: hwForm.dueDate,
      assignedDate: new Date().toISOString(),
      status: 'PENDING'
    }));
    setHomeworks([...homeworks, ...newHomeworks]);
    setHwForm({ title: '', description: '', dueDate: '' });
    setShowHomeworkModal(false);
  };

  // Handle delete schedule
  const handleDeleteSchedule = async () => {
    if (!selectedSession) return;

    setIsDeleting(true);
    try {
      await deleteSession(selectedSession.id);
      setShowDeleteModal(false);
      setSelectedSession(null);
      // Navigate back to list
      if (sessionIdFromUrl) {
        navigate(`/teacher/schedule/${encodeURIComponent(selectedSchool!)}/${encodeURIComponent(selectedClass!)}`, { replace: true });
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle update session
  const handleUpdateSession = async () => {
    if (!selectedSession) return;
    if (!editSessionForm.date || !editSessionForm.startTime || !editSessionForm.topic) {
      alert('Please fill in all required fields (date, time, topic)');
      return;
    }

    setIsSubmitting(true);
    try {
      const dateTime = `${editSessionForm.date}T${editSessionForm.startTime}:00${getTimezoneOffset()}`;
      
      // Combine existing materials with newly uploaded files
      const allMaterials = [
        ...editSessionForm.materials,
        ...editSessionFiles.map(f => f.url)
      ];
      
      await updateSession(selectedSession.id, {
        topic: editSessionForm.topic,
        date_time: dateTime,
        skill_category: editSessionForm.skillCategories.length > 0 ? editSessionForm.skillCategories : ['Grammar'],
        description: editSessionForm.description || null,
        materials: allMaterials,
      });

      // Update selected session locally
      setSelectedSession({
        ...selectedSession,
        topic: editSessionForm.topic,
        dateTime: dateTime,
        skillCategories: editSessionForm.skillCategories.length > 0 ? editSessionForm.skillCategories : [SkillCategory.GRAMMAR],
        description: editSessionForm.description || undefined,
        materials: allMaterials,
      });

      setShowEditSessionModal(false);
      setEditSessionFiles([]);
      alert('Schedule updated successfully!');
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // handleAddDate removed - dates are now auto-added on selection

  const handleRemoveDate = (dateToRemove: string) => {
    setScheduleForm({
      ...scheduleForm,
      dates: scheduleForm.dates.filter(d => d !== dateToRemove)
    });
  };

  // Calculate duration in hours
  const calculateDuration = () => {
    if (!scheduleForm.startTime || !scheduleForm.endTime) return null;
    const [startH, startM] = scheduleForm.startTime.split(':').map(Number);
    const [endH, endM] = scheduleForm.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = (endMinutes - startMinutes) / 60;
    return duration > 0 ? duration : null;
  };

  // Handle file selection and upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!isAllowedFileType(file)) {
          setUploadError(`File "${file.name}" is not supported. Use PDF, DOC, DOCX, PPT, PPTX, or images.`);
          continue;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`File "${file.name}" is too large. Maximum 10MB.`);
          continue;
        }

        // Upload file
        const result = await uploadFile(file, 'sessions');
        setUploadedFiles(prev => [...prev, result]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle file selection for multi-class modal
  const handleMultiClassFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setMultiClassUploadError(null);
    setMultiClassUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!isAllowedFileType(file)) {
          setMultiClassUploadError(`File "${file.name}" is not supported. Use PDF, DOC, DOCX, PPT, PPTX, or images.`);
          continue;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setMultiClassUploadError(`File "${file.name}" is too large. Maximum 10MB.`);
          continue;
        }

        // Upload file
        const result = await uploadFile(file, 'sessions');
        setMultiClassFiles(prev => [...prev, result]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMultiClassUploadError('Gagal mengupload file. Silakan coba lagi.');
    } finally {
      setMultiClassUploading(false);
      // Reset input
      if (multiClassFileInputRef.current) {
        multiClassFileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded file for multi-class modal
  const handleRemoveMultiClassFile = (index: number) => {
    setMultiClassFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle file upload for edit session modal
  const handleEditSessionFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setEditSessionUploadError(null);
    setEditSessionUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!isAllowedFileType(file)) {
          setEditSessionUploadError(`File "${file.name}" is not supported. Use PDF, DOC, DOCX, PPT, PPTX, or images.`);
          continue;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setEditSessionUploadError(`File "${file.name}" is too large. Maximum 10MB.`);
          continue;
        }

        // Upload file
        const result = await uploadFile(file, 'sessions');
        setEditSessionFiles(prev => [...prev, result]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setEditSessionUploadError('Failed to upload file. Please try again.');
    } finally {
      setEditSessionUploading(false);
      // Reset input
      if (editSessionFileInputRef.current) {
        editSessionFileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded file for edit session modal
  const handleRemoveEditSessionFile = (index: number) => {
    setEditSessionFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Remove existing material from edit session form
  const handleRemoveExistingMaterial = (index: number) => {
    setEditSessionForm(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handleCreateSchedule = async () => {
    if (scheduleForm.dates.length === 0 || !scheduleForm.startTime || !scheduleForm.endTime || !scheduleForm.topic || !selectedSchool) {
      alert('Please complete all required fields!');
      return;
    }

    const duration = calculateDuration();
    if (!duration || duration <= 0) {
      alert('End time must be after start time!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Collect material URLs from uploaded files
      const materialUrls = uploadedFiles.map(f => f.url);

      // Create a session for each selected date
      for (const date of scheduleForm.dates) {
        const dateTime = `${date}T${scheduleForm.startTime}:00${getTimezoneOffset()}`;
        await createSession({
          teacher_id: currentTeacher?.id || '',
          topic: scheduleForm.topic,
          date_time: dateTime,
          location: `${selectedSchool} - ${selectedClass}`,
          skill_category: scheduleForm.skillCategories.length > 0 ? scheduleForm.skillCategories : ['Grammar'],
          difficulty_level: 'Elementary', // Default value - field removed from UI
          description: scheduleForm.description || null,
          materials: materialUrls,
        });
      }

      alert(`${scheduleForm.dates.length} schedule(s) added successfully!`);
      setShowCreateModal(false);
      setScheduleForm({
        dates: [],
        startTime: '',
        endTime: '',
        topic: '',
        skillCategories: [],
        description: '',
        materials: []
      });
      setUploadedFiles([]);
      setUploadError(null);
    } catch (error) {
      console.error('Error creating sessions:', error);
      alert('Failed to save schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setScheduleForm({
      dates: [],
      startTime: '',
      endTime: '',
      topic: '',
      skillCategory: '',
      difficultyLevel: '',
      description: '',
      materials: []
    });
    setUploadedFiles([]);
    setUploadError(null);
  };

  // --- SCHOOL SELECTION VIEW ---
  if (!selectedSchool) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600" /> Select School
          </h2>
          <p className="text-xs text-gray-500">Select a school first to manage class schedules.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {schools.map((school) => (
            <Card
              key={school.id}
              className="!p-4 cursor-pointer hover:border-blue-400 transition-all group"
              onClick={() => navigateToSchool(school.name)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <School className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600">{school.name}</h3>
                  <p className="text-[10px] text-gray-500">{school.level ? `Level: ${school.level}` : 'General'}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
              </div>
            </Card>
          ))}
          {/* Online option */}
          <Card
            className="!p-4 cursor-pointer hover:border-purple-400 transition-all group"
            onClick={() => navigate('/teacher/schedule/Online%20(Zoom)/Online')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600">Online (Zoom)</h3>
                <p className="text-[10px] text-gray-500">Virtual Class</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- CLASS SELECTION VIEW ---
  if (!selectedClass) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Header Row */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/teacher/schedule')} className="text-xs py-1.5 px-3 shrink-0">
              Back
            </Button>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-orange-600 shrink-0" /> 
                <span className="truncate">Select Class</span>
              </h2>
              <p className="text-xs text-gray-500 truncate">{selectedSchool}</p>
            </div>
          </div>
          {/* Action Button */}
          <Button onClick={() => setShowMultiClassModal(true)} className="w-full sm:w-auto text-xs py-2 px-4 flex items-center justify-center gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Multi-Class Schedule</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {availableClasses.map((cls) => {
            // Extract short label for icon (e.g., "KELAS 1 A" -> "1A", "1.1" -> "1")
            const shortLabel = cls.name.replace(/^KELAS\s*/i, '').replace(/\s+/g, '').split('.')[0];
            // Determine if bilingual (check for various formats)
            const isBilingual = cls.classType?.toLowerCase().includes('bilingual') ||
                               cls.name.toLowerCase().includes('bilingual');
            return (
              <Card
                key={cls.name}
                className="!p-3 cursor-pointer hover:border-orange-400 transition-all group text-center"
                onClick={() => navigateToClass(cls.name)}
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center transition-colors ${
                  isBilingual
                    ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
                    : 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'
                }`}>
                  <span className="text-xs font-bold truncate px-1">{shortLabel}</span>
                </div>
                <h3 className={`text-xs font-bold group-hover:text-orange-600 line-clamp-2 ${
                  isBilingual ? 'text-purple-900' : 'text-gray-900'
                }`}>{cls.name}</h3>
                {cls.classType && (
                  <span className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    isBilingual
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isBilingual ? 'Bilingual' : 'Regular'}
                  </span>
                )}
              </Card>
            );
          })}
        </div>

        {/* Multi-Class Schedule Modal */}
        {showMultiClassModal && (
          <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <Card className="w-full max-w-2xl !p-4 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Add Multi-Class Schedule
                </h3>
                <button onClick={() => { setShowMultiClassModal(false); setMultiClassEntries([]); setMultiClassDates([]); setMultiClassFiles([]); setMultiClassUploadError(null); setShowCalendarPicker(false); }} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-500">Create schedules for multiple classes on multiple dates.</p>

              {/* Step 1: Multiple Dates */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase">1. Select Dates (can select multiple)</label>
                
                {/* Inline Calendar */}
                <div className="border rounded-lg p-3 bg-white">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180 text-gray-600" />
                    </button>
                    <span className="text-sm font-semibold text-gray-700">
                      {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Day Labels */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-center text-[10px] font-semibold text-gray-400 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays(calendarMonth).map((date, idx) => (
                      <div key={idx} className="aspect-square">
                        {date ? (
                          <button
                            type="button"
                            onClick={() => toggleDate(date)}
                            className={`w-full h-full rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                              isDateSelected(date)
                                ? 'bg-blue-600 text-white shadow-sm'
                                : formatDateForInput(date) === formatDateForInput(new Date())
                                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 ring-1 ring-blue-200'
                                  : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {date.getDate()}
                          </button>
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick Actions & Selected Count */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="text-[10px] text-gray-500">
                      {multiClassDates.length === 0 
                        ? 'Click dates to select' 
                        : <span className="text-blue-600 font-semibold">{multiClassDates.length} date(s) selected</span>}
                    </div>
                    <div className="flex gap-2">
                      {multiClassDates.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setMultiClassDates([])}
                          className="text-[10px] text-gray-500 hover:text-red-600 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCalendarMonth(new Date())}
                        className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Today
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Selected Dates Display */}
                {multiClassDates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {multiClassDates.map(date => (
                      <span key={date} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-medium border border-blue-100">
                        {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <button
                          onClick={() => setMultiClassDates(multiClassDates.filter(d => d !== date))}
                          className="p-0.5 hover:bg-blue-200 rounded"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Topic & Info */}
              {multiClassDates.length > 0 && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase">Topic/Material</label>
                    <input
                      type="text"
                      value={multiClassTopic}
                      onChange={e => setMultiClassTopic(e.target.value)}
                      className="w-full border rounded-lg px-3 py-1.5 text-xs mt-1"
                      placeholder="e.g. Business English: Negotiation"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase">Skill Categories (select multiple)</label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {Object.values(SkillCategory).map(cat => (
                        <label
                          key={cat}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            multiClassSkills.includes(cat)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={multiClassSkills.includes(cat)}
                            onChange={e => {
                              if (e.target.checked) {
                                setMultiClassSkills([...multiClassSkills, cat]);
                              } else {
                                setMultiClassSkills(multiClassSkills.filter(c => c !== cat));
                              }
                            }}
                            className="sr-only"
                          />
                          {cat}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase">Description (optional)</label>
                    <textarea
                      value={multiClassDescription}
                      onChange={e => setMultiClassDescription(e.target.value)}
                      className="w-full border rounded-lg px-3 py-1.5 text-xs mt-1"
                      rows={2}
                      placeholder="Material description..."
                    />
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase">
                      Upload Materials (PDF, DOC, PPT, Images)
                    </label>

                    {/* Upload Zone */}
                    <div
                      onClick={() => !multiClassUploading && multiClassFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                        multiClassUploading
                          ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      {multiClassUploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          <span className="text-xs text-gray-500">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                          <p className="text-[10px] text-gray-400">
                            Click to select file
                          </p>
                          <p className="text-[9px] text-gray-300">
                            Max. 10MB per file
                          </p>
                        </>
                      )}
                    </div>

                    <input
                      ref={multiClassFileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                      onChange={handleMultiClassFileSelect}
                      className="hidden"
                    />

                    {/* Upload Error */}
                    {multiClassUploadError && (
                      <div className="text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
                        {multiClassUploadError}
                      </div>
                    )}

                    {/* Uploaded Files List */}
                    {multiClassFiles.length > 0 && (
                      <div className="space-y-1">
                        {multiClassFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-1.5 bg-gray-50 rounded border border-gray-100"
                          >
                            <File className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="text-[10px] text-gray-700 truncate flex-1">
                              {file.fileName}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveMultiClassFile(idx); }}
                              className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Select Classes & Times */}
              {multiClassDates.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase">2. Select Classes & Time</label>
                  
                  {/* Time Presets */}
                  {timePresets.length > 0 && (
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[9px] text-gray-500 mb-1.5">Frequently used times:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {timePresets.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              // Apply preset to all selected classes
                              if (multiClassEntries.length > 0) {
                                setMultiClassEntries(multiClassEntries.map(entry => ({
                                  ...entry,
                                  startTime: preset.startTime,
                                  endTime: preset.endTime
                                })));
                              }
                            }}
                            className="px-2 py-1 text-[10px] font-medium bg-white border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            title={`Apply ${preset.label} to all selected classes`}
                          >
                            <Clock className="w-3 h-3 inline mr-1 opacity-50" />
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      {multiClassEntries.length === 0 && (
                        <p className="text-[9px] text-gray-400 mt-1 italic">Select classes first, then click preset to fill time</p>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {availableClasses.map((cls, classIndex) => {
                      const entry = multiClassEntries.find(e => e.classId === cls.name);
                      const isSelected = !!entry;
                      const entryIndex = multiClassEntries.findIndex(e => e.classId === cls.name);
                      const previousEntry = entryIndex > 0 ? multiClassEntries[entryIndex - 1] : null;
                      const canCopyFromAbove = isSelected && previousEntry && previousEntry.startTime && previousEntry.endTime;
                      const isBilingual = cls.classType?.toLowerCase().includes('bilingual') ||
                                         cls.name.toLowerCase().includes('bilingual');

                      return (
                        <div key={cls.name} className={`p-3 rounded-lg border transition-all ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setMultiClassEntries([...multiClassEntries, { classId: cls.name, startTime: '', endTime: '' }]);
                                  } else {
                                    setMultiClassEntries(multiClassEntries.filter(ent => ent.classId !== cls.name));
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-bold text-gray-900">{cls.name}</span>
                              {cls.classType && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                  isBilingual ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {isBilingual ? 'Bilingual' : 'Regular'}
                                </span>
                              )}
                            </label>
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                {/* Copy from above button */}
                                {canCopyFromAbove && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMultiClassEntries(multiClassEntries.map(ent =>
                                        ent.classId === cls.name ? { ...ent, startTime: previousEntry.startTime, endTime: previousEntry.endTime } : ent
                                      ));
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                                    title="Copy time from above"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span className="hidden sm:inline">Copy</span>
                                  </button>
                                )}
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-gray-500">Start:</span>
                                  <input
                                    type="time"
                                    value={entry?.startTime || ''}
                                    onChange={e => {
                                      setMultiClassEntries(multiClassEntries.map(ent =>
                                        ent.classId === cls.name ? { ...ent, startTime: e.target.value } : ent
                                      ));
                                    }}
                                    className="border rounded px-2 py-1 text-xs w-24"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-gray-500">End:</span>
                                  <input
                                    type="time"
                                    value={entry?.endTime || ''}
                                    onChange={e => {
                                      setMultiClassEntries(multiClassEntries.map(ent =>
                                        ent.classId === cls.name ? { ...ent, endTime: e.target.value } : ent
                                      ));
                                    }}
                                    className="border rounded px-2 py-1 text-xs w-24"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary */}
              {multiClassEntries.length > 0 && multiClassDates.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Summary</p>
                  <p className="text-xs text-blue-800">
                    <span className="font-bold">{multiClassEntries.length * multiClassDates.length}</span> schedule(s) will be created:{' '}
                    <span className="font-bold">{multiClassEntries.length}</span> class(es) × <span className="font-bold">{multiClassDates.length}</span> date(s)
                    {multiClassFiles.length > 0 && (
                      <span> • <span className="font-bold">{multiClassFiles.length}</span> material file(s)</span>
                    )}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowMultiClassModal(false); setMultiClassEntries([]); setMultiClassDates([]); setMultiClassTopic(''); setMultiClassSkills([]); setMultiClassDescription(''); setMultiClassFiles([]); setMultiClassUploadError(null); setShowCalendarPicker(false); }}
                  disabled={isSubmitting || multiClassUploading}
                  className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <Button
                  onClick={async () => {
                    if (multiClassDates.length === 0 || multiClassEntries.length === 0 || !multiClassTopic) {
                      alert('Please select dates, classes, and fill in the topic!');
                      return;
                    }
                    const invalidEntries = multiClassEntries.filter(e => !e.startTime || !e.endTime);
                    if (invalidEntries.length > 0) {
                      alert('Make sure all selected classes have start and end times!');
                      return;
                    }
                    setIsSubmitting(true);
                    try {
                      // Collect material URLs from uploaded files
                      const materialUrls = multiClassFiles.map(f => f.url);

                      // Create session for each date × class combination
                      for (const date of multiClassDates) {
                        for (const entry of multiClassEntries) {
                          // Auto-detect class_type from selected class
                          const selectedClass = availableClasses.find(c => c.name === entry.classId);
                          const isBilingual = selectedClass?.classType?.toLowerCase().includes('bilingual') ||
                                             entry.classId.toLowerCase().includes('bilingual');
                          const classType = isBilingual ? 'BILINGUAL' : 'REGULAR';

                          const dateTime = `${date}T${entry.startTime}:00${getTimezoneOffset()}`;
                          await createSession({
                            teacher_id: currentTeacher?.id || '',
                            topic: multiClassTopic,
                            date_time: dateTime,
                            location: `${selectedSchool} - ${entry.classId}`,
                            skill_category: multiClassSkills.length > 0 ? multiClassSkills : ['Grammar'],
                            difficulty_level: 'Elementary', // Default value - field removed from UI
                            description: multiClassDescription || null,
                            materials: materialUrls,
                            class_type: classType,
                          });
                        }
                      }
                      const totalCreated = multiClassDates.length * multiClassEntries.length;
                      alert(`${totalCreated} schedule(s) added successfully!`);
                      setShowMultiClassModal(false);
                      setMultiClassEntries([]);
                      setMultiClassDates([]);
                      setMultiClassTopic('');
                      setMultiClassSkills([]);
                      setMultiClassDescription('');
                      setMultiClassFiles([]);
                      setMultiClassUploadError(null);
                    } catch (error) {
                      console.error('Error creating sessions:', error);
                      alert('Failed to save schedule. Please try again.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting || multiClassUploading || multiClassEntries.length === 0 || multiClassDates.length === 0 || !multiClassTopic}
                  className="flex-1 text-xs py-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    `Save ${multiClassEntries.length * multiClassDates.length} Schedule(s)`
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // --- DETAIL VIEW ---
  if (selectedSession) {
    const primarySkill = selectedSession.skillCategories[0] || SkillCategory.GRAMMAR;
    const Icon = SKILL_ICONS[primarySkill] || AlignLeft;
    const sessionReports = reports[selectedSession.id] || [];
    const sessionHomeworks = homeworks.filter(h => h.sessionId === selectedSession.id);
    const isPast = new Date(selectedSession.dateTime) <= now;

    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => {
                setSelectedSession(null);
                // Clear session param from URL to prevent auto-reselect
                if (sessionIdFromUrl) {
                  navigate(`/teacher/schedule/${encodeURIComponent(selectedSchool!)}/${encodeURIComponent(selectedClass!)}`, { replace: true });
                }
             }} className="text-xs py-1.5 px-3">
                Back
             </Button>
             <div>
                <h2 className="text-lg font-bold text-gray-900">Class Report</h2>
                <p className="text-xs text-gray-500">Input grades and learning materials</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <Button
               variant="outline"
               onClick={() => {
                 // Pre-fill the edit form with selected session data
                 const sessionDate = new Date(selectedSession.dateTime);
                 const dateStr = formatDateForInput(sessionDate);
                 const startTime = sessionDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                 // Calculate end time (default 45 min after start)
                 const endDate = new Date(sessionDate.getTime() + 45 * 60 * 1000);
                 const endTime = endDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                 
                 setEditSessionForm({
                   date: dateStr,
                   startTime: startTime,
                   endTime: endTime,
                   topic: selectedSession.topic,
                   skillCategories: selectedSession.skillCategories,
                   description: selectedSession.description || '',
                   materials: selectedSession.materials || []
                 });
                 setEditSessionFiles([]);
                 setEditSessionUploadError(null);
                 setShowEditSessionModal(true);
               }}
               className="text-xs py-1.5 px-3"
             >
               Edit
             </Button>
             <Button
               variant="outline"
               onClick={() => setShowDeleteModal(true)}
               className="text-xs py-1.5 px-3 text-red-600 border-red-200 hover:bg-red-50"
             >
               Delete
             </Button>
             {isPast && (
               <Button onClick={() => setShowHomeworkModal(true)} className="text-xs py-1.5 px-3">
                 Assign Homework
               </Button>
             )}
           </div>
        </div>

        {/* Session Info Card - Combined with Materials */}
        <Card className="!p-4 space-y-4">
          {/* Session Info */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 bg-gray-800 text-white px-2 py-1 rounded text-[9px] uppercase font-bold">
                <Icon className="w-3 h-3" /> {selectedSession.skillCategories.join(', ')}
              </span>
              <span className={`px-2 py-1 rounded text-[9px] uppercase font-bold ${LEVEL_COLORS[selectedSession.difficultyLevel]}`}>
                {selectedSession.difficultyLevel}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">{selectedSession.topic}</h3>
              <div className="flex items-center gap-4 text-[10px] text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(selectedSession.dateTime).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedSession.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedSession.location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {selectedSession.description && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</p>
              <p className="text-xs text-gray-600">{selectedSession.description}</p>
            </div>
          )}

          {/* Materials Section */}
          <div className={`pt-3 border-t border-gray-100 ${!selectedSession.description ? 'mt-0' : ''}`}>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Learning Materials</p>
            {selectedSession.materials && selectedSession.materials.length > 0 ? (
              <div className="space-y-1.5">
                {selectedSession.materials.map((file, idx) => {
                  const fileName = file.split('/').pop() || file;
                  const isUrl = file.startsWith('http://') || file.startsWith('https://');
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs group hover:bg-blue-50 transition-colors">
                      <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      {isUrl ? (
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate flex-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          title={fileName}
                        >
                          {fileName}
                        </a>
                      ) : (
                        <span className="truncate flex-1 text-gray-700">{file}</span>
                      )}
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 p-1"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic">No materials yet. Click Edit to add materials.</p>
            )}
          </div>
        </Card>

        {/* Student Reports section - temporarily hidden */}
        {false && detailTab === 'students' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Student Reports Table */}
            <div className="lg:col-span-2">
              <Card className="!p-0 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" /> Student Reports
                  </h3>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2 text-center">Written</th>
                      <th className="px-4 py-2 text-center">Oral</th>
                      <th className="px-4 py-2 text-center">CEFR</th>
                      <th className="px-4 py-2">Feedback</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {enrolledStudents.map((student) => {
                      const report = sessionReports.find(r => r.studentId === student.id);
                      const isEditing = editingStudent === student.id;

                      if (isEditing) {
                        return (
                          <tr key={student.id} className="bg-blue-50">
                            <td className="px-4 py-2 font-medium text-gray-900">{student.name}</td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editForm.writtenScore}
                                onChange={e => setEditForm({ ...editForm, writtenScore: e.target.value })}
                                className="w-14 px-2 py-1 border rounded text-center text-xs"
                                placeholder="0-100"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editForm.oralScore}
                                onChange={e => setEditForm({ ...editForm, oralScore: e.target.value })}
                                className="w-14 px-2 py-1 border rounded text-center text-xs"
                                placeholder="0-100"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={editForm.cefrLevel}
                                onChange={e => setEditForm({ ...editForm, cefrLevel: e.target.value as CEFRLevel })}
                                className="w-20 px-1 py-1 border rounded text-[10px]"
                              >
                                <option value="">-</option>
                                {cefrLevels.map(l => (
                                  <option key={l} value={l}>{l.split(' - ')[0]}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={editForm.teacherNotes}
                                onChange={e => setEditForm({ ...editForm, teacherNotes: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-xs"
                                placeholder="Feedback untuk siswa..."
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => saveStudentReport(selectedSession.id, student.id, student.name)}
                                  className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                                  title="Save"
                                >
                                  <Save className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingStudent(null)}
                                  className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">
                                {student.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {report?.writtenScore !== undefined ? (
                              <span className="font-bold text-gray-900">{report.writtenScore}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {report?.oralScore !== undefined ? (
                              <span className="font-bold text-gray-900">{report.oralScore}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {report?.cefrLevel ? (
                              <span className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-teal-100">
                                {report.cefrLevel.split(' - ')[0]}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {report?.teacherNotes ? (
                              <span className="text-[10px] text-gray-600 italic line-clamp-2">"{report.teacherNotes}"</span>
                            ) : (
                              <span className="text-gray-300 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => startEditStudent(student.id, selectedSession.id)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all"
                              title="Input Nilai"
                            >
                              <PenLine className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* Homework Assigned */}
              <Card className="!p-3">
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Homework Assigned
                </h4>
                {sessionHomeworks.length > 0 ? (
                  <div className="space-y-2">
                    {[...new Set(sessionHomeworks.map(h => h.title))].map((title, idx) => {
                      const hw = sessionHomeworks.find(h => h.title === title);
                      return (
                        <div key={idx} className="p-2 bg-orange-50 rounded border border-orange-100">
                          <p className="text-xs font-bold text-gray-900">{title}</p>
                          <p className="text-[10px] text-gray-500">Due: {new Date(hw?.dueDate || '').toLocaleDateString()}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic">No homework assigned.</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Materials tab content removed - now integrated in main card above */}

        {/* Homework Modal */}
        {showHomeworkModal && (
          <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <Card className="w-full max-w-md !p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" /> Assign Homework
                </h3>
                <button onClick={() => setShowHomeworkModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Title</label>
                  <input
                    type="text"
                    value={hwForm.title}
                    onChange={e => setHwForm({ ...hwForm, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-1.5 text-xs"
                    placeholder="e.g. Grammar Exercise Chapter 5"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Description</label>
                  <textarea
                    value={hwForm.description}
                    onChange={e => setHwForm({ ...hwForm, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-1.5 text-xs"
                    rows={3}
                    placeholder="Instructions for the homework..."
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Due Date</label>
                  <input
                    type="date"
                    value={hwForm.dueDate}
                    onChange={e => setHwForm({ ...hwForm, dueDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-1.5 text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowHomeworkModal(false)}
                  className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <Button
                  onClick={() => addHomework(selectedSession.id)}
                  className="flex-1 text-xs py-2"
                >
                  Assign to All Students
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <Card className="w-full max-w-sm !p-4 space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Delete Schedule?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to delete this schedule? This action cannot be undone.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-bold text-gray-900">{selectedSession.topic}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {new Date(selectedSession.dateTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} • {new Date(selectedSession.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </p>
                <p className="text-[10px] text-gray-500">{selectedSession.location}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleDeleteSchedule}
                  disabled={isDeleting}
                  className="flex-1 text-xs py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    'Delete Schedule'
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Session Modal */}
        {showEditSessionModal && (
          <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <Card className="w-full max-w-md !p-4 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-blue-600" />
                  Edit Schedule
                </h3>
                <button 
                  onClick={() => setShowEditSessionModal(false)} 
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Date */}
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Date</label>
                  <input
                    type="date"
                    value={editSessionForm.date}
                    onChange={e => setEditSessionForm({ ...editSessionForm, date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-xs mt-1"
                  />
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase">Start Time</label>
                    <input
                      type="time"
                      value={editSessionForm.startTime}
                      onChange={e => setEditSessionForm({ ...editSessionForm, startTime: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase">End Time</label>
                    <input
                      type="time"
                      value={editSessionForm.endTime}
                      onChange={e => setEditSessionForm({ ...editSessionForm, endTime: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-xs mt-1"
                    />
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Topic/Material</label>
                  <input
                    type="text"
                    value={editSessionForm.topic}
                    onChange={e => setEditSessionForm({ ...editSessionForm, topic: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-xs mt-1"
                    placeholder="e.g. Business English: Negotiation"
                  />
                </div>

                {/* Skill Categories */}
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Skill Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {Object.values(SkillCategory).map(cat => (
                      <label
                        key={cat}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          editSessionForm.skillCategories.includes(cat)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={editSessionForm.skillCategories.includes(cat)}
                          onChange={e => {
                            if (e.target.checked) {
                              setEditSessionForm({ ...editSessionForm, skillCategories: [...editSessionForm.skillCategories, cat] });
                            } else {
                              setEditSessionForm({ ...editSessionForm, skillCategories: editSessionForm.skillCategories.filter(c => c !== cat) });
                            }
                          }}
                          className="sr-only"
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Description (optional)</label>
                  <textarea
                    value={editSessionForm.description}
                    onChange={e => setEditSessionForm({ ...editSessionForm, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-xs mt-1"
                    rows={3}
                    placeholder="Material description..."
                  />
                </div>

                {/* Materials */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase">
                    Materials (PDF, DOC, PPT, Images)
                  </label>

                  {/* Existing Materials */}
                  {editSessionForm.materials.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[9px] text-gray-500">Existing materials:</p>
                      {editSessionForm.materials.map((url, idx) => {
                        const fileName = url.split('/').pop() || url;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-1.5 bg-gray-50 rounded border border-gray-100"
                          >
                            <File className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:text-blue-800 truncate flex-1"
                            >
                              {fileName}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingMaterial(idx)}
                              className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Newly Uploaded Files */}
                  {editSessionFiles.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[9px] text-gray-500">New uploads:</p>
                      {editSessionFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-1.5 bg-green-50 rounded border border-green-100"
                        >
                          <File className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <span className="text-[10px] text-gray-700 truncate flex-1">
                            {file.fileName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEditSessionFile(idx)}
                            className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Zone */}
                  <div
                    onClick={() => !editSessionUploading && editSessionFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                      editSessionUploading
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {editSessionUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        <span className="text-xs text-gray-500">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400">
                          Click to add material
                        </p>
                      </>
                    )}
                  </div>

                  <input
                    ref={editSessionFileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                    onChange={handleEditSessionFileSelect}
                    className="hidden"
                  />

                  {/* Upload Error */}
                  {editSessionUploadError && (
                    <div className="text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
                      {editSessionUploadError}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowEditSessionModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleUpdateSession}
                  disabled={isSubmitting || editSessionUploading || !editSessionForm.date || !editSessionForm.startTime || !editSessionForm.topic}
                  className="flex-1 text-xs py-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(`/teacher/schedule/${encodeURIComponent(selectedSchool!)}`)} className="text-xs py-1.5 px-3">
            Change Class
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Teaching Schedule
            </h2>
            <p className="text-xs text-gray-500">{selectedSchool} - {selectedClass}</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="text-xs py-1.5 px-3">
          Add Schedule
        </Button>
      </div>

      <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${activeTab === 'upcoming' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          History
        </button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Topic</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(activeTab === 'upcoming' ? upcomingSessions : pastSessions).map(session => {
              const sessionReports = reports[session.id] || [];
              const reportedCount = sessionReports.filter(r => r.writtenScore !== undefined || r.cefrLevel).length;
              const enrolledCount = enrolledStudents.length;

              return (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2">
                    <div className="text-xs font-medium text-gray-900">{new Date(session.dateTime).toLocaleDateString()}</div>
                    <div className="text-[10px] text-gray-500">{new Date(session.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-xs font-bold text-gray-900">{session.topic}</div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[9px] font-bold text-gray-600 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                      {session.skillCategories.join(', ')}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-1 text-[10px] text-gray-600">
                      <MapPin className="w-3 h-3 text-orange-500" /> {session.location}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {activeTab === 'history' ? (
                      reportedCount > 0 ? (
                        <span className="text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                          {reportedCount}/{enrolledCount} Reported
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 animate-pulse">
                          Needs Input
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        Upcoming
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100 ml-auto"
                    >
                      {activeTab === 'history' ? 'Report' : 'View'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {(activeTab === 'upcoming' ? upcomingSessions : pastSessions).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs italic">
                  No {activeTab === 'upcoming' ? 'upcoming' : 'past'} sessions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-lg !p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Add New Schedule
              </h3>
              <button onClick={handleCloseCreateModal} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Multiple Dates Section */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase">Dates (can select multiple)</label>
              <input
                type="date"
                value=""
                onChange={e => {
                  const selectedDate = e.target.value;
                  if (selectedDate && !scheduleForm.dates.includes(selectedDate)) {
                    setScheduleForm({ ...scheduleForm, dates: [...scheduleForm.dates, selectedDate].sort() });
                  }
                }}
                className="w-full border rounded-lg px-3 py-1.5 text-xs"
              />
              {scheduleForm.dates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {scheduleForm.dates.map(date => (
                    <span key={date} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-medium border border-blue-100">
                      {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <button
                        onClick={() => handleRemoveDate(date)}
                        className="p-0.5 hover:bg-blue-200 rounded"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {scheduleForm.dates.length === 0 && (
                <p className="text-[10px] text-gray-400 italic">No dates selected</p>
              )}
            </div>

            {/* Time Presets */}
            {timePresets.length > 0 && (
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[9px] text-gray-500 mb-1.5">Frequently used times:</p>
                <div className="flex flex-wrap gap-1.5">
                  {timePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setScheduleForm({
                          ...scheduleForm,
                          startTime: preset.startTime,
                          endTime: preset.endTime
                        });
                      }}
                      className={`px-2 py-1 text-[10px] font-medium border rounded-md transition-colors ${
                        scheduleForm.startTime === preset.startTime && scheduleForm.endTime === preset.endTime
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <Clock className="w-3 h-3 inline mr-1 opacity-50" />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start & End Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Start Time</label>
                <input
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                  className="w-full border rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">End Time</label>
                <input
                  type="time"
                  value={scheduleForm.endTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                  className="w-full border rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
            </div>
            {calculateDuration() && (
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                <Clock className="w-3 h-3" />
                Duration: {calculateDuration()} hours
              </div>
            )}

            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Topic/Material</label>
              <input
                type="text"
                value={scheduleForm.topic}
                onChange={e => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
                className="w-full border rounded-lg px-3 py-1.5 text-xs"
                placeholder="e.g. Business English: Negotiation"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Skill Categories (select multiple)</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {skillCategories.map(cat => (
                  <label
                    key={cat}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      scheduleForm.skillCategories.includes(cat)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={scheduleForm.skillCategories.includes(cat)}
                      onChange={e => {
                        if (e.target.checked) {
                          setScheduleForm({ ...scheduleForm, skillCategories: [...scheduleForm.skillCategories, cat] });
                        } else {
                          setScheduleForm({ ...scheduleForm, skillCategories: scheduleForm.skillCategories.filter(c => c !== cat) });
                        }
                      }}
                      className="sr-only"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Description</label>
              <textarea
                value={scheduleForm.description}
                onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-1.5 text-xs"
                rows={3}
                placeholder="Description of materials to teach..."
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase">
                Upload Materials (PDF, DOC, PPT, Images)
              </label>

              {/* Upload Zone */}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isUploading
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-xs text-gray-500">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-[10px] text-gray-400">
                      Click to select file or drag & drop
                    </p>
                    <p className="text-[9px] text-gray-300 mt-1">
                      Max. 10MB per file
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Upload Error */}
              {uploadError && (
                <div className="text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
                  {uploadError}
                </div>
              )}

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <File className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-xs text-gray-700 truncate flex-1">
                        {file.fileName}
                      </span>
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Selected Location & Class</p>
              <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" /> {selectedSchool} - {selectedClass}
              </p>
            </div>

            {/* Summary */}
            {scheduleForm.dates.length > 0 && scheduleForm.startTime && scheduleForm.endTime && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Summary</p>
                <p className="text-xs text-blue-800">
                  <span className="font-bold">{scheduleForm.dates.length}</span> session(s) will be created
                  {calculateDuration() && (
                    <span> • Total <span className="font-bold">{(scheduleForm.dates.length * (calculateDuration() || 0)).toFixed(1)}</span> hours</span>
                  )}
                  {uploadedFiles.length > 0 && (
                    <span> • <span className="font-bold">{uploadedFiles.length}</span> material file(s)</span>
                  )}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCloseCreateModal}
                disabled={isSubmitting || isUploading}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                onClick={handleCreateSchedule}
                disabled={isSubmitting || isUploading || scheduleForm.dates.length === 0}
                className="flex-1 text-xs py-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  `Save ${scheduleForm.dates.length > 1 ? `${scheduleForm.dates.length} Schedule(s)` : 'Schedule'}`
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../Card';
import { Button } from '../Button';
import { useStudents, useLocations, useClasses } from '../../hooks/useProfiles';
import { useSessions } from '../../hooks/useSessions';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentGrades } from '../../hooks/useStudentGrades';
import { useTests } from '../../hooks/useTests';
import { testsService, TestType, TestScheduleInsert } from '../../services/tests.service';
import { User, SkillCategory, DifficultyLevel, CEFRLevel, ClassType } from '../../types';
import { School, ChevronRight, GraduationCap, Calendar, MapPin, Clock, CheckCircle, XCircle, Loader2, BookOpen, Save, ClipboardList, Plus, X, Upload, File, Trash2, Globe, UserCheck } from 'lucide-react';
import { uploadFile, isAllowedFileType, UploadResult } from '../../lib/storage';

const TEST_TYPE_LABELS: Record<TestType, string> = {
  'QUIZ': 'Quiz',
  'MID_SEMESTER': 'UTS (Mid Semester)',
  'FINAL_SEMESTER': 'UAS (Final Semester)',
};

const TEST_TYPE_COLORS: Record<TestType, string> = {
  'QUIZ': 'bg-blue-100 text-blue-700 border-blue-200',
  'MID_SEMESTER': 'bg-orange-100 text-orange-700 border-orange-200',
  'FINAL_SEMESTER': 'bg-purple-100 text-purple-700 border-purple-200',
};

// Type for student grades including quizzes and participation
interface StudentGradeData {
  quiz1: string;
  quiz2: string;
  quiz3: string;
  participation: string;
  mid: string;
  final: string;
}

// Generate academic year options (current year - 2 to current year + 1)
const generateAcademicYears = (): string[] => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = -2; i <= 1; i++) {
    const startYear = currentYear + i;
    years.push(`${startYear}/${startYear + 1}`);
  }
  return years;
};

// Helper to extract class name from school_origin format
// e.g., "SD SANG TIMUR - KELAS 1 A (Regular)" -> "KELAS 1 A"
const parseClassFromSchoolOrigin = (schoolOrigin?: string | null): string => {
  if (!schoolOrigin) return '';
  // Try format: "SCHOOL NAME - CLASS (TYPE)"
  const matchWithType = schoolOrigin.match(/^.+?\s*-\s*(.+?)\s*\((.+?)\)$/);
  if (matchWithType) {
    return matchWithType[1].trim();
  }
  // Try simpler format: "SCHOOL NAME - CLASS"
  const matchSimple = schoolOrigin.match(/^.+?\s*-\s*(.+?)$/);
  if (matchSimple) {
    return matchSimple[1].trim();
  }
  return '';
};

export const StudentGrades: React.FC = () => {
  const { schoolId, classId } = useParams<{ schoolId?: string; classId?: string }>();
  const navigate = useNavigate();
  const { user: currentTeacher } = useAuth();

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

  // Stage 2: Only load students/sessions/reports when viewing class details
  const { profiles: studentsData, loading: studentsLoading, error: studentsError } = useStudents(isDetailView);
  const { sessions: sessionsData } = useSessions({ enabled: isDetailView });
  const { reports: reportsData } = useReports({ enabled: isDetailView });

  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // Academic year and semester selection
  const academicYears = generateAcademicYears();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  // Default to current academic year (if July or later, use current year, otherwise previous)
  const defaultAcademicYear = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
  // Default semester (1 for July-December, 2 for January-June)
  const defaultSemester = currentMonth >= 6 ? '1' : '2';

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(defaultAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(defaultSemester as '1' | '2');

  // Extended grades state with quizzes and participation
  const [semesterGrades, setSemesterGrades] = useState<Record<string, StudentGradeData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Test creation modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testType, setTestType] = useState<TestType>('QUIZ');
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testDate, setTestDate] = useState('');
  const [testStartTime, setTestStartTime] = useState('08:00');
  const [testEndTime, setTestEndTime] = useState('09:00');
  const [testDuration, setTestDuration] = useState(60);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  // File upload states for test creation
  const testFileInputRef = useRef<HTMLInputElement>(null);
  const [testUploadedFiles, setTestUploadedFiles] = useState<UploadResult[]>([]);
  const [isUploadingTest, setIsUploadingTest] = useState(false);
  const [testUploadError, setTestUploadError] = useState<string | null>(null);

  // Class type state for test creation
  const [testClassType, setTestClassType] = useState<ClassType | ''>('');

  // Get teacher's available class types
  const teacherClassTypes: ClassType[] = (currentTeacher as any)?.classTypes || [];
  const hasOnlyOneClassType = teacherClassTypes.length === 1;

  // Auto-select class type if teacher only has one
  useEffect(() => {
    if (hasOnlyOneClassType && !testClassType) {
      setTestClassType(teacherClassTypes[0]);
    }
  }, [hasOnlyOneClassType, teacherClassTypes, testClassType]);

  // Use the student grades hook to fetch and save grades
  const {
    gradesMap: dbGrades,
    loading: gradesLoading,
    saveGrade,
    saveAllGrades: saveAllGradesToDb,
    refetch: refetchGrades,
  } = useStudentGrades(
    selectedAcademicYear,
    selectedSemester,
    selectedSchool || '',
    selectedClass || ''
  );

  // Initialize semesterGrades from database when data loads
  // Use JSON.stringify to create a stable dependency
  const dbGradesJson = JSON.stringify(dbGrades);
  useEffect(() => {
    if (!gradesLoading) {
      const parsedGrades = JSON.parse(dbGradesJson);
      if (Object.keys(parsedGrades).length > 0) {
        const initialGrades: Record<string, StudentGradeData> = {};
        Object.entries(parsedGrades).forEach(([studentId, grade]: [string, any]) => {
          initialGrades[studentId] = {
            quiz1: grade.quiz1?.toString() || '',
            quiz2: grade.quiz2?.toString() || '',
            quiz3: grade.quiz3?.toString() || '',
            participation: grade.participation?.toString() || '',
            mid: grade.mid?.toString() || '',
            final: grade.final?.toString() || '',
          };
        });
        setSemesterGrades(initialGrades);
      } else {
        // Reset when no grades found (e.g., when switching year/semester)
        setSemesterGrades({});
      }
    }
  }, [dbGradesJson, gradesLoading]);

  // Map schools from database - filter to only show teacher's assigned schools
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

  // Get teacher's assigned classes filtered by what's available in the selected school
  const getAvailableClasses = (): string[] => {
    // Get class names that exist in the selected location from database
    const locationClassNames = locationClasses.map(c => c.name);

    // If teacher has assigned classes, filter to only show ones in this location
    if (currentTeacher?.assignedClasses && currentTeacher.assignedClasses.length > 0) {
      // Filter teacher's classes to only show ones that exist in this school's location
      const filteredClasses = currentTeacher.assignedClasses.filter(teacherClass =>
        locationClassNames.includes(teacherClass)
      );
      // If teacher has classes for this location, return them
      if (filteredClasses.length > 0) {
        return filteredClasses;
      }
      // If no matching classes, fall back to location classes
      if (locationClassNames.length > 0) {
        return locationClassNames;
      }
    }

    // If location has classes in database, use those
    if (locationClassNames.length > 0) {
      return locationClassNames;
    }

    // Otherwise, generate based on selected school's level
    const selectedSchoolData = schools.find(s => s.name === selectedSchool);
    const level = selectedSchoolData?.level;
    const classes: string[] = [];
    switch (level?.toUpperCase()) {
      case 'KINDERGARTEN':
        ['TK-A', 'TK-B'].forEach(c => {
          for (let i = 1; i <= 3; i++) classes.push(`${c}.${i}`);
        });
        break;
      case 'PRIMARY':
      case 'ELEMENTARY':
        for (let grade = 1; grade <= 6; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push(`${grade}.${section}`);
          }
        }
        break;
      case 'JUNIOR':
        for (let grade = 7; grade <= 9; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push(`${grade}.${section}`);
          }
        }
        break;
      case 'SENIOR':
      case 'HIGH':
        for (let grade = 10; grade <= 12; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push(`${grade}.${section}`);
          }
        }
        break;
      default:
        // General - show common classes
        for (let grade = 1; grade <= 12; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push(`${grade}.${section}`);
          }
        }
    }
    return classes;
  };

  const availableClasses = getAvailableClasses();

  // Map students from database
  const allStudents: User[] = studentsData.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone || undefined,
    address: s.address || undefined,
    role: s.role as any,
    status: s.status as 'ACTIVE' | 'INACTIVE',
    branch: s.branch || undefined,
    assignedLocationId: s.assigned_location_id || undefined,
    teacherNotes: s.teacher_notes || undefined,
    needsAttention: s.needs_attention,
    schoolOrigin: s.school_origin || undefined,
    skillLevels: (s.skill_levels as Partial<Record<SkillCategory, DifficultyLevel>>) || {},
  }));

  // Filter students by selected class and school (assigned_location_id)
  const students = allStudents.filter(student => {
    // First, match school by assigned_location_id
    if (selectedSchool && selectedSchool !== 'Online (Zoom)') {
      const selectedSchoolData = schools.find(s => s.name === selectedSchool);
      if (selectedSchoolData) {
        if (student.assignedLocationId !== selectedSchoolData.id) return false;
      }
    }

    // Then, match class - use branch if available, otherwise parse from school_origin
    if (selectedClass && selectedClass !== 'Online') {
      const studentClass = student.branch || parseClassFromSchoolOrigin(student.schoolOrigin);
      if (studentClass !== selectedClass) return false;
    }

    return true;
  });

  // Build reports map by session
  const MOCK_SESSION_REPORTS: Record<string, any[]> = {};
  reportsData.forEach(r => {
    if (!MOCK_SESSION_REPORTS[r.session_id]) {
      MOCK_SESSION_REPORTS[r.session_id] = [];
    }
    MOCK_SESSION_REPORTS[r.session_id].push({
      studentId: r.student_id,
      studentName: r.student_name || 'Unknown',
      writtenScore: r.written_score,
      oralScore: r.oral_score,
      cefrLevel: r.cefr_level as CEFRLevel,
    });
  });

  // Map sessions
  const MOCK_SESSIONS = sessionsData.map(s => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategory: s.skill_category as SkillCategory,
    difficultyLevel: s.difficulty_level as DifficultyLevel,
  }));

  // Show loading spinner - only check student loading when in detail view
  // Also check classesLoading when school is selected (for class selection view)
  const isLoading = locationsLoading || (selectedSchool && !selectedClass && classesLoading) || (isDetailView && studentsLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">
          {isDetailView ? 'Loading students...' : selectedSchool ? 'Loading classes...' : 'Loading schools...'}
        </span>
      </div>
    );
  }

  if (isDetailView && studentsError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading students: {studentsError.message}
      </div>
    );
  }

  const saveSemesterGrade = async (studentId: string) => {
    const grade = semesterGrades[studentId];
    if (!grade || !selectedSchool || !selectedClass) return;

    setIsSaving(true);
    try {
      await saveGrade({
        student_id: studentId,
        academic_year: selectedAcademicYear,
        semester: selectedSemester,
        school_name: selectedSchool,
        class_name: selectedClass,
        quiz1: grade.quiz1 ? parseInt(grade.quiz1) : null,
        quiz2: grade.quiz2 ? parseInt(grade.quiz2) : null,
        quiz3: grade.quiz3 ? parseInt(grade.quiz3) : null,
        participation: grade.participation ? parseInt(grade.participation) : null,
        mid: grade.mid ? parseInt(grade.mid) : null,
        final: grade.final ? parseInt(grade.final) : null,
      });
      alert('Nilai semester berhasil disimpan!');
    } catch (err) {
      console.error('Error saving grade:', err);
      alert('Gagal menyimpan nilai. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllGrades = async () => {
    if (!selectedSchool || !selectedClass) return;

    const gradesWithValues = Object.entries(semesterGrades).filter(
      ([_, grade]: [string, StudentGradeData]) =>
        grade.quiz1 || grade.quiz2 || grade.quiz3 || grade.participation || grade.mid || grade.final
    );

    if (gradesWithValues.length === 0) {
      alert('Tidak ada nilai untuk disimpan.');
      return;
    }

    setIsSaving(true);
    try {
      const inputs = gradesWithValues.map(([studentId, grade]) => ({
        student_id: studentId,
        academic_year: selectedAcademicYear,
        semester: selectedSemester,
        school_name: selectedSchool,
        class_name: selectedClass,
        quiz1: grade.quiz1 ? parseInt(grade.quiz1) : null,
        quiz2: grade.quiz2 ? parseInt(grade.quiz2) : null,
        quiz3: grade.quiz3 ? parseInt(grade.quiz3) : null,
        participation: grade.participation ? parseInt(grade.participation) : null,
        mid: grade.mid ? parseInt(grade.mid) : null,
        final: grade.final ? parseInt(grade.final) : null,
      }));

      const savedCount = await saveAllGradesToDb(inputs);
      alert(`${savedCount} nilai semester berhasil disimpan untuk TA ${selectedAcademicYear} Semester ${selectedSemester}!`);
    } catch (err) {
      console.error('Error saving grades:', err);
      alert('Gagal menyimpan nilai. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const getLetterGrade = (score: number) => {
    if (score >= 90) return { letter: 'A', color: 'text-green-600 bg-green-50 border-green-200' };
    if (score >= 80) return { letter: 'B', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (score >= 70) return { letter: 'C', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    if (score >= 60) return { letter: 'D', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { letter: 'E', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  // Handle file selection and upload for test
  const handleTestFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setTestUploadError(null);
    setIsUploadingTest(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!isAllowedFileType(file)) {
          setTestUploadError(`File "${file.name}" tidak didukung. Gunakan PDF, DOC, DOCX, PPT, PPTX, atau gambar.`);
          continue;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setTestUploadError(`File "${file.name}" terlalu besar. Maksimal 10MB.`);
          continue;
        }

        // Upload file
        const result = await uploadFile(file, 'tests');
        setTestUploadedFiles(prev => [...prev, result]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setTestUploadError('Gagal mengupload file. Silakan coba lagi.');
    } finally {
      setIsUploadingTest(false);
      // Reset input
      if (testFileInputRef.current) {
        testFileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded file for test
  const handleRemoveTestFile = (index: number) => {
    setTestUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Create test function
  const handleCreateTest = async () => {
    if (!testDate || !testTitle || !selectedSchool || !selectedClass || !testClassType) {
      alert('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    setIsCreatingTest(true);
    try {
      // Calculate duration from start and end time
      const [startHour, startMin] = testStartTime.split(':').map(Number);
      const [endHour, endMin] = testEndTime.split(':').map(Number);
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      const dateTime = new Date(`${testDate}T${testStartTime}:00`).toISOString();

      // Collect material URLs from uploaded files
      const materialUrls = testUploadedFiles.map(f => f.url);

      const testData: TestScheduleInsert = {
        teacher_id: currentTeacher?.id || null,
        test_type: testType,
        title: testTitle,
        description: testDescription || null,
        date_time: dateTime,
        duration_minutes: durationMinutes > 0 ? durationMinutes : 60,
        location: selectedSchool,
        class_name: selectedClass,
        academic_year: selectedAcademicYear,
        semester: selectedSemester,
        materials: materialUrls,
        class_type: testClassType || 'REGULAR',
      };

      await testsService.create(testData);
      alert(`${TEST_TYPE_LABELS[testType]} berhasil dibuat untuk kelas ${selectedClass}!`);

      // Reset form
      setShowTestModal(false);
      setTestTitle('');
      setTestDescription('');
      setTestDate('');
      setTestStartTime('08:00');
      setTestEndTime('09:00');
      setTestUploadedFiles([]);
      setTestUploadError(null);
      setTestClassType(hasOnlyOneClassType ? teacherClassTypes[0] : '');
    } catch (err) {
      console.error('Error creating test:', err);
      alert('Gagal membuat jadwal test. Silakan coba lagi.');
    } finally {
      setIsCreatingTest(false);
    }
  };

  // --- STUDENT DETAIL VIEW ---
  if (selectedStudent && selectedSchool) {
    // Get all sessions at this school
    const schoolSessions = MOCK_SESSIONS.filter(s =>
      s.location.includes(selectedSchool.split(' - ')[0]) ||
      (selectedSchool === 'Online (Zoom)' && s.location.includes('Online'))
    );

    // Get student's reports for each session
    const studentClassHistory = schoolSessions.map(session => {
      const reports = MOCK_SESSION_REPORTS[session.id] || [];
      const studentReport = reports.find(r => r.studentId === selectedStudent.id);
      return {
        session,
        report: studentReport
      };
    }).sort((a, b) => new Date(b.session.dateTime).getTime() - new Date(a.session.dateTime).getTime());

    const grade = semesterGrades[selectedStudent.id] || { quiz1: '', quiz2: '', quiz3: '', participation: '', mid: '', final: '' };
    // Calculate average from all filled values
    const values = [grade.quiz1, grade.quiz2, grade.quiz3, grade.participation, grade.mid, grade.final]
      .filter(v => v !== '' && v !== undefined)
      .map(v => parseInt(v));
    const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedStudent(null)} className="text-xs py-1.5 px-3">
            Back
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detail Siswa</h2>
            <p className="text-xs text-gray-500">{selectedSchool}</p>
          </div>
        </div>

        {/* Student Info Card */}
        <Card className="!p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold text-xl">
              {selectedStudent.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">{selectedStudent.name}</h3>
              <p className="text-xs text-gray-500">{selectedStudent.email}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-gray-400 uppercase">Semester Grade</p>
              {avg !== null ? (
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className="text-lg font-bold text-gray-900">{avg}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLetterGrade(avg).color}`}>
                    {getLetterGrade(avg).letter}
                  </span>
                </div>
              ) : (
                <span className="text-gray-300 text-sm">—</span>
              )}
            </div>
          </div>
        </Card>

        {/* Academic Year and Semester Info */}
        <Card className="!p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs font-bold text-purple-800">Tahun Ajaran {selectedAcademicYear} - Semester {selectedSemester}</p>
              <p className="text-[10px] text-purple-600">{selectedSchool} - {selectedClass}</p>
            </div>
          </div>
        </Card>

        {/* Semester Grades Input */}
        <Card className="!p-4">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Nilai Semester</h4>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Quiz 1</label>
              <input
                type="number"
                min="0"
                max="100"
                value={grade.quiz1}
                onChange={e => setSemesterGrades({
                  ...semesterGrades,
                  [selectedStudent.id]: { ...grade, quiz1: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Quiz 2</label>
              <input
                type="number"
                min="0"
                max="100"
                value={grade.quiz2}
                onChange={e => setSemesterGrades({
                  ...semesterGrades,
                  [selectedStudent.id]: { ...grade, quiz2: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Quiz 3</label>
              <input
                type="number"
                min="0"
                max="100"
                value={grade.quiz3}
                onChange={e => setSemesterGrades({
                  ...semesterGrades,
                  [selectedStudent.id]: { ...grade, quiz3: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                placeholder="0-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Participation</label>
              <input
                type="number"
                min="0"
                max="100"
                value={grade.participation}
                onChange={e => setSemesterGrades({
                  ...semesterGrades,
                  [selectedStudent.id]: { ...grade, participation: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Mid Semester</label>
              <input
                type="number"
                min="0"
                max="100"
                value={grade.mid}
                onChange={e => setSemesterGrades({
                  ...semesterGrades,
                  [selectedStudent.id]: { ...grade, mid: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Final Semester</label>
              <input
                type="number"
                min="0"
                max="100"
                value={grade.final}
                onChange={e => setSemesterGrades({
                  ...semesterGrades,
                  [selectedStudent.id]: { ...grade, final: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                placeholder="0-100"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => saveSemesterGrade(selectedStudent.id)} disabled={isSaving} className="text-xs py-1.5 px-3">
              {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
            </Button>
          </div>
        </Card>

        {/* Class History */}
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs font-bold text-gray-700">Riwayat Kelas ({studentClassHistory.length})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {studentClassHistory.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-xs italic">
                Belum ada kelas yang diikuti di lokasi ini.
              </div>
            ) : (
              studentClassHistory.map(({ session, report }) => (
                <div key={session.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900">{session.topic}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.dateTime).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.location}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {report ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 justify-end">
                            {report.attendanceStatus === 'PRESENT' ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                <CheckCircle className="w-3 h-3" /> Hadir
                              </span>
                            ) : report.attendanceStatus === 'LATE' ? (
                              <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                                Terlambat
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                <XCircle className="w-3 h-3" /> Absen
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 justify-end text-[10px]">
                            {report.writtenScore !== undefined && (
                              <span className="text-gray-600">Written: <strong className={report.writtenScore >= 70 ? 'text-green-600' : 'text-red-600'}>{report.writtenScore}</strong></span>
                            )}
                            {report.oralScore !== undefined && (
                              <span className="text-gray-600">Oral: <strong className={report.oralScore >= 70 ? 'text-green-600' : 'text-red-600'}>{report.oralScore}</strong></span>
                            )}
                          </div>
                          {report.cefrLevel && (
                            <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {report.cefrLevel.split(' - ')[0]}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">Belum ada nilai</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  }

  // --- SCHOOL SELECTION VIEW ---
  if (!selectedSchool) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nilai Siswa</h2>
          <p className="text-xs text-gray-500">Pilih sekolah untuk mengelola nilai mid & final semester siswa.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {schools.map((school) => (
            <Card
              key={school.id}
              className="!p-4 cursor-pointer hover:border-purple-400 transition-all group"
              onClick={() => navigate(`/teacher/grades/${encodeURIComponent(school.name)}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <School className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600">{school.name}</h3>
                  <p className="text-[10px] text-gray-500">{school.level ? `Level: ${school.level}` : 'General'}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500" />
              </div>
            </Card>
          ))}
          {/* Online option */}
          <Card
            className="!p-4 cursor-pointer hover:border-teal-400 transition-all group"
            onClick={() => navigate('/teacher/grades/Online%20(Zoom)/Online')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-teal-600">Online (Zoom)</h3>
                <p className="text-[10px] text-gray-500">Kelas Virtual</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500" />
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
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/teacher/grades')} className="text-xs py-1.5 px-3">
            Kembali
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-600" /> Pilih Kelas
            </h2>
            <p className="text-xs text-gray-500">{selectedSchool} - Pilih kelas untuk melihat nilai siswa</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {availableClasses.map((cls) => {
            // Extract short label for icon (e.g., "KELAS 1 A" -> "1A", "1.1" -> "1")
            const shortLabel = cls.replace(/^KELAS\s*/i, '').replace(/\s+/g, '').split('.')[0];
            return (
              <Card
                key={cls}
                className="!p-3 cursor-pointer hover:border-orange-400 transition-all group text-center"
                onClick={() => navigate(`/teacher/grades/${encodeURIComponent(selectedSchool!)}/${encodeURIComponent(cls)}`)}
              >
                <div className="w-10 h-10 mx-auto mb-2 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <span className="text-xs font-bold truncate px-1">{shortLabel}</span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 group-hover:text-orange-600 line-clamp-2">{cls}</h3>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // --- GRADES LIST VIEW ---
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(`/teacher/grades/${encodeURIComponent(selectedSchool!)}`)} className="text-xs py-1.5 px-3">
            Ganti Kelas
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nilai Semester</h2>
            <p className="text-xs text-gray-500">{selectedSchool} - {selectedClass}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTestModal(true)}
            className="text-xs py-1.5 px-3 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            + Buat Jadwal Test
          </Button>
          <Button onClick={saveAllGrades} disabled={isSaving || gradesLoading} className="text-xs py-1.5 px-3">
            {isSaving ? 'Menyimpan...' : 'Simpan Semua'}
          </Button>
        </div>
      </div>

      {/* Academic Year and Semester Selector */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Tahun Ajaran:</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as '1' | '2')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              {selectedAcademicYear} - Semester {selectedSemester}
            </span>
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-700">
            Nilai Semester {selectedSemester} - TA {selectedAcademicYear}
          </h3>
          {gradesLoading && (
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Memuat nilai...
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-4 py-2">Student</th>
              <th className="px-2 py-2 text-center">Quiz 1</th>
              <th className="px-2 py-2 text-center">Quiz 2</th>
              <th className="px-2 py-2 text-center">Quiz 3</th>
              <th className="px-2 py-2 text-center">Participation</th>
              <th className="px-2 py-2 text-center">Mid Semester</th>
              <th className="px-2 py-2 text-center">Final Semester</th>
              <th className="px-2 py-2 text-center">Average</th>
              <th className="px-2 py-2 text-center">Grade</th>
              <th className="px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-xs italic">
                  Belum ada siswa di kelas {selectedClass} untuk sekolah ini.
                </td>
              </tr>
            ) : students.map((student) => {
              const grade = semesterGrades[student.id] || { quiz1: '', quiz2: '', quiz3: '', participation: '', mid: '', final: '' };

              // Calculate average from all filled values
              const values = [grade.quiz1, grade.quiz2, grade.quiz3, grade.participation, grade.mid, grade.final]
                .filter(v => v !== '' && v !== undefined)
                .map(v => parseInt(v));
              const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="flex items-center gap-2 text-left hover:text-purple-600 transition-colors"
                    >
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-[10px]">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 hover:text-purple-600">{student.name}</span>
                        <p className="text-[9px] text-gray-400">{student.email}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-gray-300" />
                    </button>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grade.quiz1}
                      onChange={e => setSemesterGrades({
                        ...semesterGrades,
                        [student.id]: { ...grade, quiz1: e.target.value }
                      })}
                      className="w-14 px-1 py-1 border rounded text-center text-xs"
                      placeholder="0-100"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grade.quiz2}
                      onChange={e => setSemesterGrades({
                        ...semesterGrades,
                        [student.id]: { ...grade, quiz2: e.target.value }
                      })}
                      className="w-14 px-1 py-1 border rounded text-center text-xs"
                      placeholder="0-100"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grade.quiz3}
                      onChange={e => setSemesterGrades({
                        ...semesterGrades,
                        [student.id]: { ...grade, quiz3: e.target.value }
                      })}
                      className="w-14 px-1 py-1 border rounded text-center text-xs"
                      placeholder="0-100"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grade.participation}
                      onChange={e => setSemesterGrades({
                        ...semesterGrades,
                        [student.id]: { ...grade, participation: e.target.value }
                      })}
                      className="w-14 px-1 py-1 border rounded text-center text-xs"
                      placeholder="0-100"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grade.mid}
                      onChange={e => setSemesterGrades({
                        ...semesterGrades,
                        [student.id]: { ...grade, mid: e.target.value }
                      })}
                      className="w-14 px-1 py-1 border rounded text-center text-xs"
                      placeholder="0-100"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grade.final}
                      onChange={e => setSemesterGrades({
                        ...semesterGrades,
                        [student.id]: { ...grade, final: e.target.value }
                      })}
                      className="w-14 px-1 py-1 border rounded text-center text-xs"
                      placeholder="0-100"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {avg !== null ? (
                      <span className={`font-bold ${avg >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {avg}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {avg !== null ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLetterGrade(avg).color}`}>
                        {getLetterGrade(avg).letter}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => saveSemesterGrade(student.id)}
                      disabled={isSaving}
                      className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-[9px] font-bold uppercase hover:bg-purple-600 hover:text-white transition-all border border-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? '...' : 'Simpan'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Test Creation Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Buat Jadwal Test</h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Test Info */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>{selectedSchool}</strong> - Kelas <strong>{selectedClass}</strong>
                </p>
                <p className="text-[10px] text-blue-600 mt-1">
                  TA {selectedAcademicYear} - Semester {selectedSemester}
                </p>
              </div>

              {/* Test Type */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Jenis Test *
                </label>
                <div className="flex gap-2">
                  {(['QUIZ', 'MID_SEMESTER', 'FINAL_SEMESTER'] as TestType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTestType(type)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                        testType === type
                          ? TEST_TYPE_COLORS[type]
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {TEST_TYPE_LABELS[type].split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                  Judul Test *
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder={`${TEST_TYPE_LABELS[testType]} - Chapter 5`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  placeholder="Materi yang diujikan, catatan untuk siswa, dll."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Class Type Selection */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Jenis Kelas <span className="text-red-500">*</span>
                </label>
                {hasOnlyOneClassType ? (
                  <div className="px-3 py-2 bg-gray-100 rounded-lg text-xs text-gray-700 font-medium">
                    {testClassType === ClassType.BILINGUAL ? (
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" /> Bilingual</span>
                    ) : (
                      <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-teal-500" /> Regular</span>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTestClassType(ClassType.BILINGUAL)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold transition-all ${
                        testClassType === ClassType.BILINGUAL
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Globe className="w-3 h-3" /> Bilingual
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestClassType(ClassType.REGULAR)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold transition-all ${
                        testClassType === ClassType.REGULAR
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <UserCheck className="w-3 h-3" /> Regular
                    </button>
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                  Tanggal Test *
                </label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                    Waktu Mulai
                  </label>
                  <input
                    type="time"
                    value={testStartTime}
                    onChange={(e) => setTestStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                    Waktu Selesai
                  </label>
                  <input
                    type="time"
                    value={testEndTime}
                    onChange={(e) => setTestEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Upload Materi (PDF, DOC, PPT, Gambar)
                </label>

                {/* Upload Zone */}
                <div
                  onClick={() => !isUploadingTest && testFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isUploadingTest
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {isUploadingTest ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="text-xs text-gray-500">Mengupload...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-[10px] text-gray-400">
                        Klik untuk pilih file atau drag & drop
                      </p>
                      <p className="text-[9px] text-gray-300 mt-1">
                        Maks. 10MB per file
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={testFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  onChange={handleTestFileSelect}
                  className="hidden"
                />

                {/* Upload Error */}
                {testUploadError && (
                  <div className="text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    {testUploadError}
                  </div>
                )}

                {/* Uploaded Files List */}
                {testUploadedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {testUploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <File className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-xs text-gray-700 truncate flex-1">
                          {file.fileName}
                        </span>
                        <button
                          onClick={() => handleRemoveTestFile(idx)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTestModal(false)}
                className="text-xs py-1.5 px-3"
              >
                Batal
              </Button>
              <Button
                onClick={handleCreateTest}
                disabled={isCreatingTest || !testDate || !testTitle || !testClassType}
                className="text-xs py-1.5 px-3"
              >
                {isCreatingTest ? 'Membuat...' : 'Buat Jadwal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

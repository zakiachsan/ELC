import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../Card';
import { Button } from '../Button';
import { useLocations, useClasses } from '../../hooks/useProfiles';
import { useAuth } from '../../contexts/AuthContext';
import { testsService, TestType, TestScheduleInsert, ParsedQuestion, QuestionType } from '../../services/tests.service';
import {
  ArrowLeft, Loader2, Plus, Trash2, X, Calendar, Clock,
  FileText, Eye, CheckCircle, Circle, Edit2,
  AlertCircle, ChevronDown, ChevronUp,
  HelpCircle
} from 'lucide-react';
import { uploadFile, isAllowedFileType, UploadResult } from '../../lib/storage';
import type { Database } from '../../lib/database.types';

type TestQuestion = Database['public']['Tables']['test_questions']['Row'];

// Generate academic year options
const generateAcademicYears = (): string[] => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = -1; i <= 1; i++) {
    const startYear = currentYear + i;
    years.push(`${startYear}/${startYear + 1}`);
  }
  return years;
};

// Helper function to get timezone offset string
const getTimezoneOffset = (): string => {
  const offset = new Date().getTimezoneOffset();
  const sign = offset <= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
};

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

interface QuestionFormData {
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswerIndex: number | null;
  answerKey: string;
  points: number;
}

const defaultQuestionForm: QuestionFormData = {
  type: 'MULTIPLE_CHOICE',
  text: '',
  options: ['', '', '', ''],
  correctAnswerIndex: null,
  answerKey: '',
  points: 1,
};

// Local question type for unsaved questions
interface LocalQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswerIndex: number | null;
  answerKey: string;
  points: number;
  order: number;
}

// Class entry with time
interface ClassTimeEntry {
  className: string;
  startTime: string;
  endTime: string;
}

export const TestCreator: React.FC = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId?: string }>();
  const [searchParams] = useSearchParams();
  const { user: currentTeacher } = useAuth();
  const isEditMode = !!testId;

  // Get school and class from URL params
  const schoolFromUrl = searchParams.get('school');
  const classFromUrl = searchParams.get('class');

  // Location/Class data
  const { locations: locationsData, loading: locationsLoading } = useLocations();

  // Form state - Basic Info
  const [selectedSchool, setSelectedSchool] = useState<string>(schoolFromUrl || '');
  const [testType, setTestType] = useState<TestType>('QUIZ');
  const [quizNumber, setQuizNumber] = useState<1 | 2 | 3>(1); // For Quiz type
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testDate, setTestDate] = useState('');
  const [hasOnlineTest, setHasOnlineTest] = useState(true);

  // Multi-class entries with time
  const [classEntries, setClassEntries] = useState<ClassTimeEntry[]>([]);

  // Academic year
  const academicYears = generateAcademicYears();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultAcademicYear = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
  const defaultSemester = currentMonth >= 6 ? '1' : '2';
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(defaultAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(defaultSemester as '1' | '2');

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormData>(defaultQuestionForm);

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [importPreview, setImportPreview] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    questions: true,
  });
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Get location ID for the selected school
  const selectedLocationId = selectedSchool
    ? locationsData.find(l => l.name === selectedSchool)?.id
    : undefined;

  // Load classes for selected location
  const { classes: locationClasses, loading: classesLoading } = useClasses(selectedLocationId);

  // Filter schools to teacher's assigned schools
  const schools = locationsData
    .filter(l => {
      if (currentTeacher?.assignedLocationIds && currentTeacher.assignedLocationIds.length > 0) {
        return currentTeacher.assignedLocationIds.includes(l.id);
      }
      if (currentTeacher?.assignedLocationId) {
        return l.id === currentTeacher.assignedLocationId;
      }
      return true;
    })
    .map(l => ({
      id: l.id,
      name: l.name,
      level: l.level || null,
    }));

  // Get available classes
  const getAvailableClasses = (): string[] => {
    const locationClassNames = locationClasses.map(c => c.name);
    if (currentTeacher?.assignedClasses && currentTeacher.assignedClasses.length > 0) {
      const filteredClasses = currentTeacher.assignedClasses.filter(teacherClass =>
        locationClassNames.includes(teacherClass)
      );
      if (filteredClasses.length > 0) return filteredClasses;
      if (locationClassNames.length > 0) return locationClassNames;
    }
    if (locationClassNames.length > 0) return locationClassNames;

    // Generate based on level
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
      default:
        for (let grade = 1; grade <= 12; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push(`${grade}.${section}`);
          }
        }
    }
    return classes;
  };

  const availableClasses = selectedSchool ? getAvailableClasses() : [];

  // Set school from URL on mount
  useEffect(() => {
    if (schoolFromUrl && !selectedSchool) {
      setSelectedSchool(schoolFromUrl);
    }
  }, [schoolFromUrl]);

  // Set class from URL on mount (with default times)
  useEffect(() => {
    if (classFromUrl && classEntries.length === 0 && !isEditMode) {
      setClassEntries([{
        className: classFromUrl,
        startTime: '08:00',
        endTime: '09:00',
      }]);
    }
  }, [classFromUrl, isEditMode]);

  // Load existing test if editing
  useEffect(() => {
    if (isEditMode && testId) {
      loadExistingTest();
    }
  }, [testId, isEditMode]);

  const loadExistingTest = async () => {
    if (!testId) return;
    setLoadingExisting(true);
    try {
      const test = await testsService.getById(testId);
      if (test) {
        setSelectedSchool(test.location || '');
        setTestType(test.test_type);
        setTestTitle(test.title);
        setTestDescription(test.description || '');
        const dateTime = new Date(test.date_time);
        setTestDate(dateTime.toISOString().split('T')[0]);

        // Parse quiz_number from test if available
        if (test.test_type === 'QUIZ' && test.quiz_number) {
          setQuizNumber(test.quiz_number as 1 | 2 | 3);
        }

        // Set class entry
        const startTimeStr = dateTime.toTimeString().slice(0, 5);
        // Calculate end time from duration
        const endDate = new Date(dateTime.getTime() + (test.duration_minutes || 60) * 60000);
        const endTimeStr = endDate.toTimeString().slice(0, 5);

        setClassEntries([{
          className: test.class_name || '',
          startTime: startTimeStr,
          endTime: endTimeStr,
        }]);

        setSelectedAcademicYear(test.academic_year || defaultAcademicYear);
        setSelectedSemester((test.semester || defaultSemester) as '1' | '2');
        setHasOnlineTest(test.has_online_test ?? true);

        // Load materials
        if (test.materials && test.materials.length > 0) {
          setUploadedFiles(test.materials.map(url => ({
            url,
            fileName: url.split('/').pop() || url,
            path: url,
          })));
        }

        // Load questions
        const existingQuestions = await testsService.getQuestions(testId);
        setQuestions(existingQuestions.map(q => ({
          id: q.id,
          type: q.question_type,
          text: q.question_text,
          options: q.options || [],
          correctAnswerIndex: q.correct_answer_index,
          answerKey: q.answer_key || '',
          points: q.points,
          order: q.question_order,
        })));
      }
    } catch (err) {
      console.error('Error loading test:', err);
      setError('Failed to load test data');
    } finally {
      setLoadingExisting(false);
    }
  };

  // Class entry handlers
  const toggleClassEntry = (className: string) => {
    const exists = classEntries.find(e => e.className === className);
    if (exists) {
      setClassEntries(classEntries.filter(e => e.className !== className));
    } else {
      setClassEntries([...classEntries, { className, startTime: '08:00', endTime: '09:00' }]);
    }
  };

  const updateClassEntryTime = (className: string, field: 'startTime' | 'endTime', value: string) => {
    setClassEntries(classEntries.map(e =>
      e.className === className ? { ...e, [field]: value } : e
    ));
  };

  const removeClassEntry = (className: string) => {
    setClassEntries(classEntries.filter(e => e.className !== className));
  };

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!isAllowedFileType(file)) {
          setUploadError(`File "${file.name}" is not supported.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`File "${file.name}" is too large. Maximum 10MB.`);
          continue;
        }
        const result = await uploadFile(file, 'tests');
        setUploadedFiles(prev => [...prev, result]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Failed to upload file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Question form handlers
  const updateFormField = (field: keyof QuestionFormData, value: any) => {
    setQuestionForm(prev => ({ ...prev, [field]: value }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    if (questionForm.options.length < 6) {
      setQuestionForm(prev => ({ ...prev, options: [...prev.options, ''] }));
    }
  };

  const removeOption = (index: number) => {
    if (questionForm.options.length > 2) {
      const newOptions = questionForm.options.filter((_, i) => i !== index);
      let newCorrectIndex = questionForm.correctAnswerIndex;
      if (newCorrectIndex !== null) {
        if (newCorrectIndex === index) newCorrectIndex = null;
        else if (newCorrectIndex > index) newCorrectIndex--;
      }
      setQuestionForm(prev => ({ ...prev, options: newOptions, correctAnswerIndex: newCorrectIndex }));
    }
  };

  const handleAddQuestion = () => {
    if (!questionForm.text.trim()) {
      setError('Question text is required');
      return;
    }

    if (questionForm.type === 'MULTIPLE_CHOICE') {
      const filledOptions = questionForm.options.filter(o => o.trim());
      if (filledOptions.length < 2) {
        setError('At least 2 options are required');
        return;
      }
      if (questionForm.correctAnswerIndex === null) {
        setError('Please select the correct answer');
        return;
      }
    }

    const newQuestion: LocalQuestion = {
      id: editingQuestionId || `temp-${Date.now()}`,
      type: questionForm.type,
      text: questionForm.text.trim(),
      options: questionForm.type === 'MULTIPLE_CHOICE' ? questionForm.options.filter(o => o.trim()) : [],
      correctAnswerIndex: questionForm.type === 'MULTIPLE_CHOICE' ? questionForm.correctAnswerIndex : null,
      answerKey: questionForm.type === 'ESSAY' ? questionForm.answerKey.trim() : '',
      points: questionForm.points,
      order: editingQuestionId
        ? questions.find(q => q.id === editingQuestionId)?.order || questions.length + 1
        : questions.length + 1,
    };

    if (editingQuestionId) {
      setQuestions(prev => prev.map(q => q.id === editingQuestionId ? newQuestion : q));
    } else {
      setQuestions(prev => [...prev, newQuestion]);
    }

    resetQuestionForm();
    setError(null);
  };

  const handleEditQuestion = (question: LocalQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionForm({
      type: question.type,
      text: question.text,
      options: question.options.length > 0 ? question.options : ['', '', '', ''],
      correctAnswerIndex: question.correctAnswerIndex,
      answerKey: question.answerKey,
      points: question.points,
    });
    setShowAddQuestionForm(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const resetQuestionForm = () => {
    setShowAddQuestionForm(false);
    setEditingQuestionId(null);
    setQuestionForm(defaultQuestionForm);
  };

  // Import handlers
  const handleParseImport = () => {
    if (!importText.trim()) {
      setError('Please paste your questions text');
      return;
    }
    const parsed = testsService.parseQuestionsFromText(importText);
    if (parsed.length === 0) {
      setError('No questions could be parsed. Please check the format.');
      return;
    }
    setParsedQuestions(parsed);
    setImportPreview(true);
    setError(null);
  };

  const handleConfirmImport = () => {
    const startOrder = questions.length + 1;
    const importedQuestions: LocalQuestion[] = parsedQuestions.map((q, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      type: q.type,
      text: q.text,
      options: q.options || [],
      correctAnswerIndex: q.correctAnswerIndex ?? null,
      answerKey: q.answerKey || '',
      points: q.points || 1,
      order: startOrder + idx,
    }));
    setQuestions(prev => [...prev, ...importedQuestions]);
    resetImport();
  };

  const resetImport = () => {
    setShowImportModal(false);
    setImportText('');
    setParsedQuestions([]);
    setImportPreview(false);
  };

  // Calculate duration from start and end time
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return Math.max(endMinutes - startMinutes, 0);
  };

  // Save test
  const handleSave = async (publish: boolean = false) => {
    // Validation
    if (!selectedSchool) {
      setError('Please select a school');
      return;
    }
    if (classEntries.length === 0) {
      setError('Please select at least one class');
      return;
    }
    if (!testTitle.trim()) {
      setError('Please enter a test title');
      return;
    }
    if (!testDate) {
      setError('Please select a test date');
      return;
    }

    if (hasOnlineTest && questions.length === 0) {
      const proceed = confirm('No questions added. Save test without online questions?');
      if (!proceed) return;
    }

    setSaving(true);
    setError(null);

    try {
      const tzOffset = getTimezoneOffset();
      const materialUrls = uploadedFiles.map(f => f.url);

      // Create a test for each class entry
      for (const entry of classEntries) {
        const dateTime = `${testDate}T${entry.startTime}:00${tzOffset}`;
        const duration = calculateDuration(entry.startTime, entry.endTime);

        const testData: TestScheduleInsert = {
          teacher_id: currentTeacher?.id || null,
          test_type: testType,
          title: testTitle.trim(),
          description: testDescription.trim() || null,
          date_time: dateTime,
          duration_minutes: duration,
          location: selectedSchool,
          class_name: entry.className,
          academic_year: selectedAcademicYear,
          semester: selectedSemester,
          materials: materialUrls,
          has_online_test: hasOnlineTest,
          is_published: publish,
          quiz_number: testType === 'QUIZ' ? quizNumber : null,
        };

        let savedTestId: string;

        if (isEditMode && testId && classEntries.length === 1) {
          // Only update if editing single test
          await testsService.update(testId, testData);
          savedTestId = testId;

          // Delete existing questions and re-add
          const existingQuestions = await testsService.getQuestions(testId);
          for (const q of existingQuestions) {
            await testsService.deleteQuestion(q.id);
          }
        } else {
          const newTest = await testsService.create(testData);
          savedTestId = newTest.id;
        }

        // Save questions for each test
        if (hasOnlineTest && questions.length > 0) {
          for (const q of questions) {
            await testsService.createQuestion({
              test_schedule_id: savedTestId,
              question_type: q.type,
              question_text: q.text,
              options: q.options,
              correct_answer_index: q.correctAnswerIndex,
              answer_key: q.answerKey || null,
              points: q.points,
              question_order: q.order,
            });
          }
        }
      }

      const message = classEntries.length > 1
        ? `Successfully created ${classEntries.length} test schedules!`
        : publish ? 'Test published successfully!' : 'Test saved successfully!';

      alert(message);
      navigate('/teacher/tests');
    } catch (err) {
      console.error('Error saving test:', err);
      setError('Failed to save test. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle section
  const toggleSection = (section: 'basicInfo' | 'questions') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (locationsLoading || loadingExisting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/teacher/tests')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {isEditMode ? 'Edit Test Schedule' : 'Create Test Schedule'}
              </h1>
              <p className="text-xs text-gray-500">
                {isEditMode ? 'Update test details and questions' : 'Set up test info and add questions'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="text-xs"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="text-xs"
            >
              {saving ? 'Saving...' : 'Save & Publish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 mt-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Basic Info Section */}
        <Card className="!p-0 overflow-hidden">
          <button
            onClick={() => toggleSection('basicInfo')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-bold text-gray-900">Basic Information</h2>
                <p className="text-[10px] text-gray-500">Test type, schedule, and details</p>
              </div>
            </div>
            {expandedSections.basicInfo ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.basicInfo && (
            <div className="p-6 space-y-4">
              {/* School Selection */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                  School <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => {
                    setSelectedSchool(e.target.value);
                    setClassEntries([]);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select school...</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Academic Year & Semester */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Academic Year</label>
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value as '1' | '2')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="1">Semester 1 (Odd)</option>
                    <option value="2">Semester 2 (Even)</option>
                  </select>
                </div>
              </div>

              {/* Test Type */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">Test Type</label>
                <div className="flex gap-2">
                  {(['QUIZ', 'MID_SEMESTER', 'FINAL_SEMESTER'] as TestType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setTestType(type)}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border-2 transition-all ${
                        testType === type
                          ? TEST_TYPE_COLORS[type]
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {TEST_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quiz Number - Only show for Quiz type */}
              {testType === 'QUIZ' && (
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">
                    Quiz Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {([1, 2, 3] as const).map(num => (
                      <button
                        key={num}
                        onClick={() => setQuizNumber(num)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border-2 transition-all ${
                          quizNumber === num
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Quiz {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    This will integrate with student grades (Quiz 1/2/3 field)
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                  Test Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Quiz 1 - Grammar"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                  Test Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Class Selection with Time */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">
                  Select Classes <span className="text-red-500">*</span>
                </label>

                {selectedSchool ? (
                  <>
                    {/* Class selection grid */}
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-1 mb-3 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
                      {classesLoading ? (
                        <span className="col-span-full text-xs text-gray-400 text-center py-2">Loading classes...</span>
                      ) : availableClasses.length === 0 ? (
                        <span className="col-span-full text-xs text-gray-400 text-center py-2">No classes available</span>
                      ) : (
                        availableClasses.map(cls => {
                          const isSelected = classEntries.some(e => e.className === cls);
                          return (
                            <button
                              key={cls}
                              onClick={() => toggleClassEntry(cls)}
                              className={`p-1.5 rounded text-[10px] font-bold transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              {cls}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Selected classes with time */}
                    {classEntries.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Time per Class</p>
                        {classEntries.map(entry => (
                          <div key={entry.className} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                            <span className="text-xs font-bold text-gray-700 w-20 truncate">{entry.className}</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="time"
                                value={entry.startTime}
                                onChange={(e) => updateClassEntryTime(entry.className, 'startTime', e.target.value)}
                                className="px-2 py-1 border rounded text-xs w-24"
                              />
                              <span className="text-gray-400 text-xs">-</span>
                              <input
                                type="time"
                                value={entry.endTime}
                                onChange={(e) => updateClassEntryTime(entry.className, 'endTime', e.target.value)}
                                className="px-2 py-1 border rounded text-xs w-24"
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 ml-auto">
                              {calculateDuration(entry.startTime, entry.endTime)} min
                            </span>
                            <button
                              onClick={() => removeClassEntry(entry.className)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Please select a school first</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Description (optional)</label>
                <textarea
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  placeholder="Topics to be tested..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                  Materials (optional)
                </label>
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isUploading
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                      <span className="text-xs text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400">Click to upload (PDF, DOC, PPT, Images)</p>
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
                {uploadError && (
                  <p className="text-[10px] text-red-600 mt-1">{uploadError}</p>
                )}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                        <span className="text-xs text-gray-700 truncate flex-1">{file.fileName}</span>
                        <button
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Online Test Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-gray-900">Online Test</p>
                  <p className="text-[10px] text-gray-500">Students take the test on the website</p>
                </div>
                <button
                  onClick={() => setHasOnlineTest(!hasOnlineTest)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    hasOnlineTest ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    hasOnlineTest ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Questions Section */}
        {hasOnlineTest && (
          <Card className="!p-0 overflow-hidden">
            <button
              onClick={() => toggleSection('questions')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-bold text-gray-900">Questions</h2>
                  <p className="text-[10px] text-gray-500">{questions.length} questions added</p>
                </div>
              </div>
              {expandedSections.questions ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.questions && (
              <div className="p-6">
                {/* Action Buttons */}
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowImportModal(true)}
                    className="text-xs"
                  >
                    Import from Docs
                  </Button>
                  <Button
                    onClick={() => {
                      resetQuestionForm();
                      setShowAddQuestionForm(true);
                    }}
                    className="text-xs"
                  >
                    Add Question
                  </Button>
                </div>

                {/* Questions List */}
                {questions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No questions yet</p>
                    <p className="text-xs text-gray-400">Add questions manually or import from docs</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, index) => (
                      <div key={q.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                q.type === 'MULTIPLE_CHOICE'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {q.type === 'MULTIPLE_CHOICE' ? 'MC' : 'Essay'}
                              </span>
                              <span className="text-[10px] text-gray-400">{q.points} pts</span>
                            </div>
                            <p className="text-sm text-gray-900 line-clamp-2">{q.text}</p>
                            {q.type === 'MULTIPLE_CHOICE' && q.options.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {q.options.map((opt, optIdx) => (
                                  <span
                                    key={optIdx}
                                    className={`text-[10px] px-2 py-0.5 rounded ${
                                      optIdx === q.correctAnswerIndex
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-white text-gray-500 border border-gray-200'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIdx)}. {opt.slice(0, 20)}{opt.length > 20 ? '...' : ''}
                                    {optIdx === q.correctAnswerIndex && ' ✓'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Add/Edit Question Modal */}
      {showAddQuestionForm && (
        <div className="fixed inset-0 z-[110] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editingQuestionId ? 'Edit Question' : 'Add Question'}
              </h3>
              <button onClick={resetQuestionForm} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Question Type */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">Question Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateFormField('type', 'MULTIPLE_CHOICE')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold border-2 transition-all ${
                      questionForm.type === 'MULTIPLE_CHOICE'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    Multiple Choice
                  </button>
                  <button
                    onClick={() => updateFormField('type', 'ESSAY')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold border-2 transition-all ${
                      questionForm.type === 'ESSAY'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                    }`}
                  >
                    Essay
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Question Text *</label>
                <textarea
                  value={questionForm.text}
                  onChange={(e) => updateFormField('text', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter your question here..."
                />
              </div>

              {/* MC Options */}
              {questionForm.type === 'MULTIPLE_CHOICE' && (
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">
                    Options (click letter to mark correct) *
                  </label>
                  <div className="space-y-2">
                    {questionForm.options.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateFormField('correctAnswerIndex', index)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                            questionForm.correctAnswerIndex === index
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        />
                        {questionForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {questionForm.options.length < 6 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Essay Answer Key */}
              {questionForm.type === 'ESSAY' && (
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                    Answer Key / Rubric (optional)
                  </label>
                  <textarea
                    value={questionForm.answerKey}
                    onChange={(e) => updateFormField('answerKey', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                    placeholder="Expected answer or grading rubric..."
                  />
                </div>
              )}

              {/* Points */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Points</label>
                <input
                  type="number"
                  value={questionForm.points}
                  onChange={(e) => updateFormField('points', parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min={1}
                  max={100}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={resetQuestionForm}>
                Cancel
              </Button>
              <Button onClick={handleAddQuestion}>
                {editingQuestionId ? 'Update' : 'Add'} Question
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[110] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Import Questions from Docs</h3>
              <button onClick={resetImport} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {!importPreview ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">Supported Format:</h4>
                    <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-blue-200">
{`[PG] What is the capital of France?
A. London
B. Paris *
C. Berlin
D. Madrid

[ESSAY] Explain the importance of learning English.
KEY: English is important because...

[PG] Which word is a noun?
A. Run
B. Beautiful
C. Computer *
D. Quickly`}
                    </pre>
                    <p className="text-[10px] text-blue-700 mt-2">
                      Use [PG] or [MC] for Multiple Choice, [ESSAY] for Essay. Mark correct answer with * at the end.
                    </p>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                      Paste your questions here
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-purple-500"
                      rows={12}
                      placeholder="Paste your questions from Google Docs here..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900">
                      Preview: {parsedQuestions.length} questions found
                    </h4>
                    <button
                      onClick={() => setImportPreview(false)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Edit Text
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {parsedQuestions.map((q, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded flex items-center justify-center text-xs font-bold shrink-0">
                            {index + 1}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            q.type === 'MULTIPLE_CHOICE'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {q.type === 'MULTIPLE_CHOICE' ? 'MC' : 'Essay'}
                          </span>
                          <p className="text-sm text-gray-900">{q.text}</p>
                        </div>
                        {q.type === 'MULTIPLE_CHOICE' && q.options && (
                          <div className="ml-8 grid grid-cols-2 gap-1">
                            {q.options.map((opt, optIndex) => (
                              <div
                                key={optIndex}
                                className={`text-xs px-2 py-1 rounded ${
                                  optIndex === q.correctAnswerIndex
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-white text-gray-600'
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}. {opt}
                                {optIndex === q.correctAnswerIndex && ' ✓'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={resetImport}>
                Cancel
              </Button>
              {!importPreview ? (
                <Button onClick={handleParseImport} disabled={!importText.trim()}>
                  Preview
                </Button>
              ) : (
                <Button onClick={handleConfirmImport} disabled={parsedQuestions.length === 0}>
                  Import {parsedQuestions.length} Questions
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCreator;

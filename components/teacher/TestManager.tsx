import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../Card';
import { Button } from '../Button';
import { useTests } from '../../hooks/useTests';
import { useLocations } from '../../hooks/useProfiles';
import { useAuth } from '../../contexts/AuthContext';
import { TestSchedule, TestType, TestScheduleInsert } from '../../services/tests.service';
import { ClassType } from '../../types';
import {
  School, ChevronRight, GraduationCap, Calendar, Clock,
  Plus, Loader2, FileText, ClipboardList, BookOpen,
  Edit, Trash2, X, Save, ArrowLeft, Upload, File, Download, Globe, UserCheck
} from 'lucide-react';
import { uploadFile, isAllowedFileType, UploadResult } from '../../lib/storage';

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

interface MultiClassTestEntry {
  classId: string;
  startTime: string;
  endTime: string;
}

export const TestManager: React.FC = () => {
  const { schoolId, classId } = useParams<{ schoolId?: string; classId?: string }>();
  const navigate = useNavigate();
  const { user: currentTeacher } = useAuth();
  const { locations: locationsData, loading: locationsLoading } = useLocations();

  // Derive selected school and class from URL params
  const selectedSchool = schoolId ? decodeURIComponent(schoolId) : null;
  const selectedClass = classId ? decodeURIComponent(classId) : null;

  // Fetch tests based on current selection
  const { tests: testsData, loading: testsLoading, createTest, deleteTest, refetch } = useTests({
    location: selectedSchool || undefined,
    className: selectedClass || undefined,
  });

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMultiClassModal, setShowMultiClassModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestSchedule | null>(null);

  // Academic year state
  const academicYears = generateAcademicYears();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultAcademicYear = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
  const defaultSemester = currentMonth >= 6 ? '1' : '2';

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(defaultAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(defaultSemester as '1' | '2');

  // Multi-class test form state
  const [multiClassDates, setMultiClassDates] = useState<string[]>([]);
  const [tempDate, setTempDate] = useState('');
  const [multiClassEntries, setMultiClassEntries] = useState<MultiClassTestEntry[]>([]);
  const [testType, setTestType] = useState<TestType>('QUIZ');
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testDuration, setTestDuration] = useState(60);

  // File upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Class type state
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

  // Navigation helpers
  const navigateToSchool = (schoolName: string) => {
    navigate(`/teacher/tests/${encodeURIComponent(schoolName)}`);
  };

  const navigateToClass = (className: string) => {
    if (selectedSchool) {
      navigate(`/teacher/tests/${encodeURIComponent(selectedSchool)}/${encodeURIComponent(className)}`);
    }
  };

  const navigateBack = () => {
    if (selectedClass) {
      navigate(`/teacher/tests/${encodeURIComponent(selectedSchool!)}`);
    } else if (selectedSchool) {
      navigate('/teacher/tests');
    }
  };

  // Map schools/locations
  const schools = locationsData
    .filter(l => {
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

  // Get available classes based on school level
  const getAvailableClasses = (): string[] => {
    if (currentTeacher?.assignedClasses && currentTeacher.assignedClasses.length > 0) {
      return currentTeacher.assignedClasses;
    }
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
        for (let grade = 10; grade <= 12; grade++) {
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

  const availableClasses = getAvailableClasses();

  // Filter tests by date
  const now = new Date();
  const upcomingTests = testsData.filter(t => new Date(t.date_time) >= now);
  const pastTests = testsData.filter(t => new Date(t.date_time) < now);
  const displayedTests = activeTab === 'upcoming' ? upcomingTests : pastTests;

  // Reset multi-class form
  const resetMultiClassForm = () => {
    setMultiClassDates([]);
    setTempDate('');
    setMultiClassEntries([]);
    setTestType('QUIZ');
    setTestTitle('');
    setTestDescription('');
    setTestDuration(60);
    setUploadedFiles([]);
    setUploadError(null);
    setTestClassType(hasOnlyOneClassType ? teacherClassTypes[0] : '');
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
          setUploadError(`File "${file.name}" tidak didukung. Gunakan PDF, DOC, DOCX, PPT, PPTX, atau gambar.`);
          continue;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`File "${file.name}" terlalu besar. Maksimal 10MB.`);
          continue;
        }

        // Upload file
        const result = await uploadFile(file, 'tests');
        setUploadedFiles(prev => [...prev, result]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Gagal mengupload file. Silakan coba lagi.');
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

  // Add date to multi-class dates
  const addDate = () => {
    if (tempDate && !multiClassDates.includes(tempDate)) {
      setMultiClassDates([...multiClassDates, tempDate]);
      setTempDate('');
    }
  };

  // Remove date from multi-class dates
  const removeDate = (date: string) => {
    setMultiClassDates(multiClassDates.filter(d => d !== date));
  };

  // Add class entry
  const addClassEntry = (classId: string) => {
    if (!multiClassEntries.find(e => e.classId === classId)) {
      setMultiClassEntries([...multiClassEntries, { classId, startTime: '08:00', endTime: '09:00' }]);
    }
  };

  // Remove class entry
  const removeClassEntry = (classId: string) => {
    setMultiClassEntries(multiClassEntries.filter(e => e.classId !== classId));
  };

  // Update class entry time
  const updateClassEntryTime = (classId: string, field: 'startTime' | 'endTime', value: string) => {
    setMultiClassEntries(multiClassEntries.map(e =>
      e.classId === classId ? { ...e, [field]: value } : e
    ));
  };

  // Handle multi-class test creation
  const handleCreateMultiClassTests = async () => {
    if (multiClassDates.length === 0 || multiClassEntries.length === 0 || !testTitle || !selectedSchool || !testClassType) {
      alert('Harap lengkapi semua field yang diperlukan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tzOffset = getTimezoneOffset();
      // Collect material URLs from uploaded files
      const materialUrls = uploadedFiles.map(f => f.url);

      for (const date of multiClassDates) {
        for (const entry of multiClassEntries) {
          const dateTime = `${date}T${entry.startTime}:00${tzOffset}`;

          const testData: TestScheduleInsert = {
            teacher_id: currentTeacher?.id || null,
            test_type: testType,
            title: testTitle,
            description: testDescription || null,
            date_time: dateTime,
            duration_minutes: testDuration,
            location: selectedSchool,
            class_name: entry.classId,
            academic_year: selectedAcademicYear,
            semester: selectedSemester,
            materials: materialUrls,
            class_type: testClassType || 'REGULAR',
          };

          await createTest(testData);
        }
      }

      alert(`Berhasil membuat ${multiClassDates.length * multiClassEntries.length} jadwal test!`);
      setShowMultiClassModal(false);
      resetMultiClassForm();
      refetch();
    } catch (err) {
      console.error('Error creating tests:', err);
      alert('Gagal membuat jadwal test. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete test
  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal test ini?')) return;

    try {
      await deleteTest(testId);
      setSelectedTest(null);
      alert('Jadwal test berhasil dihapus.');
    } catch (err) {
      console.error('Error deleting test:', err);
      alert('Gagal menghapus jadwal test.');
    }
  };

  // Loading state
  if (locationsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  // School selection view
  if (!selectedSchool) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" /> Jadwal Test
            </h2>
            <p className="text-xs text-gray-500">Kelola jadwal Quiz, UTS, dan UAS.</p>
          </div>
        </div>

        <Card className="!p-4">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Pilih Sekolah</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {schools.map(school => (
              <button
                key={school.id}
                onClick={() => navigateToSchool(school.name)}
                className="p-4 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <School className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">{school.name}</h4>
                    {school.level && (
                      <span className="text-[10px] text-gray-500">{school.level}</span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </button>
            ))}
            {schools.length === 0 && (
              <p className="text-sm text-gray-400 italic col-span-full text-center py-8">
                Tidak ada sekolah yang tersedia.
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Class selection view
  if (!selectedClass) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={navigateBack} className="text-xs py-1.5 px-3">
              Kembali
            </Button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectedSchool}</h2>
              <p className="text-xs text-gray-500">Pilih kelas atau buat jadwal test untuk beberapa kelas.</p>
            </div>
          </div>
          <Button onClick={() => setShowMultiClassModal(true)} className="text-xs py-1.5 px-3">
            + Buat Jadwal Test
          </Button>
        </div>

        <Card className="!p-4">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Pilih Kelas</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {availableClasses.map(cls => (
              <button
                key={cls}
                onClick={() => navigateToClass(cls)}
                className="p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-lg text-center transition-all group"
              >
                <GraduationCap className="w-4 h-4 text-gray-400 group-hover:text-purple-600 mx-auto mb-1" />
                <span className="text-sm font-bold text-gray-900">{cls}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Multi-class Test Creation Modal */}
        {showMultiClassModal && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
                <h3 className="text-lg font-bold text-gray-900">Buat Jadwal Test</h3>
                <button onClick={() => { setShowMultiClassModal(false); resetMultiClassForm(); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Academic Year & Semester */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Tahun Ajaran</label>
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
                      <option value="1">Semester 1 (Ganjil)</option>
                      <option value="2">Semester 2 (Genap)</option>
                    </select>
                  </div>
                </div>

                {/* Test Type */}
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Jenis Test</label>
                  <div className="flex gap-2">
                    {(['QUIZ', 'MID_SEMESTER', 'FINAL_SEMESTER'] as TestType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setTestType(type)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
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

                {/* Title & Description */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Judul Test *</label>
                    <input
                      type="text"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g., Quiz 1 - Grammar"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Durasi (menit)</label>
                    <input
                      type="number"
                      value={testDuration}
                      onChange={(e) => setTestDuration(parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={15}
                      max={180}
                    />
                  </div>
                </div>

                {/* Class Type Selection */}
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                    Jenis Kelas <span className="text-red-500">*</span>
                  </label>
                  {hasOnlyOneClassType ? (
                    <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-700 font-medium">
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

                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Deskripsi (opsional)</label>
                  <textarea
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    rows={2}
                    placeholder="Materi yang diujikan..."
                  />
                </div>

                {/* File Upload Section */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase">
                    Upload Materi (PDF, DOC, PPT, Gambar)
                  </label>

                  {/* Upload Zone */}
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
                          <File className="w-4 h-4 text-purple-500 shrink-0" />
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

                {/* Dates */}
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Tanggal Test *</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="date"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <Button onClick={addDate} disabled={!tempDate} className="text-xs px-3">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  {multiClassDates.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {multiClassDates.map(date => (
                        <span key={date} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          <Calendar className="w-3 h-3" />
                          {new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                          <button onClick={() => removeDate(date)} className="ml-1 hover:text-purple-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Classes */}
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Pilih Kelas *</label>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-1 mb-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
                    {availableClasses.map(cls => {
                      const isSelected = multiClassEntries.some(e => e.classId === cls);
                      return (
                        <button
                          key={cls}
                          onClick={() => isSelected ? removeClassEntry(cls) : addClassEntry(cls)}
                          className={`p-1.5 rounded text-[10px] font-bold transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                  </div>

                  {/* Class time entries */}
                  {multiClassEntries.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Waktu per Kelas</p>
                      {multiClassEntries.map(entry => (
                        <div key={entry.classId} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                          <span className="text-xs font-bold text-gray-700 w-12">{entry.classId}</span>
                          <input
                            type="time"
                            value={entry.startTime}
                            onChange={(e) => updateClassEntryTime(entry.classId, 'startTime', e.target.value)}
                            className="px-2 py-1 border rounded text-xs"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="time"
                            value={entry.endTime}
                            onChange={(e) => updateClassEntryTime(entry.classId, 'endTime', e.target.value)}
                            className="px-2 py-1 border rounded text-xs"
                          />
                          <button onClick={() => removeClassEntry(entry.classId)} className="ml-auto text-red-500 hover:text-red-700">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
                <Button variant="outline" onClick={() => { setShowMultiClassModal(false); resetMultiClassForm(); }}>
                  Batal
                </Button>
                <Button
                  onClick={handleCreateMultiClassTests}
                  disabled={isSubmitting || multiClassDates.length === 0 || multiClassEntries.length === 0 || !testTitle || !testClassType}
                >
                  {isSubmitting ? 'Menyimpan...' : `Buat ${multiClassDates.length * multiClassEntries.length} Jadwal`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Class test list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={navigateBack} className="text-xs py-1.5 px-3">
            Ganti Kelas
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Jadwal Test</h2>
            <p className="text-xs text-gray-500">{selectedSchool} - Kelas {selectedClass}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${
              activeTab === 'upcoming' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Mendatang ({upcomingTests.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${
              activeTab === 'history' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Riwayat ({pastTests.length})
          </button>
        </div>
      </div>

      {/* Test List */}
      <Card className="!p-0 overflow-hidden">
        {testsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : displayedTests.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {activeTab === 'upcoming' ? 'Tidak ada jadwal test mendatang.' : 'Tidak ada riwayat test.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedTests.map(test => (
              <div
                key={test.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedTest(test)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      test.test_type === 'QUIZ' ? 'bg-blue-100' :
                      test.test_type === 'MID_SEMESTER' ? 'bg-orange-100' : 'bg-purple-100'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        test.test_type === 'QUIZ' ? 'text-blue-600' :
                        test.test_type === 'MID_SEMESTER' ? 'text-orange-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{test.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${TEST_TYPE_COLORS[test.test_type]}`}>
                          {TEST_TYPE_LABELS[test.test_type]}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {test.duration_minutes} menit
                        </span>
                      </div>
                      {test.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{test.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">
                      {new Date(test.date_time).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(test.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1">
                      TA {test.academic_year} / Sem {test.semester}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Test Detail Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Detail Test</h3>
              <button onClick={() => setSelectedTest(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedTest.test_type === 'QUIZ' ? 'bg-blue-100' :
                  selectedTest.test_type === 'MID_SEMESTER' ? 'bg-orange-100' : 'bg-purple-100'
                }`}>
                  <FileText className={`w-6 h-6 ${
                    selectedTest.test_type === 'QUIZ' ? 'text-blue-600' :
                    selectedTest.test_type === 'MID_SEMESTER' ? 'text-orange-600' : 'text-purple-600'
                  }`} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{selectedTest.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${TEST_TYPE_COLORS[selectedTest.test_type]}`}>
                    {TEST_TYPE_LABELS[selectedTest.test_type]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Tanggal</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(selectedTest.date_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Waktu</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(selectedTest.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Durasi</p>
                  <p className="text-sm font-bold text-gray-900">{selectedTest.duration_minutes} menit</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Periode</p>
                  <p className="text-sm font-bold text-gray-900">TA {selectedTest.academic_year} / Sem {selectedTest.semester}</p>
                </div>
              </div>

              {selectedTest.description && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Deskripsi</p>
                  <p className="text-sm text-gray-700">{selectedTest.description}</p>
                </div>
              )}

              {/* Materials Section */}
              {selectedTest.materials && selectedTest.materials.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Materi ({selectedTest.materials.length} file)</p>
                  <div className="space-y-1.5">
                    {selectedTest.materials.map((file, idx) => {
                      const fileName = file.split('/').pop() || file;
                      return (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100">
                          <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                          <a
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate flex-1"
                            title={fileName}
                          >
                            {fileName}
                          </a>
                          <a
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-purple-600"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50">
              <Button
                variant="outline"
                onClick={() => handleDeleteTest(selectedTest.id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Hapus
              </Button>
              <Button onClick={() => setSelectedTest(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManager;

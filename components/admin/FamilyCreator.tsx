
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Users, Link as LinkIcon, Lock, Mail, GraduationCap, Briefcase, Trash2, Pencil, MapPin, School, TrendingUp, UserCheck, Activity, ToggleLeft, ToggleRight, Camera, X as XIcon, Upload, ShieldAlert, Smartphone, Globe, Loader2, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { MOCK_USERS, MOCK_SCHOOLS, MOCK_SESSIONS, MOCK_SESSION_REPORTS } from '../../constants';
import { UserRole, User, ClassType } from '../../types';
import { useTeachers, useLocations, useParents, useStudentsPaginated, useClasses } from '../../hooks/useProfiles';
import { supabase } from '../../lib/supabase';

export const AccountManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'families' | 'teachers'>('families');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [mockUsers, setMockUsers] = useState(MOCK_USERS);

  // Supabase hooks for real data
  const { profiles: teachersData, loading: teachersLoading, updateProfile, refetch: refetchTeachers } = useTeachers();
  const { profiles: parentsData, loading: parentsLoading, refetch: refetchParents } = useParents();
  const { locations, loading: locationsLoading } = useLocations();

  // Pagination and filter state for families (moved up for hook dependency)
  const [familiesPage, setFamiliesPage] = useState(1);
  const [familiesSearch, setFamiliesSearch] = useState('');
  const [debouncedFamiliesSearch, setDebouncedFamiliesSearch] = useState('');
  const [familiesLocationFilter, setFamiliesLocationFilter] = useState(''); // locationId for server filter
  const familiesPageSize = 20;

  // Server-side paginated students for Families tab
  const {
    students: studentsData,
    totalCount: studentsTotalCount,
    totalPages: familiesTotalPages,
    loading: studentsLoading,
    refetch: refetchStudents
  } = useStudentsPaginated({
    page: familiesPage,
    pageSize: familiesPageSize,
    search: debouncedFamiliesSearch || undefined,
    locationId: familiesLocationFilter || undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [editTeacherId, setEditTeacherId] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string, name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentAddress, setParentAddress] = useState('');

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentLocationId, setStudentLocationId] = useState('');
  const [studentSchool, setStudentSchool] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [studentStatus, setStudentStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const [studentClassType, setStudentClassType] = useState<ClassType | ''>('');

  // Dynamic classes hook for student - after studentLocationId is defined
  const { classes: studentClasses, loading: classesLoading } = useClasses(studentLocationId || undefined);

  // Get selected student school's level for grade options
  const selectedStudentSchoolLevel = studentLocationId
    ? locations.find(l => l.id === studentLocationId)?.level || null
    : null;

  // Get grade options for student - use dynamic classes from DB if available
  const getStudentGradeOptions = (): string[] => {
    let classes: string[] = [];

    // If we have classes from the database, use those
    if (studentClasses && studentClasses.length > 0) {
      classes = studentClasses.map(c => c.name);
    } else {
      // Fallback to generated classes based on school level
      switch (selectedStudentSchoolLevel?.toUpperCase()) {
        case 'KINDERGARTEN':
          ['TK-A', 'TK-B'].forEach(c => {
            for (let i = 1; i <= 3; i++) classes.push(`${c}.${i}`);
          });
          break;
        case 'ELEMENTARY':
        case 'PRIMARY':
          for (let grade = 1; grade <= 6; grade++) {
            for (let section = 1; section <= 3; section++) {
              classes.push(`Kelas ${grade}.${section}`);
            }
          }
          break;
        case 'JUNIOR':
          for (let grade = 7; grade <= 9; grade++) {
            for (let section = 1; section <= 3; section++) {
              classes.push(`Kelas ${grade}.${section}`);
            }
          }
          break;
        case 'SENIOR':
          for (let grade = 10; grade <= 12; grade++) {
            for (let section = 1; section <= 3; section++) {
              classes.push(`Kelas ${grade}.${section}`);
            }
          }
          break;
        default:
          // General - show all
          for (let grade = 1; grade <= 12; grade++) {
            for (let section = 1; section <= 3; section++) {
              classes.push(`Kelas ${grade}.${section}`);
            }
          }
      }
    }

    // If student already has a grade/class that's not in the list, add it at the top
    // This handles cases where student's existing class doesn't match DB classes exactly
    if (studentGrade && !classes.includes(studentGrade)) {
      classes = [studentGrade, ...classes];
    }

    return classes;
  };

  const studentGradeOptions = getStudentGradeOptions();
  const hasDynamicClasses = studentClasses && studentClasses.length > 0;

  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherLocationIds, setTeacherLocationIds] = useState<string[]>([]); // Multi-select schools
  const [teacherStatus, setTeacherStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [teacherClassTypes, setTeacherClassTypes] = useState<ClassType[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [allClassesData, setAllClassesData] = useState<{id: string; location_id: string; name: string}[]>([]);
  const [allClassesLoading, setAllClassesLoading] = useState(false);

  // Fetch all classes when component mounts or locations change
  useEffect(() => {
    const fetchAllClasses = async () => {
      if (teacherLocationIds.length === 0) {
        setAllClassesData([]);
        return;
      }
      setAllClassesLoading(true);
      try {
        const { profilesService } = await import('../../services/profiles.service');
        const allClasses = await profilesService.getAllClasses();
        // Filter classes for selected locations
        const filtered = allClasses.filter((c: any) => teacherLocationIds.includes(c.location_id));
        setAllClassesData(filtered);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
        setAllClassesData([]);
      } finally {
        setAllClassesLoading(false);
      }
    };
    fetchAllClasses();
  }, [teacherLocationIds]);

  // Toggle teacher location selection
  const toggleTeacherLocation = (locationId: string) => {
    setTeacherLocationIds(prev => {
      const newIds = prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId];
      // Clear selected classes when locations change
      setTeacherClasses([]);
      return newIds;
    });
  };

  // Helper to generate class options based on school level (fallback if no dynamic classes)
  const getClassOptionsForLevel = (level: string | null): string[] => {
    const classes: string[] = [];
    switch (level?.toUpperCase()) {
      case 'KINDERGARTEN':
        ['TK-A', 'TK-B'].forEach(c => {
          for (let i = 1; i <= 3; i++) classes.push(`${c}.${i}`);
        });
        break;
      case 'ELEMENTARY':
      case 'PRIMARY':
        for (let grade = 1; grade <= 6; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push(`Kelas ${grade}.${section}`);
          }
        }
        break;
      case 'JUNIOR':
        for (let grade = 7; grade <= 9; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push(`Kelas ${grade}.${section}`);
          }
        }
        break;
      case 'SENIOR':
        for (let grade = 10; grade <= 12; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push(`Kelas ${grade}.${section}`);
          }
        }
        break;
      default:
        // General - show all classes
        ['TK-A', 'TK-B'].forEach(c => {
          for (let i = 1; i <= 3; i++) classes.push(`${c}.${i}`);
        });
        for (let grade = 1; grade <= 12; grade++) {
          for (let section = 1; section <= 3; section++) {
            classes.push(`Kelas ${grade}.${section}`);
          }
        }
    }
    return classes;
  };

  // Available classes for selected schools - use dynamic classes from DB
  // Group classes by location for better display (include schools even if they have no classes)
  const availableClassesByLocation = teacherLocationIds.length > 0
    ? teacherLocationIds.map(locId => {
        const location = locations.find(l => l.id === locId);
        const classesForLoc = allClassesData.filter(c => c.location_id === locId);
        return {
          locationId: locId,
          locationName: location?.name || 'Unknown',
          classes: classesForLoc.map(c => c.name),
          hasClasses: classesForLoc.length > 0
        };
      })
    : [];

  // Flat list of all available classes (for validation)
  const availableClasses = allClassesData.map(c => c.name);
  const hasTeacherDynamicClasses = allClassesData.length > 0;

  const toggleClass = (className: string) => {
    setTeacherClasses(prev =>
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BILINGUAL_SUBJECTS = [
    { id: 'english-reading', label: 'English - Reading', category: 'English' },
    { id: 'english-speaking', label: 'English - Speaking', category: 'English' },
    { id: 'english-listening', label: 'English - Listening', category: 'English' },
    { id: 'english-writing', label: 'English - Writing', category: 'English' },
    { id: 'conversation-speaking', label: 'Conversation - Speaking', category: 'Conversation' },
    { id: 'conversation-listening', label: 'Conversation - Listening', category: 'Conversation' },
    { id: 'math', label: 'Math', category: 'Other' },
    { id: 'science', label: 'Science', category: 'Other' },
  ];

  const REGULAR_SUBJECTS = [
    { id: 'conversational', label: 'Conversational', category: 'Main' },
  ];

  // Toggle teacher class type (multi-select)
  const toggleTeacherClassType = (type: ClassType) => {
    setTeacherClassTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleSubject = (subjectId: string) => {
    setTeacherSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(s => s !== subjectId)
        : [...prev, subjectId]
    );
  };

  const getTeacherMonthlyWorkload = (teacherId: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const sessionsThisMonth = MOCK_SESSIONS.filter(s => {
      const sDate = new Date(s.dateTime);
      return s.teacherId === teacherId &&
             sDate.getMonth() === currentMonth &&
             sDate.getFullYear() === currentYear;
    });

    const uniqueStudents = new Set<string>();
    sessionsThisMonth.forEach(s => {
      const reports = MOCK_SESSION_REPORTS[s.id] || [];
      reports.forEach(r => uniqueStudents.add(r.studentId));
    });

    return {
      studentCount: uniqueStudents.size,
      sessionCount: sessionsThisMonth.length
    };
  };

  // Get all schools for a teacher (handles both single and multi-school)
  const getTeacherSchools = (teacher: any): string[] => {
    const ids = teacher.assignedLocationIds && teacher.assignedLocationIds.length > 0
      ? teacher.assignedLocationIds
      : teacher.assignedLocationId
        ? [teacher.assignedLocationId]
        : [];
    return ids.map((id: string) => getSchoolName(id)).filter((name: string) => name && name !== 'Unknown' && name !== 'Belum Assign');
  };

  // Store student counts per class (branch) per location: { "locationId|className": count }
  const [classStudentCounts, setClassStudentCounts] = useState<Record<string, number>>({});
  // Store total student counts per location (fallback when no classes assigned)
  const [locationStudentCounts, setLocationStudentCounts] = useState<Record<string, number>>({});

  // Helper to extract class name from school_origin format (for counting)
  // e.g. "SD SANG TIMUR - KELAS 1 A (Regular)" -> "KELAS 1 A"
  const parseClassFromSchoolOrigin = (schoolOrigin?: string | null): string => {
    if (!schoolOrigin) return '';
    // Try format: "SCHOOL NAME - CLASS (TYPE)"
    const matchWithType = schoolOrigin.match(/^.+?\s*-\s*(.+?)\s*\((.+?)\)$/);
    if (matchWithType) {
      return matchWithType[1].trim();
    }
    // Try format: "SCHOOL NAME - CLASS"
    const matchSimple = schoolOrigin.match(/^.+?\s*-\s*(.+?)$/);
    if (matchSimple) {
      return matchSimple[1].trim();
    }
    return '';
  };

  // Fetch student counts per class when locations change
  useEffect(() => {
    const fetchStudentCounts = async () => {
      if (locations.length === 0) return;

      try {
        const { profilesService } = await import('../../services/profiles.service');
        const classCounts: Record<string, number> = {};
        const locationCounts: Record<string, number> = {};

        // Get all students and count by class (branch or parsed from school_origin) per location
        for (const loc of locations) {
          const students = await profilesService.getStudentsByLocation(loc.id);
          locationCounts[loc.id] = students.length;

          // Count students per class for this location
          for (const student of students as any[]) {
            // Use branch if available, otherwise parse from school_origin
            const className = student.branch || parseClassFromSchoolOrigin(student.school_origin);
            if (className) {
              const key = `${loc.id}|${className}`;
              classCounts[key] = (classCounts[key] || 0) + 1;
            }
          }
        }

        setClassStudentCounts(classCounts);
        setLocationStudentCounts(locationCounts);
      } catch (err) {
        console.error('Failed to fetch student counts:', err);
      }
    };

    fetchStudentCounts();
  }, [locations]);

  // Get student count for teacher based on assigned classes
  // If teacher has assigned classes, count students in those classes
  // Otherwise, fall back to total students in assigned schools
  const getTeacherStudentCount = (teacher: any): number => {
    const locationIds = teacher.assignedLocationIds && teacher.assignedLocationIds.length > 0
      ? teacher.assignedLocationIds
      : teacher.assignedLocationId
        ? [teacher.assignedLocationId]
        : [];

    const assignedClasses = teacher.assignedClasses || [];

    // If teacher has assigned classes, count students in those specific classes
    if (assignedClasses.length > 0) {
      let total = 0;
      for (const locId of locationIds) {
        for (const className of assignedClasses) {
          const key = `${locId}|${className}`;
          total += classStudentCounts[key] || 0;
        }
      }
      return total;
    }

    // Fallback: if no classes assigned, show total students in assigned schools
    return locationIds.reduce((total: number, locId: string) => {
      return total + (locationStudentCounts[locId] || 0);
    }, 0);
  };

  // Debounce search input for families
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFamiliesSearch(familiesSearch);
      setFamiliesPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [familiesSearch]);

  // Reset page when location filter changes
  useEffect(() => {
    setFamiliesPage(1);
  }, [familiesLocationFilter]);

  // Helper to get school name from locationId
  const getStudentSchoolName = (assignedLocationId?: string | null): string => {
    if (!assignedLocationId) return '';
    const location = locations.find(l => l.id === assignedLocationId);
    return location?.name || '';
  };

  // Use real Supabase data for families - now student-centric with server-side pagination
  const familiesLoading = parentsLoading || studentsLoading || locationsLoading;
  const families = studentsData.length > 0
    ? studentsData.map(student => {
        const parent = parentsData.find(p => p.linked_student_id === student.id);
        return {
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            status: student.status,
            assignedLocationId: student.assigned_location_id,
            schoolOrigin: student.school_origin,
            branch: student.branch,
          },
          parent: parent ? {
            id: parent.id,
            name: parent.name,
            email: parent.email,
            phone: parent.phone,
            address: parent.address,
            linkedStudentId: parent.linked_student_id,
          } : undefined
        };
      })
    : mockUsers.filter(u => u.role === UserRole.STUDENT).map(student => {
        const parent = mockUsers.find(p => p.linkedStudentId === student.id);
        return { student, parent };
      });

  // Server-side pagination values
  const familiesTotalCount = studentsTotalCount;
  const familiesStartIdx = (familiesPage - 1) * familiesPageSize;
  const familiesEndIdx = Math.min(familiesStartIdx + familiesPageSize, familiesTotalCount);

  // Use real Supabase data for teachers, fallback to mock if empty
  const teachers = teachersData.length > 0
    ? teachersData.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        assignedLocationId: t.assigned_location_id,
        assignedLocationIds: (t as any).assigned_location_ids && (t as any).assigned_location_ids.length > 0
          ? (t as any).assigned_location_ids
          : (t.assigned_location_id ? [t.assigned_location_id] : []),
        status: t.status,
        assignedSubjects: t.assigned_subjects || [],
        assignedClasses: (t as any).assigned_classes || [],
        classTypes: (t as any).class_types || [],
      }))
    : mockUsers.filter(u => u.role === UserRole.TEACHER);

  const resetForm = () => {
    setParentName(''); setParentEmail(''); setParentPassword(''); setParentPhone(''); setParentAddress('');
    setStudentName(''); setStudentEmail(''); setStudentPassword(''); setStudentPhone(''); setStudentLocationId(''); setStudentSchool('');
    setStudentGrade('');
    setStudentStatus('ACTIVE');
    setStudentPhoto(null);
    setStudentClassType('');
    setTeacherName(''); setTeacherEmail(''); setTeacherPassword(''); setTeacherLocationIds([]);
    setTeacherStatus('ACTIVE');
    setTeacherClassTypes([]);
    setTeacherSubjects([]);
    setTeacherClasses([]);
    setAllClassesData([]);
    setIsEditing(false);
    setEditParentId(null); setEditStudentId(null); setEditTeacherId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setView('form');
  };

  const handleDeleteAccount = () => {
    setMockUsers(prev => prev.filter(u => u.id !== deleteConfirm.id));
    setDeleteConfirm({ isOpen: false, id: '', name: '' });
  };

  // Helper to extract class name from school_origin format
  // e.g. "SD SANG TIMUR - KELAS 1 A (Regular)" -> "KELAS 1 A"
  const extractClassFromSchoolOrigin = (schoolOrigin?: string | null): string => {
    if (!schoolOrigin) return '';
    // Try format: "SCHOOL NAME - CLASS (TYPE)"
    const matchWithType = schoolOrigin.match(/^.+?\s*-\s*(.+?)\s*\((.+?)\)$/);
    if (matchWithType) {
      return matchWithType[1].trim();
    }
    // Try format: "SCHOOL NAME - CLASS"
    const matchSimple = schoolOrigin.match(/^.+?\s*-\s*(.+?)$/);
    if (matchSimple) {
      return matchSimple[1].trim();
    }
    return '';
  };

  const handleEditFamily = (parent: User | undefined, student: User) => {
    resetForm();
    setIsEditing(true);

    // Always set student data (required)
    setEditStudentId(student.id);
    setStudentName(student.name);
    setStudentEmail(student.email || '');
    setStudentPassword('');
    setStudentPhone(student.phone || '');
    setStudentLocationId(student.assignedLocationId || '');
    setStudentSchool(student.schoolOrigin || '');

    // Use branch if available, otherwise extract from school_origin
    const gradeValue = student.branch || extractClassFromSchoolOrigin(student.schoolOrigin);
    setStudentGrade(gradeValue);

    setStudentStatus(student.status || 'ACTIVE');
    setStudentPhoto(`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`);
    setStudentClassType((student as any).classType || '');

    // Set parent data if exists
    if (parent) {
      setEditParentId(parent.id);
      setParentName(parent.name);
      setParentEmail(parent.email || '');
      setParentPassword('');
      setParentPhone(parent.phone || '');
      setParentAddress(parent.address || '');
    } else {
      // No parent - admin will create one
      setEditParentId(null);
      setParentName('');
      setParentEmail('');
      setParentPassword('');
      setParentPhone('');
      setParentAddress('');
    }

    setView('form');
  };

  const handleEditTeacher = (teacher: any) => {
    resetForm();
    setSubmitError(null);
    setIsEditing(true);
    setEditTeacherId(teacher.id);
    setTeacherName(teacher.name);
    setTeacherEmail(teacher.email || '');
    setTeacherPassword(''); // Don't show password
    // Handle both array and single value for locations
    // Check array has items, otherwise fallback to single assignedLocationId
    const locationIds = Array.isArray(teacher.assignedLocationIds) && teacher.assignedLocationIds.length > 0
      ? teacher.assignedLocationIds
      : teacher.assignedLocationId
        ? [teacher.assignedLocationId]
        : [];
    setTeacherLocationIds(locationIds);
    setTeacherStatus(teacher.status || 'ACTIVE');

    // Load subjects if available
    const subjects = teacher.assignedSubjects || [];
    setTeacherSubjects(subjects);

    // Load assigned classes if available
    const classes = teacher.assignedClasses || [];
    setTeacherClasses(classes);

    // Load class types if available
    const classTypes = teacher.classTypes || [];
    setTeacherClassTypes(classTypes);

    setView('form');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Check if we're editing existing records
      if (isEditing && editStudentId) {
        // Always update student profile
        console.log('Updating student - Student ID:', editStudentId);
        await updateProfile(editStudentId, {
          name: studentName,
          email: studentEmail,
          phone: studentPhone || null,
          assigned_location_id: studentLocationId || null,
          school_origin: studentSchool || null,
          branch: studentGrade || null,
          status: studentStatus,
          class_type: studentClassType || null,
        });

        if (editParentId) {
          // UPDATE MODE - Update existing parent
          console.log('Updating parent - Parent ID:', editParentId);
          await updateProfile(editParentId, {
            name: parentName,
            email: parentEmail,
            phone: parentPhone || null,
            address: parentAddress || null,
          });
        } else if (parentEmail && parentName) {
          // CREATE NEW PARENT for existing student
          console.log('Creating new parent for student:', editStudentId);

          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Anda harus login untuk membuat user baru');
          }

          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          const parentResponse = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': supabaseAnonKey,
            },
            body: JSON.stringify({
              email: parentEmail,
              password: parentPassword,
              name: parentName,
              role: 'PARENT',
              phone: parentPhone || undefined,
              address: parentAddress || undefined,
              linked_student_id: editStudentId,
            }),
          });

          const parentResult = await parentResponse.json();
          if (!parentResponse.ok || !parentResult?.success) {
            throw new Error(`Gagal membuat akun parent: ${parentResult?.error || parentResponse.statusText}`);
          }
          console.log('Parent created:', parentResult.user.id);
        }

        // Refetch data to update the list
        await Promise.all([refetchParents(), refetchStudents()]);

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setView('list');
          resetForm();
        }, 1500);
        return;
      }

      // CREATE MODE - Create new users
      // Verify user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Anda harus login untuk membuat user baru');
      }

      console.log('Session found, user:', session.user.email);
      console.log('Access token (first 50 chars):', session.access_token.substring(0, 50));

      // Get Supabase URL from env
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Step 1: Create Student first
      console.log('Creating student with:', { email: studentEmail, name: studentName, role: 'STUDENT' });

      // Use fetch directly with explicit headers for better debugging
      const studentResponse = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          email: studentEmail,
          password: studentPassword,
          name: studentName,
          role: 'STUDENT',
          phone: studentPhone || undefined,
          assigned_location_id: studentLocationId || undefined,
          school_origin: studentSchool || undefined,
          branch: studentGrade || undefined,
          status: studentStatus,
          class_type: studentClassType || undefined,
        }),
      });

      const studentResult = await studentResponse.json();
      console.log('Student response status:', studentResponse.status);
      console.log('Student result:', studentResult);

      if (!studentResponse.ok) {
        throw new Error(`Gagal membuat akun student: ${studentResult.error || studentResponse.statusText}`);
      }

      if (!studentResult?.success) {
        throw new Error(studentResult?.error || 'Gagal membuat akun student - response tidak valid');
      }

      const newStudentId = studentResult.user.id;
      console.log('Student created with ID:', newStudentId);

      // Step 2: Create Parent linked to student
      console.log('Creating parent with:', { email: parentEmail, name: parentName, role: 'PARENT', linked_student_id: newStudentId });

      const parentResponse = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          email: parentEmail,
          password: parentPassword,
          name: parentName,
          role: 'PARENT',
          phone: parentPhone || undefined,
          address: parentAddress || undefined,
          linked_student_id: newStudentId,
        }),
      });

      const parentResult = await parentResponse.json();
      console.log('Parent response status:', parentResponse.status);
      console.log('Parent result:', parentResult);

      if (!parentResponse.ok) {
        throw new Error(`Gagal membuat akun parent: ${parentResult.error || parentResponse.statusText}`);
      }

      if (!parentResult?.success) {
        throw new Error(parentResult?.error || 'Gagal membuat akun parent - response tidak valid');
      }

      // Refetch data to update the list
      await Promise.all([refetchParents(), refetchStudents()]);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setView('list');
        resetForm();
      }, 1500);
    } catch (error) {
      console.error('Failed to save family:', error);
      setSubmitError(error instanceof Error ? error.message : 'Gagal menyimpan family unit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check if string is valid UUID
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (isEditing && editTeacherId) {
        // Check if this is a real Supabase record (valid UUID) or mock data
        if (!isValidUUID(editTeacherId)) {
          setSubmitError('Data ini adalah mock data dan tidak dapat disimpan ke database. Silakan jalankan seed.sql terlebih dahulu untuk menambahkan data teacher ke Supabase.');
          setIsSubmitting(false);
          return;
        }

        // Validate location IDs if provided
        const invalidLocationIds = teacherLocationIds.filter(id => !isValidUUID(id));
        if (invalidLocationIds.length > 0) {
          setSubmitError('Beberapa sekolah yang dipilih tidak valid. Silakan pilih sekolah dari database.');
          setIsSubmitting(false);
          return;
        }

        // Update existing teacher in Supabase
        console.log('Updating teacher:', {
          id: editTeacherId,
          name: teacherName,
          email: teacherEmail,
          assigned_location_id: teacherLocationIds[0] || null, // Primary location for backward compat
          assigned_location_ids: teacherLocationIds, // All locations
          status: teacherStatus,
          assigned_subjects: teacherSubjects,
          assigned_classes: teacherClasses,
          class_types: teacherClassTypes,
        });

        // Try to update with all fields first, then fallback progressively
        // This handles cases where some columns might not exist in the database yet
        const baseData = {
          name: teacherName,
          email: teacherEmail,
          assigned_location_id: teacherLocationIds[0] || null,
          status: teacherStatus,
        };

        // Smart fallback: try to save as many fields as possible
        // Priority: assigned_location_ids > assigned_classes > assigned_subjects > class_types
        const fieldsToTry = [
          // 1. All fields
          { assigned_location_ids: teacherLocationIds, assigned_subjects: teacherSubjects, assigned_classes: teacherClasses, class_types: teacherClassTypes },
          // 2. Without class_types (keep location_ids)
          { assigned_location_ids: teacherLocationIds, assigned_subjects: teacherSubjects, assigned_classes: teacherClasses },
          // 3. Without assigned_classes (keep location_ids)
          { assigned_location_ids: teacherLocationIds, assigned_subjects: teacherSubjects, class_types: teacherClassTypes },
          // 4. Just location_ids + subjects
          { assigned_location_ids: teacherLocationIds, assigned_subjects: teacherSubjects },
          // 5. Just location_ids
          { assigned_location_ids: teacherLocationIds },
          // 6. Without location_ids but with others
          { assigned_subjects: teacherSubjects, assigned_classes: teacherClasses, class_types: teacherClassTypes },
          // 7. Just subjects + classes
          { assigned_subjects: teacherSubjects, assigned_classes: teacherClasses },
          // 8. Just subjects
          { assigned_subjects: teacherSubjects },
          // 9. Empty (base only)
          {},
        ];

        let updateSucceeded = false;
        for (let i = 0; i < fieldsToTry.length; i++) {
          try {
            await updateProfile(editTeacherId, {
              ...baseData,
              ...fieldsToTry[i],
            });
            const savedFields = Object.keys(fieldsToTry[i]).join(', ') || 'base only';
            console.log(`Update succeeded with: ${savedFields}`);
            updateSucceeded = true;
            break;
          } catch (err: any) {
            const errMsg = err?.message || JSON.stringify(err);
            console.warn(`Update attempt ${i + 1} failed:`, errMsg);
            // Continue to next fallback
          }
        }

        if (!updateSucceeded) {
          throw new Error('Gagal menyimpan data teacher setelah semua percobaan');
        }

        // Refetch to update the list
        await refetchTeachers();

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setView('list');
          resetForm();
        }, 1500);
      } else {
        // Verify user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Anda harus login untuk membuat user baru');
        }

        // Create new teacher via Edge Function - let supabase client handle auth
        // Note: Edge function might not support assigned_location_ids yet
        const { data: teacherResult, error: teacherError } = await supabase.functions.invoke('create-user', {
          body: {
            email: teacherEmail,
            password: teacherPassword,
            name: teacherName,
            role: 'TEACHER',
            assigned_location_id: teacherLocationIds[0] || undefined, // Primary location
            status: teacherStatus,
          },
        });

        if (teacherError) {
          throw new Error(`Gagal membuat akun teacher: ${teacherError.message}`);
        }

        if (!teacherResult?.success) {
          throw new Error(teacherResult?.error || 'Gagal membuat akun teacher');
        }

        // Try to update with assigned_location_ids after creation
        if (teacherLocationIds.length > 1) {
          try {
            await updateProfile(teacherResult.user.id, {
              assigned_location_ids: teacherLocationIds,
            });
          } catch (err) {
            console.warn('Could not save assigned_location_ids, column might not exist:', err);
          }
        }

        // Update with subjects, classes, and class types if selected (profile already created, just update)
        if (teacherSubjects.length > 0 || teacherClasses.length > 0 || teacherClassTypes.length > 0) {
          await updateProfile(teacherResult.user.id, {
            assigned_subjects: teacherSubjects,
            assigned_classes: teacherClasses,
            class_types: teacherClassTypes,
          });
        }

        // Refetch to update the list
        await refetchTeachers();

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setView('list');
          resetForm();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to save teacher:', error);
      setSubmitError(error instanceof Error ? error.message : 'Gagal menyimpan data teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSchoolName = (id?: string | null) => {
    if (!id) return "Belum Assign";
    // Use real locations from Supabase, fallback to MOCK_SCHOOLS
    const location = locations.find(l => l.id === id);
    if (location) return location.name;
    const mockSchool = MOCK_SCHOOLS.find(s => s.id === id);
    return mockSchool ? mockSchool.name : "Unknown";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Account Management</h2>
          <p className="text-xs text-gray-500">Manage Family Units and Teacher profiles.</p>
        </div>

        <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
            <button
                onClick={() => { setActiveTab('families'); setView('list'); }}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'families' ? 'theme-bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Families
            </button>
            <button
                onClick={() => { setActiveTab('teachers'); setView('list'); }}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'teachers' ? 'theme-bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Teachers
            </button>
        </div>
      </div>

      {view === 'list' && (
         <div className="flex justify-end">
            <Button onClick={handleOpenCreate} className="text-xs py-1.5 px-3">
               Create {activeTab === 'families' ? 'Family Unit' : 'Teacher'}
            </Button>
         </div>
      )}

      {/* --- FAMILIES TAB --- */}
      {activeTab === 'families' && (
        <>
            {view === 'list' ? (
                <div className="space-y-3">
                  {/* Filters Row */}
                  <Card className="!p-3">
                    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                      <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                        {/* Search */}
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1 block">Cari</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Nama atau email..."
                              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 focus:bg-white"
                              value={familiesSearch}
                              onChange={e => setFamiliesSearch(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* School Filter */}
                        <div className="w-full sm:w-56">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <School className="w-3 h-3" /> Sekolah
                          </label>
                          <select
                            value={familiesLocationFilter}
                            onChange={e => setFamiliesLocationFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 focus:bg-white"
                          >
                            <option value="">Semua Sekolah</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Stats & Reset */}
                      <div className="flex items-end gap-2 w-full sm:w-auto">
                        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                          <span className="text-[9px] font-bold text-blue-400 uppercase block">Hasil</span>
                          <span className="text-sm font-bold text-blue-900">{familiesTotalCount.toLocaleString()} Siswa</span>
                        </div>
                        {(familiesLocationFilter || familiesSearch) && (
                          <button
                            onClick={() => { setFamiliesLocationFilter(''); setFamiliesSearch(''); setFamiliesPage(1); }}
                            className="px-4 py-2 h-[42px] bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-all flex items-center gap-1"
                          >
                            <XIcon className="w-3.5 h-3.5" /> Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Table */}
                  <Card className="!p-0 overflow-hidden">
                    {familiesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-gray-500">Loading families...</span>
                      </div>
                    ) : (
                    <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <tr>
                                  <th className="px-4 py-2.5">Student</th>
                                  <th className="px-4 py-2.5">Sekolah</th>
                                  <th className="px-4 py-2.5">Linked Parent</th>
                                  <th className="px-4 py-2.5">Status</th>
                                  <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {families.map((fam, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-2">
                                          <div className="flex items-center gap-2">
                                              <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fam.student.name)}&background=random`}
                                                className="w-6 h-6 rounded object-cover bg-gray-100"
                                                alt=""
                                              />
                                              <div>
                                                  <div className="font-bold text-gray-900 text-xs">{fam.student.name}</div>
                                                  <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    {fam.student.email}
                                                    {fam.student.branch && (
                                                      <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                                        {fam.student.branch}
                                                      </span>
                                                    )}
                                                  </div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-4 py-2">
                                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                                            {getStudentSchoolName(fam.student.assignedLocationId) || 'N/A'}
                                          </span>
                                      </td>
                                      <td className="px-4 py-2">
                                          {fam.parent ? (
                                              <div>
                                                  <div className="font-bold text-gray-900 text-xs">{fam.parent.name}</div>
                                                  <div className="text-[10px] text-gray-400">{fam.parent.email}</div>
                                              </div>
                                          ) : <span className="text-amber-600 text-[9px] font-bold uppercase bg-amber-50 px-2 py-1 rounded">Belum Ada</span>}
                                      </td>
                                      <td className="px-4 py-2">
                                         <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 w-fit ${fam.student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${fam.student.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            {fam.student.status || 'ACTIVE'}
                                         </span>
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                          <div className="flex justify-end gap-1">
                                            <button
                                              onClick={() => handleEditFamily(fam.parent, fam.student)}
                                              className="p-1.5 rounded transition-all text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                              title={fam.parent ? "Edit" : "Tambah Parent"}
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => setDeleteConfirm({ isOpen: true, id: fam.student.id, name: fam.student.name })}
                                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                              {families.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm italic">
                                    Tidak ada data ditemukan.
                                  </td>
                                </tr>
                              )}
                          </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    {familiesTotalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="text-xs text-gray-500">
                          Menampilkan {familiesStartIdx + 1} - {Math.min(familiesEndIdx, familiesTotalCount)} dari {familiesTotalCount.toLocaleString()} siswa
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setFamiliesPage(1)}
                            disabled={familiesPage === 1}
                            className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Halaman Pertama"
                          >
                            <ChevronsLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setFamiliesPage(p => Math.max(1, p - 1))}
                            disabled={familiesPage === 1}
                            className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Halaman Sebelumnya"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: Math.min(5, familiesTotalPages) }, (_, i) => {
                              let pageNum;
                              if (familiesTotalPages <= 5) {
                                pageNum = i + 1;
                              } else if (familiesPage <= 3) {
                                pageNum = i + 1;
                              } else if (familiesPage >= familiesTotalPages - 2) {
                                pageNum = familiesTotalPages - 4 + i;
                              } else {
                                pageNum = familiesPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setFamiliesPage(pageNum)}
                                  className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                                    familiesPage === pageNum
                                      ? 'theme-bg-primary text-white'
                                      : 'hover:bg-gray-200 text-gray-600'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => setFamiliesPage(p => Math.min(familiesTotalPages, p + 1))}
                            disabled={familiesPage === familiesTotalPages}
                            className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Halaman Berikutnya"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setFamiliesPage(familiesTotalPages)}
                            disabled={familiesPage === familiesTotalPages}
                            className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Halaman Terakhir"
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    </>
                    )}
                  </Card>
                </div>
            ) : (
                <Card title={isEditing ? "Edit Family Unit" : "Register New Family Unit"} className="!p-4">
                    <form onSubmit={handleFamilySubmit} className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Parent Section */}
                            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 h-fit">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                                    <Users className="w-3.5 h-3.5 text-blue-600" /> Parent Account
                                </h3>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Full Name</label>
                                    <input type="text" required value={parentName} onChange={(e) => setParentName(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-500 uppercase">Email</label>
                                      <input type="email" required value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-500 uppercase">Phone</label>
                                      <input type="tel" required value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" placeholder="08..." />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Address</label>
                                    <textarea rows={2} required value={parentAddress} onChange={(e) => setParentAddress(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs resize-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">
                                      Password {isEditing && <span className="text-gray-400 font-normal">(kosongkan jika tidak ingin mengubah)</span>}
                                    </label>
                                    <input type="text" required={!isEditing} placeholder={isEditing ? "Kosongkan jika tidak ingin mengubah password" : "Set password"} value={parentPassword} onChange={(e) => setParentPassword(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                                </div>
                            </div>
                            {/* Student Section */}
                            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                                        <GraduationCap className="w-3.5 h-3.5 text-green-600" /> Student Account
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[8px] font-bold uppercase ${studentStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                                            {studentStatus}
                                        </span>
                                        <button type="button" onClick={() => setStudentStatus(studentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')} className="focus:outline-none">
                                            {studentStatus === 'ACTIVE' ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center py-2">
                                   <div className="relative group">
                                      <div className="w-16 h-16 rounded-full border-2 border-white shadow-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                                         {studentPhoto ? (
                                            <img src={studentPhoto} className="w-full h-full object-cover" alt="" />
                                         ) : (
                                            <GraduationCap className="w-6 h-6 text-gray-400" />
                                         )}
                                      </div>
                                      <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700">
                                         <Camera className="w-3 h-3" />
                                      </button>
                                   </div>
                                   <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Full Name</label>
                                    <input type="text" required value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-500 uppercase">Email</label>
                                      <input type="email" required value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-500 uppercase">Phone</label>
                                      <input type="tel" required value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" placeholder="08..." />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">
                                      Password {isEditing && <span className="text-gray-400 font-normal">(kosongkan jika tidak ingin mengubah)</span>}
                                    </label>
                                    <input type="text" required={!isEditing} placeholder={isEditing ? "Kosongkan jika tidak ingin mengubah password" : "Set password"} value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-500 uppercase">Sekolah</label>
                                      <select value={studentLocationId} onChange={(e) => { setStudentLocationId(e.target.value); setStudentGrade(''); }} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none bg-white text-xs">
                                        <option value="">Pilih Sekolah</option>
                                        {locations.length > 0
                                          ? locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} {loc.level ? `(${loc.level})` : ''}</option>)
                                          : MOCK_SCHOOLS.map(school => <option key={school.id} value={school.id}>{school.name}</option>)
                                        }
                                      </select>
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                        Kelas <span className="text-red-500">*</span>
                                        {classesLoading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                                        {hasDynamicClasses && <span className="text-green-600 font-normal">({studentClasses.length} kelas)</span>}
                                      </label>
                                      <select
                                        value={studentGrade}
                                        onChange={(e) => setStudentGrade(e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none bg-white text-xs"
                                        disabled={!studentLocationId || classesLoading}
                                      >
                                        <option value="">
                                          {!studentLocationId ? 'Pilih sekolah dulu' : classesLoading ? 'Loading...' : 'Pilih Kelas'}
                                        </option>
                                        {studentGradeOptions.map(grade => (
                                          <option key={grade} value={grade}>{grade}</option>
                                        ))}
                                      </select>
                                  </div>
                                </div>

                                {/* Student Class Type - Bilingual or Regular */}
                                <div className="space-y-2 pt-2">
                                  <label className="text-[9px] font-bold text-gray-500 uppercase">
                                    Jenis Kelas <span className="text-red-500">*</span>
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setStudentClassType(ClassType.BILINGUAL)}
                                      className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-all ${
                                        studentClassType === ClassType.BILINGUAL
                                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
                                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                      }`}
                                    >
                                      <Globe className="w-3.5 h-3.5" />
                                      Bilingual
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setStudentClassType(ClassType.REGULAR)}
                                      className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-all ${
                                        studentClassType === ClassType.REGULAR
                                          ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-200'
                                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                      }`}
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      Regular
                                    </button>
                                  </div>
                                  <p className="text-[9px] text-gray-400 italic">
                                    Pilih jenis kelas untuk menentukan jadwal dan quiz yang akan ditampilkan ke siswa
                                  </p>
                                </div>
                            </div>
                        </div>
                        {submitError && (
                          <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs">
                            {submitError}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <Button type="button" variant="outline" onClick={() => setView('list')} className="text-xs py-1.5 px-3" disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" className="px-6 shadow-md text-xs py-1.5 flex items-center gap-2" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                              {isSubmitting ? "Menyimpan..." : (isEditing ? "Update" : "Create")}
                            </Button>
                        </div>
                    </form>
                    {success && <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100 font-bold text-center text-xs">Family unit berhasil dibuat!</div>}
                </Card>
            )}
        </>
      )}

      {/* --- TEACHERS TAB --- */}
      {activeTab === 'teachers' && (
         <>
            {view === 'list' ? (
                <Card className="!p-0">
                    {teachersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-gray-500">Loading teachers...</span>
                      </div>
                    ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <tr>
                                  <th className="px-4 py-2.5">Teacher</th>
                                  <th className="px-4 py-2.5">Sekolah</th>
                                  <th className="px-4 py-2.5">Status</th>
                                  <th className="px-4 py-2.5">Workload</th>
                                  <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {teachers.map((t, idx) => {
                                  const teacherSchools = getTeacherSchools(t);
                                  const studentCount = getTeacherStudentCount(t);
                                  const workloadColor = studentCount > 500 ? 'text-red-600 bg-red-50' : studentCount > 200 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50';

                                  return (
                                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-4 py-2">
                                              <div className="font-bold text-gray-900 text-xs">{t.name}</div>
                                              <div className="text-[10px] text-gray-400">{t.email}</div>
                                          </td>
                                          <td className="px-4 py-2">
                                              {teacherSchools.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                  {teacherSchools.map((schoolName, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 text-[9px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                                                      <School className="w-2.5 h-2.5" />
                                                      {schoolName}
                                                    </span>
                                                  ))}
                                                </div>
                                              ) : (
                                                <span className="text-[10px] text-gray-400 italic">Belum Assign</span>
                                              )}
                                          </td>
                                          <td className="px-4 py-2">
                                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                 {t.status || 'ACTIVE'}
                                              </span>
                                          </td>
                                          <td className="px-4 py-2">
                                              <div className={`inline-flex flex-col items-center px-2 py-1 rounded ${workloadColor}`}>
                                                  <span className="text-sm font-bold leading-none">{studentCount.toLocaleString()}</span>
                                                  <span className="text-[7px] font-bold uppercase">students</span>
                                              </div>
                                          </td>
                                          <td className="px-4 py-2 text-right">
                                              <div className="flex justify-end gap-1">
                                                <button onClick={() => handleEditTeacher(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all">
                                                  <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm({ isOpen: true, id: t.id, name: t.name })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                    </div>
                    )}
                </Card>
            ) : (
                <Card title={isEditing ? "Edit Teacher" : "Add New Teacher"} className="!p-4">
                     <form onSubmit={handleTeacherSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Teacher Name</label>
                                <input type="text" required value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Email</label>
                                <input type="email" required value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-500 uppercase">
                                  Password {isEditing && <span className="text-gray-400 font-normal">(kosongkan jika tidak ingin mengubah)</span>}
                                </label>
                                <input type="text" required={!isEditing} placeholder={isEditing ? "Kosongkan jika tidak ingin mengubah password" : "Set password"} value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Status</label>
                                <select value={teacherStatus} onChange={(e) => setTeacherStatus(e.target.value as any)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none bg-white text-xs font-bold">
                                  <option value="ACTIVE">ACTIVE</option>
                                  <option value="INACTIVE">INACTIVE</option>
                                </select>
                            </div>
                        </div>
                        {/* Multi-select Schools */}
                        <div className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold text-blue-700 uppercase">Sekolah (Bisa pilih lebih dari satu)</label>
                            {teacherLocationIds.length > 0 && (
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                {teacherLocationIds.length} sekolah dipilih
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                            {locations.length > 0
                              ? locations.map(loc => (
                                  <button
                                    key={loc.id}
                                    type="button"
                                    onClick={() => toggleTeacherLocation(loc.id)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                                      teacherLocationIds.includes(loc.id)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                                    }`}
                                  >
                                    {loc.name}
                                  </button>
                                ))
                              : MOCK_SCHOOLS.map(school => (
                                  <button
                                    key={school.id}
                                    type="button"
                                    onClick={() => toggleTeacherLocation(school.id)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                                      teacherLocationIds.includes(school.id)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                                    }`}
                                  >
                                    {school.name}
                                  </button>
                                ))
                            }
                          </div>
                          <p className="text-[9px] text-blue-600 italic">
                            Klik untuk memilih/membatalkan pilihan sekolah
                          </p>
                        </div>

                        {/* Class Selection - Only show if school(s) are selected */}
                        {teacherLocationIds.length > 0 && (
                          <div className="space-y-2 bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-bold text-orange-700 uppercase">Kelas yang Diajarkan</label>
                              {teacherClasses.length > 0 && (
                                <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                  {teacherClasses.length} kelas dipilih
                                </span>
                              )}
                            </div>
                            {allClassesLoading ? (
                              <div className="flex items-center gap-2 py-2 text-orange-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs">Loading kelas...</span>
                              </div>
                            ) : availableClassesByLocation.length > 0 ? (
                              <div className="space-y-3 max-h-48 overflow-y-auto">
                                {availableClassesByLocation.map(group => (
                                  <div key={group.locationId}>
                                    <p className="text-[8px] font-black text-orange-800 uppercase tracking-widest mb-1.5 bg-orange-100 px-2 py-1 rounded">
                                      {group.locationName}
                                    </p>
                                    {group.hasClasses ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {group.classes.map(cls => (
                                          <button
                                            key={`${group.locationId}-${cls}`}
                                            type="button"
                                            onClick={() => toggleClass(cls)}
                                            className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                                              teacherClasses.includes(cls)
                                                ? 'bg-orange-600 text-white border-orange-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                                            }`}
                                          >
                                            {cls}
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-gray-500 italic bg-gray-100 px-2 py-1.5 rounded">
                                        Belum ada data kelas untuk sekolah ini
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-orange-600 italic py-2">
                                Tidak ada data kelas untuk sekolah yang dipilih. Pastikan data kelas sudah diisi di database.
                              </p>
                            )}
                            <p className="text-[9px] text-orange-600 italic">
                              Pilih kelas yang akan diajarkan oleh guru ini
                            </p>
                          </div>
                        )}

                        {/* Teacher Class Types Selection - Multi-select */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">
                              Jenis Kelas yang Diajarkan <span className="text-red-500">*</span>
                              <span className="text-gray-400 font-normal ml-1">(Bisa pilih keduanya)</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => toggleTeacherClassType(ClassType.BILINGUAL)}
                                className={`flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg text-xs font-bold transition-all ${
                                  teacherClassTypes.includes(ClassType.BILINGUAL)
                                    ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
                                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <Globe className="w-3.5 h-3.5" />
                                Bilingual
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleTeacherClassType(ClassType.REGULAR)}
                                className={`flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg text-xs font-bold transition-all ${
                                  teacherClassTypes.includes(ClassType.REGULAR)
                                    ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-200'
                                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                Regular
                              </button>
                            </div>
                            {teacherClassTypes.length > 0 && (
                              <p className="text-[9px] text-green-600 font-medium">
                                Guru ini akan mengajar kelas: {teacherClassTypes.join(' & ')}
                              </p>
                            )}
                        </div>

                        {/* Subject Selection - Only show if at least one class type is selected */}
                        {teacherClassTypes.length > 0 && (
                          <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">Subjects (Select Multiple)</label>
                            {teacherClassTypes.includes(ClassType.BILINGUAL) && (
                              <div className="space-y-3">
                                {/* English Category */}
                                <div>
                                  <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1.5">English</p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                                    {BILINGUAL_SUBJECTS.filter(s => s.category === 'English').map(subject => (
                                      <button
                                        key={subject.id}
                                        type="button"
                                        onClick={() => toggleSubject(subject.id)}
                                        className={`px-2 py-1.5 rounded text-[10px] font-bold border transition-all ${
                                          teacherSubjects.includes(subject.id)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                      >
                                        {subject.label.replace('English - ', '')}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {/* Conversation Category */}
                                <div>
                                  <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mb-1.5">Conversation</p>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {BILINGUAL_SUBJECTS.filter(s => s.category === 'Conversation').map(subject => (
                                      <button
                                        key={subject.id}
                                        type="button"
                                        onClick={() => toggleSubject(subject.id)}
                                        className={`px-2 py-1.5 rounded text-[10px] font-bold border transition-all ${
                                          teacherSubjects.includes(subject.id)
                                            ? 'bg-green-600 text-white border-green-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                      >
                                        {subject.label.replace('Conversation - ', '')}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {/* Other Category */}
                                <div>
                                  <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest mb-1.5">Other Subjects</p>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {BILINGUAL_SUBJECTS.filter(s => s.category === 'Other').map(subject => (
                                      <button
                                        key={subject.id}
                                        type="button"
                                        onClick={() => toggleSubject(subject.id)}
                                        className={`px-2 py-1.5 rounded text-[10px] font-bold border transition-all ${
                                          teacherSubjects.includes(subject.id)
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                      >
                                        {subject.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            {teacherClassTypes.includes(ClassType.REGULAR) && (
                              <div className="space-y-2">
                                <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-1.5">Regular Class Subjects</p>
                                <div className="grid grid-cols-1 gap-1.5">
                                  {REGULAR_SUBJECTS.map(subject => (
                                    <button
                                      key={subject.id}
                                      type="button"
                                      onClick={() => toggleSubject(subject.id)}
                                      className={`px-3 py-2 rounded text-xs font-bold border transition-all ${
                                        teacherSubjects.includes(subject.id)
                                          ? 'bg-teal-600 text-white border-teal-600'
                                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                      }`}
                                    >
                                      {subject.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {teacherSubjects.length > 0 && (
                              <div className="pt-2 border-t border-gray-200 mt-2">
                                <p className="text-[9px] text-gray-500">
                                  Selected: <span className="font-bold text-gray-700">{teacherSubjects.length} subject(s)</span>
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {submitError && (
                          <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs">
                            {submitError}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <Button type="button" variant="outline" onClick={() => setView('list')} className="text-xs py-1.5 px-3" disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" className="px-6 shadow-md text-xs py-1.5 flex items-center gap-2" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                              {isSubmitting ? "Menyimpan..." : (isEditing ? "Update" : "Create")}
                            </Button>
                        </div>
                     </form>
                     {success && <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100 font-bold text-center text-xs">Berhasil disimpan!</div>}
                </Card>
            )}
         </>
      )}

      {/* Delete Modal */}
      {deleteConfirm.isOpen && (
         <div className="fixed inset-0 z-[200] overflow-y-auto bg-red-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xs rounded-xl shadow-xl overflow-hidden border border-red-100">
               <div className="p-4 text-center space-y-3">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto">
                     <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-sm font-bold text-gray-900">Hapus Akun</h3>
                     <p className="text-[10px] text-gray-500">Hapus akun <span className="font-bold">"{deleteConfirm.name}"</span>?</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                     <button onClick={() => setDeleteConfirm({...deleteConfirm, isOpen: false})} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold text-[10px] uppercase">Batal</button>
                     <button onClick={handleDeleteAccount} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] uppercase">Hapus</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

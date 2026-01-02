
import React, { useState, useRef } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Users, Link as LinkIcon, Lock, Mail, GraduationCap, Briefcase, Trash2, Pencil, MapPin, School, TrendingUp, UserCheck, Activity, ToggleLeft, ToggleRight, Camera, X as XIcon, Upload, ShieldAlert, Smartphone, Globe, Loader2 } from 'lucide-react';
import { MOCK_USERS, MOCK_SCHOOLS, MOCK_SESSIONS, MOCK_SESSION_REPORTS } from '../../constants';
import { UserRole, User } from '../../types';
import { useTeachers, useLocations, useParents, useStudents } from '../../hooks/useProfiles';
import { supabase } from '../../lib/supabase';

export const AccountManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'families' | 'teachers'>('families');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [mockUsers, setMockUsers] = useState(MOCK_USERS);

  // Supabase hooks for real data
  const { profiles: teachersData, loading: teachersLoading, updateProfile, refetch: refetchTeachers } = useTeachers();
  const { profiles: parentsData, loading: parentsLoading, refetch: refetchParents } = useParents();
  const { profiles: studentsData, loading: studentsLoading, refetch: refetchStudents } = useStudents();
  const { locations, loading: locationsLoading } = useLocations();
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
  const [studentStatus, setStudentStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);

  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherLocationId, setTeacherLocationId] = useState('');
  const [teacherStatus, setTeacherStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [teacherType, setTeacherType] = useState<'bilingual' | 'regular' | ''>('');
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);

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

  const handleTeacherTypeChange = (type: 'bilingual' | 'regular') => {
    setTeacherType(type);
    setTeacherSubjects([]);
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

  // Use real Supabase data for families, fallback to mock if empty
  const familiesLoading = parentsLoading || studentsLoading;
  const families = parentsData.length > 0
    ? parentsData.map(parent => {
        const student = studentsData.find(s => s.id === parent.linked_student_id);
        return {
          parent: {
            id: parent.id,
            name: parent.name,
            email: parent.email,
            phone: parent.phone,
            address: parent.address,
            linkedStudentId: parent.linked_student_id,
          },
          student: student ? {
            id: student.id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            status: student.status,
            assignedLocationId: student.assigned_location_id,
            schoolOrigin: student.school_origin,
          } : undefined
        };
      })
    : mockUsers.filter(u => u.role === UserRole.PARENT).map(parent => {
        const student = mockUsers.find(s => s.id === parent.linkedStudentId);
        return { parent, student };
      });

  // Use real Supabase data for teachers, fallback to mock if empty
  const teachers = teachersData.length > 0
    ? teachersData.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        assignedLocationId: t.assigned_location_id,
        status: t.status,
        assignedSubjects: t.assigned_subjects || [],
      }))
    : mockUsers.filter(u => u.role === UserRole.TEACHER);

  const resetForm = () => {
    setParentName(''); setParentEmail(''); setParentPassword(''); setParentPhone(''); setParentAddress('');
    setStudentName(''); setStudentEmail(''); setStudentPassword(''); setStudentPhone(''); setStudentLocationId(''); setStudentSchool('');
    setStudentStatus('ACTIVE');
    setStudentPhoto(null);
    setTeacherName(''); setTeacherEmail(''); setTeacherPassword(''); setTeacherLocationId('');
    setTeacherStatus('ACTIVE');
    setTeacherType('');
    setTeacherSubjects([]);
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

  const handleEditFamily = (parent: User, student?: User) => {
    resetForm();
    setIsEditing(true);
    setEditParentId(parent.id);
    setParentName(parent.name);
    setParentEmail(parent.email || '');
    setParentPassword(parent.password || '');
    setParentPhone(parent.phone || '');
    setParentAddress(parent.address || '');

    if (student) {
      setEditStudentId(student.id);
      setStudentName(student.name);
      setStudentEmail(student.email || '');
      setStudentPassword(student.password || '');
      setStudentPhone(student.phone || '');
      setStudentLocationId(student.assignedLocationId || '');
      setStudentSchool(student.schoolOrigin || '');
      setStudentStatus(student.status || 'ACTIVE');
      setStudentPhoto(`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`);
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
    setTeacherLocationId(teacher.assignedLocationId || '');
    setTeacherStatus(teacher.status || 'ACTIVE');

    // Load subjects if available
    const subjects = teacher.assignedSubjects || [];
    setTeacherSubjects(subjects);

    // Determine teacher type based on subjects
    if (subjects.some((s: string) => s.startsWith('english-') || s.startsWith('conversation-'))) {
      setTeacherType('bilingual');
    } else if (subjects.includes('conversational')) {
      setTeacherType('regular');
    } else {
      setTeacherType('');
    }

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
          status: studentStatus,
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
      console.error('Failed to create family:', error);
      setSubmitError(error instanceof Error ? error.message : 'Gagal membuat family unit');
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

        // Validate location ID if provided
        if (teacherLocationId && !isValidUUID(teacherLocationId)) {
          setSubmitError('Sekolah yang dipilih tidak valid. Silakan pilih sekolah dari database.');
          setIsSubmitting(false);
          return;
        }

        // Update existing teacher in Supabase
        console.log('Updating teacher:', {
          id: editTeacherId,
          name: teacherName,
          email: teacherEmail,
          assigned_location_id: teacherLocationId || null,
          status: teacherStatus,
          assigned_subjects: teacherSubjects,
        });

        await updateProfile(editTeacherId, {
          name: teacherName,
          email: teacherEmail,
          assigned_location_id: teacherLocationId || null,
          status: teacherStatus,
          assigned_subjects: teacherSubjects,
        });

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
        const { data: teacherResult, error: teacherError } = await supabase.functions.invoke('create-user', {
          body: {
            email: teacherEmail,
            password: teacherPassword,
            name: teacherName,
            role: 'TEACHER',
            assigned_location_id: teacherLocationId || undefined,
            status: teacherStatus,
          },
        });

        if (teacherError) {
          throw new Error(`Gagal membuat akun teacher: ${teacherError.message}`);
        }

        if (!teacherResult?.success) {
          throw new Error(teacherResult?.error || 'Gagal membuat akun teacher');
        }

        // Update with subjects if selected (profile already created, just update)
        if (teacherSubjects.length > 0) {
          await updateProfile(teacherResult.user.id, {
            assigned_subjects: teacherSubjects,
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
                <Card className="!p-0">
                    {familiesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-gray-500">Loading families...</span>
                      </div>
                    ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <tr>
                                  <th className="px-4 py-2.5">Parent</th>
                                  <th className="px-4 py-2.5">Linked Student</th>
                                  <th className="px-4 py-2.5">Status</th>
                                  <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {families.map((fam, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-2">
                                          <div className="font-bold text-gray-900 text-xs">{fam.parent.name}</div>
                                          <div className="text-[10px] text-gray-400">{fam.parent.email}</div>
                                      </td>
                                      <td className="px-4 py-2">
                                          {fam.student ? (
                                              <div className="flex items-center gap-2">
                                                  <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fam.student.name)}&background=random`}
                                                    className="w-6 h-6 rounded object-cover bg-gray-100"
                                                    alt=""
                                                  />
                                                  <div>
                                                      <div className="font-bold text-gray-900 text-xs">{fam.student.name}</div>
                                                      <div className="text-[10px] text-gray-400">{fam.student.email}</div>
                                                  </div>
                                              </div>
                                          ) : <span className="text-red-500 text-[9px] font-bold uppercase">Unlinked</span>}
                                      </td>
                                      <td className="px-4 py-2">
                                          {fam.student ? (
                                             <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 w-fit ${fam.student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${fam.student.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                {fam.student.status || 'ACTIVE'}
                                             </span>
                                          ) : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                          <div className="flex justify-end gap-1">
                                            <button
                                              onClick={() => handleEditFamily(fam.parent, fam.student)}
                                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Edit"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => setDeleteConfirm({ isOpen: true, id: fam.parent.id, name: fam.parent.name })}
                                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    </div>
                    )}
                </Card>
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
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Password</label>
                                    <input type="text" required placeholder="Set password" value={parentPassword} onChange={(e) => setParentPassword(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
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
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Password</label>
                                    <input type="text" required placeholder="Set password" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Sekolah</label>
                                    <select value={studentLocationId} onChange={(e) => setStudentLocationId(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none bg-white text-xs">
                                      <option value="">Pilih Sekolah</option>
                                      {locations.length > 0
                                        ? locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)
                                        : MOCK_SCHOOLS.map(school => <option key={school.id} value={school.id}>{school.name}</option>)
                                      }
                                    </select>
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
                                  const workload = getTeacherMonthlyWorkload(t.id);
                                  const workloadColor = workload.studentCount > 20 ? 'text-red-600 bg-red-50' : workload.studentCount > 10 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50';

                                  return (
                                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-4 py-2">
                                              <div className="font-bold text-gray-900 text-xs">{t.name}</div>
                                              <div className="text-[10px] text-gray-400">{t.email}</div>
                                          </td>
                                          <td className="px-4 py-2">
                                              <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                                                  <School className="w-3 h-3" />
                                                  {getSchoolName(t.assignedLocationId)}
                                              </div>
                                          </td>
                                          <td className="px-4 py-2">
                                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                 {t.status || 'ACTIVE'}
                                              </span>
                                          </td>
                                          <td className="px-4 py-2">
                                              <div className={`inline-flex flex-col items-center px-2 py-1 rounded ${workloadColor}`}>
                                                  <span className="text-sm font-bold leading-none">{workload.studentCount}</span>
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
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Password</label>
                                <input type="text" required placeholder="Set password" value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none text-xs" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Status</label>
                                <select value={teacherStatus} onChange={(e) => setTeacherStatus(e.target.value as any)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none bg-white text-xs font-bold">
                                  <option value="ACTIVE">ACTIVE</option>
                                  <option value="INACTIVE">INACTIVE</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">Sekolah</label>
                            <select value={teacherLocationId} onChange={(e) => setTeacherLocationId(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 theme-ring-primary focus:border-transparent outline-none bg-white text-xs">
                              <option value="">Pilih Sekolah</option>
                              {locations.length > 0
                                ? locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)
                                : MOCK_SCHOOLS.map(school => <option key={school.id} value={school.id}>{school.name}</option>)
                              }
                            </select>
                        </div>

                        {/* Teacher Type Selection */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">Teacher Type</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleTeacherTypeChange('bilingual')}
                                className={`flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg text-xs font-bold transition-all ${
                                  teacherType === 'bilingual'
                                    ? 'theme-border-primary bg-blue-50 theme-text-primary ring-1 theme-ring-primary'
                                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <Globe className="w-3.5 h-3.5" />
                                Bilingual
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTeacherTypeChange('regular')}
                                className={`flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg text-xs font-bold transition-all ${
                                  teacherType === 'regular'
                                    ? 'theme-border-primary bg-blue-50 theme-text-primary ring-1 theme-ring-primary'
                                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                Regular
                              </button>
                            </div>
                        </div>

                        {/* Subject Selection - Only show if teacher type is selected */}
                        {teacherType && (
                          <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">Subjects (Select Multiple)</label>
                            {teacherType === 'bilingual' ? (
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
                            ) : (
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


import React, { useState, useRef } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Users, Link as LinkIcon, Lock, Mail, GraduationCap, Briefcase, Trash2, Pencil, MapPin, School, TrendingUp, UserCheck, Activity, ToggleLeft, ToggleRight, Camera, X as XIcon, Upload, ShieldAlert, Smartphone } from 'lucide-react';
import { MOCK_USERS, MOCK_LOCATIONS, MOCK_SESSIONS, MOCK_SESSION_REPORTS } from '../../constants';
import { UserRole, User } from '../../types';

export const AccountManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'families' | 'teachers'>('families');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [mockUsers, setMockUsers] = useState(MOCK_USERS);
  
  // State to track if we are editing
  const [isEditing, setIsEditing] = useState(false);
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [editTeacherId, setEditTeacherId] = useState<string | null>(null);

  // Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string, name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  // --- FAMILY FORM STATES ---
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

  // --- TEACHER FORM STATES ---
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherLocationId, setTeacherLocationId] = useState('');
  const [teacherStatus, setTeacherStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- WORKLOAD LOGIC ---
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

  const families = mockUsers.filter(u => u.role === UserRole.PARENT).map(parent => {
    const student = mockUsers.find(s => s.id === parent.linkedStudentId);
    return { parent, student };
  });

  const teachers = mockUsers.filter(u => u.role === UserRole.TEACHER);

  const resetForm = () => {
    setParentName(''); setParentEmail(''); setParentPassword(''); setParentPhone(''); setParentAddress('');
    setStudentName(''); setStudentEmail(''); setStudentPassword(''); setStudentPhone(''); setStudentLocationId(''); setStudentSchool('');
    setStudentStatus('ACTIVE');
    setStudentPhoto(null);
    setTeacherName(''); setTeacherEmail(''); setTeacherPassword(''); setTeacherLocationId('');
    setTeacherStatus('ACTIVE');
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

  const handleEditTeacher = (teacher: User) => {
    resetForm();
    setIsEditing(true);
    setEditTeacherId(teacher.id);
    setTeacherName(teacher.name);
    setTeacherEmail(teacher.email || '');
    setTeacherPassword(teacher.password || '');
    setTeacherLocationId(teacher.assignedLocationId || '');
    setTeacherStatus(teacher.status || 'ACTIVE');
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

  const handleFamilySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setView('list');
      resetForm();
    }, 1500);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setView('list');
      resetForm();
    }, 1500);
  };

  const getLocationName = (id?: string) => {
    if (!id) return "No Location Assigned";
    const loc = MOCK_LOCATIONS.find(l => l.id === id);
    return loc ? loc.name : "Unknown Location";
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Management</h2>
          <p className="text-gray-500">Manage Family Units and Teacher profiles.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button
                onClick={() => { setActiveTab('families'); setView('list'); }}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'families' ? 'theme-bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Families
            </button>
            <button
                onClick={() => { setActiveTab('teachers'); setView('list'); }}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'teachers' ? 'theme-bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Teachers
            </button>
        </div>
      </div>

      {view === 'list' && (
         <div className="flex justify-end">
            <Button onClick={handleOpenCreate}>
               Create {activeTab === 'families' ? 'Family Unit' : 'Teacher'}
            </Button>
         </div>
      )}

      {/* --- FAMILIES TAB --- */}
      {activeTab === 'families' && (
        <>
            {view === 'list' ? (
                <Card className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <tr>
                                  <th className="px-6 py-4">Parent</th>
                                  <th className="px-6 py-4">Linked Student</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {families.map((fam, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-6 py-4">
                                          <div className="font-bold text-gray-900">{fam.parent.name}</div>
                                          <div className="text-xs text-gray-400 font-medium">{fam.parent.email}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                          {fam.student ? (
                                              <div className="flex items-center gap-3">
                                                  <img 
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fam.student.name)}&background=random`} 
                                                    className="w-8 h-8 rounded-lg object-cover bg-gray-100" 
                                                    alt="" 
                                                  />
                                                  <div>
                                                      <div className="font-bold text-gray-900">{fam.student.name}</div>
                                                      <div className="text-xs text-gray-400 font-medium">{fam.student.email}</div>
                                                      {fam.student.assignedLocationId && (
                                                          <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase mt-1">
                                                              <MapPin className="w-3 h-3" /> {getLocationName(fam.student.assignedLocationId)}
                                                          </div>
                                                      )}
                                                  </div>
                                              </div>
                                          ) : <span className="text-red-500 text-[10px] font-bold uppercase">Unlinked</span>}
                                      </td>
                                      <td className="px-6 py-4">
                                          {fam.student ? (
                                             <span className={`px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1.5 w-fit ${fam.student.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${fam.student.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                {fam.student.status || 'ACTIVE'}
                                             </span>
                                          ) : '-'}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-2">
                                            <button 
                                              onClick={() => handleEditFamily(fam.parent, fam.student)}
                                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"
                                            >
                                              <Pencil className="w-4 h-4" />
                                            </button>
                                            <button 
                                              onClick={() => setDeleteConfirm({ isOpen: true, id: fam.parent.id, name: fam.parent.name })}
                                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    </div>
                </Card>
            ) : (
                <Card title={isEditing ? "Edit Family Unit" : "Register New Family Unit"}>
                    <form onSubmit={handleFamilySubmit} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Parent Section */}
                            <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-200 h-fit">
                                <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                                    <Users className="w-4 h-4 text-blue-600" /> Parent Account
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Full Name</label>
                                    <input type="text" required value={parentName} onChange={(e) => setParentName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none text-sm" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                                      <input type="email" required value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none text-sm" />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number</label>
                                      <div className="relative">
                                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="tel" required value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none text-sm" placeholder="08..." />
                                      </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Home Address</label>
                                    <textarea rows={2} required value={parentAddress} onChange={(e) => setParentAddress(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none text-sm resize-none" placeholder="Alamat Lengkap..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Login Password</label>
                                    <div className="relative">
                                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input 
                                        type="text" 
                                        required 
                                        placeholder="Set login password"
                                        value={parentPassword} 
                                        onChange={(e) => setParentPassword(e.target.value)} 
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none text-sm" 
                                      />
                                    </div>
                                </div>
                            </div>
                            {/* Student Section */}
                            <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-4">
                                    <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                                        <GraduationCap className="w-4 h-4 text-green-600" /> Student Account
                                    </h3>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black uppercase ${studentStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                                            Status: {studentStatus}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => setStudentStatus(studentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                                            className="focus:outline-none transition-all"
                                        >
                                            {studentStatus === 'ACTIVE' ? (
                                                <ToggleRight className="w-8 h-8 text-green-600" />
                                            ) : (
                                                <ToggleLeft className="w-8 h-8 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* STUDENT PHOTO UPLOAD */}
                                <div className="flex flex-col items-center justify-center pb-4 space-y-3">
                                   <div className="relative group">
                                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 flex items-center justify-center transition-all group-hover:opacity-90">
                                         {studentPhoto ? (
                                            <img src={studentPhoto} className="w-full h-full object-cover" alt="Student profile" />
                                         ) : (
                                            <GraduationCap className="w-10 h-10 text-gray-400" />
                                         )}
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors border-2 border-white"
                                      >
                                         <Camera className="w-4 h-4" />
                                      </button>
                                      {studentPhoto && (
                                         <button 
                                            type="button"
                                            onClick={() => setStudentPhoto(null)}
                                            className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                         >
                                            <XIcon className="w-3 h-3" />
                                         </button>
                                      )}
                                   </div>
                                   <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Full Name</label>
                                    <input type="text" required value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none text-sm" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                                      <input type="email" required value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none text-sm" />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number</label>
                                      <div className="relative">
                                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="tel" required value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none text-sm" placeholder="08..." />
                                      </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Password</label>
                                    <div className="relative">
                                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input 
                                        type="text" 
                                        required 
                                        placeholder="Set login password"
                                        value={studentPassword} 
                                        onChange={(e) => setStudentPassword(e.target.value)} 
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none text-sm" 
                                      />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                          <School className="w-3 h-3" /> School Origin
                                      </label>
                                      <input 
                                          type="text" 
                                          value={studentSchool} 
                                          onChange={(e) => setStudentSchool(e.target.value)} 
                                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none text-sm"
                                          placeholder="e.g. SMAN 1"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Branch
                                    </label>
                                    <select 
                                      value={studentLocationId}
                                      onChange={(e) => setStudentLocationId(e.target.value)}
                                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none bg-white text-sm"
                                    >
                                      <option value="">-- Select Location --</option>
                                      {MOCK_LOCATIONS.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                          {loc.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                            <Button type="button" variant="outline" onClick={() => setView('list')}>Cancel</Button>
                            <Button type="submit" className="px-8 shadow-lg">{isEditing ? "Update Accounts" : "Create Accounts"}</Button>
                        </div>
                    </form>
                    {success && <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 font-bold text-center">Accounts {isEditing ? "updated" : "created"} successfully!</div>}
                </Card>
            )}
        </>
      )}

      {/* --- TEACHERS TAB --- */}
      {activeTab === 'teachers' && (
         <>
            {view === 'list' ? (
                <div className="space-y-6">
                    <Card className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  <tr>
                                      <th className="px-6 py-4">Teacher Name</th>
                                      <th className="px-6 py-4">Assigned Location</th>
                                      <th className="px-6 py-4">Status</th>
                                      <th className="px-6 py-4">Monthly Workload</th>
                                      <th className="px-6 py-4 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {teachers.map((t, idx) => {
                                      const workload = getTeacherMonthlyWorkload(t.id);
                                      const workloadColor = workload.studentCount > 20 ? 'text-red-600 bg-red-50 border-red-100' : 
                                                            workload.studentCount > 10 ? 'text-yellow-600 bg-yellow-50 border-yellow-100' : 
                                                            'text-green-600 bg-green-50 border-green-100';
                                      
                                      return (
                                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                              <td className="px-6 py-4">
                                                  <div className="font-bold text-gray-900">{t.name}</div>
                                                  <div className="text-xs text-gray-400 font-medium">{t.email}</div>
                                              </td>
                                              <td className="px-6 py-4">
                                                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold uppercase">
                                                      <MapPin className="w-3.5 h-3.5" />
                                                      {getLocationName(t.assignedLocationId)}
                                                  </div>
                                              </td>
                                              <td className="px-6 py-4">
                                                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                     {t.status || 'ACTIVE'}
                                                  </span>
                                              </td>
                                              <td className="px-6 py-4">
                                                  <div className="flex items-center gap-4">
                                                      <div className={`flex flex-col items-center justify-center min-w-[70px] px-3 py-1.5 rounded-xl border ${workloadColor}`}>
                                                          <span className="text-lg font-black leading-none">{workload.studentCount}</span>
                                                          <span className="text-[8px] font-black uppercase mt-1">Students</span>
                                                      </div>
                                                  </div>
                                              </td>
                                              <td className="px-6 py-4 text-right">
                                                  <div className="flex justify-end gap-2">
                                                    <button 
                                                      onClick={() => handleEditTeacher(t)}
                                                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                      <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                      onClick={() => setDeleteConfirm({ isOpen: true, id: t.id, name: t.name })}
                                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                        </div>
                    </Card>
                </div>
            ) : (
                <Card title={isEditing ? "Edit Teacher" : "Add New Teacher"}>
                     <form onSubmit={handleTeacherSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Teacher Name</label>
                                <input type="text" required value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Email Address</label>
                                <input type="email" required value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Password</label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input 
                                    type="text" 
                                    required 
                                    placeholder="Set login password"
                                    value={teacherPassword} 
                                    onChange={(e) => setTeacherPassword(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none" 
                                  />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Teacher Status
                                </label>
                                <select 
                                  value={teacherStatus}
                                  onChange={(e) => setTeacherStatus(e.target.value as any)}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none bg-white font-bold"
                                >
                                  <option value="ACTIVE">ACTIVE / TEACHING</option>
                                  <option value="INACTIVE">INACTIVE / RESIGNED</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-blue-600" /> Assigned Branch
                            </label>
                            <select 
                              required
                              value={teacherLocationId}
                              onChange={(e) => setTeacherLocationId(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 theme-ring-primary focus:border-transparent outline-none bg-white"
                            >
                              <option value="">-- Select Location --</option>
                              {MOCK_LOCATIONS.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                  {loc.name}
                                </option>
                              ))}
                            </select>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <Button type="button" variant="outline" onClick={() => setView('list')}>Cancel</Button>
                            <Button type="submit" className="px-8 shadow-lg">{isEditing ? "Update Profile" : "Create Teacher"}</Button>
                        </div>
                     </form>
                     {success && <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 font-bold text-center">Teacher {isEditing ? "updated" : "added"} successfully!</div>}
                </Card>
            )}
         </>
      )}

      {/* --- MODAL: GLOBAL DELETE CONFIRMATION (COMPACT) --- */}
      {deleteConfirm.isOpen && (
         <div className="fixed inset-0 z-[200] overflow-y-auto bg-red-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden border-2 border-red-50 animate-in zoom-in-95 duration-200">
               <div className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                     <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Hapus Akun</h3>
                     <p className="text-xs text-gray-500 font-medium">Apakah Anda yakin ingin menghapus akun <span className="font-bold text-gray-800">"{deleteConfirm.name}"</span>? Seluruh data akses akan hilang.</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button onClick={() => setDeleteConfirm({...deleteConfirm, isOpen: false})} className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-[10px] uppercase transition-all">Batal</button>
                     <button onClick={handleDeleteAccount} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-red-200 transition-all">Hapus Akun</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

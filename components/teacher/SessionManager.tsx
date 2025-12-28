
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MOCK_SESSIONS, LEVEL_COLORS, MOCK_USERS, MOCK_SESSION_REPORTS, MOCK_HOMEWORKS, MOCK_SCHOOLS } from '../../constants';
import { ClassSession, UserRole, StudentSessionReport, CEFRLevel, Homework, SkillCategory, DifficultyLevel } from '../../types';
import { Clock, MapPin, Calendar, CheckCircle, FileText, Upload, Trash2, Download, ShieldCheck, ShieldAlert, UserCheck, PenLine, Save, X, BookOpen, ClipboardList, Award, Mic, FileEdit, Plus, School, ChevronRight, GraduationCap } from 'lucide-react';
import { SKILL_ICONS } from '../student/StudentView';

export const SessionManager: React.FC = () => {
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [reports, setReports] = useState<Record<string, StudentSessionReport[]>>(MOCK_SESSION_REPORTS);
  const [homeworks, setHomeworks] = useState<Homework[]>(MOCK_HOMEWORKS);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailTab, setDetailTab] = useState<'students' | 'materials'>('students');

  // Form states for student scores
  const [editForm, setEditForm] = useState<{
    writtenScore: string;
    oralScore: string;
    cefrLevel: CEFRLevel | '';
    teacherNotes: string;
  }>({ writtenScore: '', oralScore: '', cefrLevel: '', teacherNotes: '' });

  // Homework form
  const [hwForm, setHwForm] = useState({ title: '', description: '', dueDate: '' });

  // Create schedule form
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    topic: '',
    skillCategory: '' as SkillCategory | '',
    difficultyLevel: '' as DifficultyLevel | '',
    description: '',
    materials: [] as string[]
  });

  const now = new Date();

  // Get schools
  const schools = MOCK_SCHOOLS;

  // Filter sessions by selected school
  const filteredSessions = selectedSchool
    ? MOCK_SESSIONS.filter(s => s.location.includes(selectedSchool.split(' - ')[0]))
    : MOCK_SESSIONS;

  const upcomingSessions = filteredSessions.filter(s => new Date(s.dateTime) > now);
  const pastSessions = filteredSessions.filter(s => new Date(s.dateTime) <= now);

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
      alert('Judul dan tanggal deadline harus diisi!');
      return;
    }
    const enrolledStudents = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
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

  const handleCreateSchedule = () => {
    if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.topic || !selectedSchool) {
      alert('Silakan lengkapi semua field yang wajib diisi!');
      return;
    }
    // In real app, this would POST to backend
    console.log('Creating schedule:', { ...scheduleForm, location: selectedSchool });
    alert('Jadwal berhasil ditambahkan!');
    setShowCreateModal(false);
    setScheduleForm({
      date: '',
      time: '',
      topic: '',
      skillCategory: '',
      difficultyLevel: '',
      description: '',
      materials: []
    });
  };

  // --- SCHOOL SELECTION VIEW ---
  if (!selectedSchool) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600" /> Pilih Sekolah
          </h2>
          <p className="text-xs text-gray-500">Pilih sekolah terlebih dahulu untuk mengelola jadwal kelas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {schools.map((school) => (
            <Card
              key={school.id}
              className="!p-4 cursor-pointer hover:border-blue-400 transition-all group"
              onClick={() => setSelectedSchool(school.name)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <School className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600">{school.name}</h3>
                  <p className="text-[10px] text-gray-500">{school.address}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
              </div>
            </Card>
          ))}
          {/* Online option */}
          <Card
            className="!p-4 cursor-pointer hover:border-purple-400 transition-all group"
            onClick={() => setSelectedSchool('Online (Zoom)')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600">Online (Zoom)</h3>
                <p className="text-[10px] text-gray-500">Kelas Virtual</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- DETAIL VIEW ---
  if (selectedSession) {
    const Icon = SKILL_ICONS[selectedSession.skillCategory];
    const enrolledStudents = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
    const sessionReports = reports[selectedSession.id] || [];
    const sessionHomeworks = homeworks.filter(h => h.sessionId === selectedSession.id);
    const isPast = new Date(selectedSession.dateTime) <= now;

    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => setSelectedSession(null)} className="text-xs py-1.5 px-3">
                Back
             </Button>
             <div>
                <h2 className="text-lg font-bold text-gray-900">Class Report</h2>
                <p className="text-xs text-gray-500">Input nilai dan materi pembelajaran</p>
             </div>
           </div>
           {isPast && (
             <Button onClick={() => setShowHomeworkModal(true)} className="text-xs py-1.5 px-3">
               Assign Homework
             </Button>
           )}
        </div>

        {/* Session Info Card */}
        <Card className="!p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 bg-gray-800 text-white px-2 py-1 rounded text-[9px] uppercase font-bold">
                <Icon className="w-3 h-3" /> {selectedSession.skillCategory}
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
        </Card>

        {/* Detail Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          <button onClick={() => setDetailTab('students')} className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${detailTab === 'students' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            Student Reports
          </button>
          <button onClick={() => setDetailTab('materials')} className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${detailTab === 'materials' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            Materials
          </button>
        </div>

        {detailTab === 'students' && (
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

        {detailTab === 'materials' && (
          <Card className="!p-4">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Materi Pembelajaran
            </h4>
            <div className="space-y-3">
              {selectedSession.materials && selectedSession.materials.length > 0 ? (
                <div className="space-y-2">
                  {selectedSession.materials.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                      <FileText className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="truncate flex-1">{file}</span>
                      <button className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 italic">Belum ada materi.</p>
              )}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-[10px] text-gray-400">Drag & drop atau klik untuk upload</p>
                <input type="file" className="hidden" />
              </div>
              <Button variant="outline" className="text-xs py-1.5 px-3 w-full">
                Tambah Materi
              </Button>
            </div>
          </Card>
        )}

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
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedSchool(null)} className="text-xs py-1.5 px-3">
            Ganti Sekolah
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Jadwal Mengajar
            </h2>
            <p className="text-xs text-gray-500">{selectedSchool}</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="text-xs py-1.5 px-3">
          Tambah Jadwal
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
              const enrolledCount = MOCK_USERS.filter(u => u.role === UserRole.STUDENT).length;

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
                      {session.skillCategory}
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
                <Calendar className="w-4 h-4 text-blue-600" /> Tambah Jadwal Baru
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Tanggal</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Waktu</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  className="w-full border rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Topik/Materi</label>
              <input
                type="text"
                value={scheduleForm.topic}
                onChange={e => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
                className="w-full border rounded-lg px-3 py-1.5 text-xs"
                placeholder="e.g. Business English: Negotiation"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Skill Category</label>
                <select
                  value={scheduleForm.skillCategory}
                  onChange={e => setScheduleForm({ ...scheduleForm, skillCategory: e.target.value as SkillCategory })}
                  className="w-full border rounded-lg px-3 py-1.5 text-xs bg-white"
                >
                  <option value="">Pilih kategori...</option>
                  {skillCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Difficulty Level</label>
                <select
                  value={scheduleForm.difficultyLevel}
                  onChange={e => setScheduleForm({ ...scheduleForm, difficultyLevel: e.target.value as DifficultyLevel })}
                  className="w-full border rounded-lg px-3 py-1.5 text-xs bg-white"
                >
                  <option value="">Pilih level...</option>
                  {difficultyLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Deskripsi</label>
              <textarea
                value={scheduleForm.description}
                onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-1.5 text-xs"
                rows={3}
                placeholder="Deskripsi materi yang akan diajarkan..."
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Lokasi Terpilih</p>
              <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" /> {selectedSchool}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <Button onClick={handleCreateSchedule} className="flex-1 text-xs py-2">
                Simpan Jadwal
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

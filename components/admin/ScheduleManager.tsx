
import React, { useState } from 'react';
import { Card } from '../Card';
import { Calendar, Clock, User as UserIcon, BookOpen, MapPin, Eye, Filter, School } from 'lucide-react';
import { MOCK_USERS, MOCK_SESSIONS, MOCK_SCHOOLS, MOCK_SESSION_REPORTS } from '../../constants';
import { UserRole, ClassSession } from '../../types';
import { LEVEL_COLORS } from '../../constants';
import { SKILL_ICONS } from '../student/StudentView';

export const ScheduleManager: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  const teachers = MOCK_USERS.filter(u => u.role === UserRole.TEACHER);
  const schools = MOCK_SCHOOLS;

  // Filter sessions based on selected filters
  let filteredSessions = [...MOCK_SESSIONS];

  if (selectedLocation !== 'all') {
    filteredSessions = filteredSessions.filter(s => s.location.includes(selectedLocation));
  }

  if (selectedTeacher !== 'all') {
    filteredSessions = filteredSessions.filter(s => s.teacherId === selectedTeacher);
  }

  // Sort by date (newest first)
  filteredSessions = filteredSessions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const getTeacherName = (id: string) => {
    return MOCK_USERS.find(u => u.id === id)?.name || 'Unknown Teacher';
  };

  const getSessionStatus = (session: ClassSession) => {
    const now = new Date();
    const sessionDate = new Date(session.dateTime);
    const reports = MOCK_SESSION_REPORTS[session.id] || [];

    if (sessionDate > now) {
      return { label: 'Upcoming', color: 'bg-blue-50 text-blue-700 border-blue-100' };
    }
    if (reports.length > 0) {
      return { label: 'Reported', color: 'bg-green-50 text-green-700 border-green-100' };
    }
    return { label: 'Needs Input', color: 'bg-orange-50 text-orange-700 border-orange-100' };
  };

  // Detail view for a selected session
  if (selectedSession) {
    const Icon = SKILL_ICONS[selectedSession.skillCategory];
    const reports = MOCK_SESSION_REPORTS[selectedSession.id] || [];
    const status = getSessionStatus(selectedSession);

    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedSession(null)}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
          >
            Back
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Session Detail</h2>
            <p className="text-xs text-gray-500">View-only: Data diinput oleh guru</p>
          </div>
        </div>

        {/* Session Info */}
        <Card className="!p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 bg-gray-800 text-white px-2 py-1 rounded text-[9px] uppercase font-bold">
                <Icon className="w-3 h-3" /> {selectedSession.skillCategory}
              </span>
              <span className={`px-2 py-1 rounded text-[9px] uppercase font-bold ${LEVEL_COLORS[selectedSession.difficultyLevel]}`}>
                {selectedSession.difficultyLevel}
              </span>
              <span className={`px-2 py-1 rounded text-[9px] uppercase font-bold border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">{selectedSession.topic}</h3>
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(selectedSession.dateTime).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedSession.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedSession.location}</span>
                <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {getTeacherName(selectedSession.teacherId)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Student Reports */}
          <div className="lg:col-span-2">
            <Card className="!p-0 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-700">Student Reports (Input by Teacher)</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2 text-center">Written</th>
                    <th className="px-4 py-2 text-center">Oral</th>
                    <th className="px-4 py-2 text-center">CEFR</th>
                    <th className="px-4 py-2">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-xs italic">
                        Belum ada data. Guru belum menginput nilai untuk sesi ini.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">
                              {report.studentName.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{report.studentName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {report.writtenScore !== undefined ? (
                            <span className={`font-bold ${report.writtenScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                              {report.writtenScore}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {report.oralScore !== undefined ? (
                            <span className={`font-bold ${report.oralScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                              {report.oralScore}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {report.cefrLevel ? (
                            <span className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-teal-100">
                              {report.cefrLevel.split(' - ')[0]}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {report.teacherNotes ? (
                            <span className="text-[10px] text-gray-600 italic line-clamp-2">"{report.teacherNotes}"</span>
                          ) : (
                            <span className="text-gray-300 text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Session Details Sidebar */}
          <div className="space-y-4">
            <Card className="!p-3">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</h4>
              <p className="text-xs text-gray-600">{selectedSession.description || 'No description provided.'}</p>
            </Card>
            <Card className="!p-3">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Materials</h4>
              {selectedSession.materials && selectedSession.materials.length > 0 ? (
                <div className="space-y-1">
                  {selectedSession.materials.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                      <BookOpen className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="truncate flex-1">{file}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 italic">No materials attached.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> Class Schedule
          </h2>
          <p className="text-xs text-gray-500">Lihat seluruh jadwal yang diinput oleh guru (read-only).</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
            <School className="w-3 h-3 text-gray-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="text-xs bg-transparent outline-none pr-4"
            >
              <option value="all">Semua Sekolah</option>
              {schools.map(school => (
                <option key={school.id} value={school.name}>{school.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
            <UserIcon className="w-3 h-3 text-gray-400" />
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="text-xs bg-transparent outline-none pr-4"
            >
              <option value="all">Semua Guru</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
        <Eye className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-blue-800 font-medium">Mode View-Only</p>
          <p className="text-[10px] text-blue-600">Jadwal kelas diinput dan dikelola oleh guru masing-masing. Admin dapat melihat seluruh jadwal di sini.</p>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                 <th className="px-3 py-2">Date/Time</th>
                 <th className="px-3 py-2">Category</th>
                 <th className="px-3 py-2">Topic</th>
                 <th className="px-3 py-2">Teacher</th>
                 <th className="px-3 py-2">Sekolah</th>
                 <th className="px-3 py-2">Status</th>
                 <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSessions.map(session => {
                const status = getSessionStatus(session);
                return (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="text-xs font-medium text-gray-900">{new Date(session.dateTime).toLocaleDateString()}</div>
                      <div className="text-[10px] text-gray-500">{new Date(session.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tight bg-gray-100 px-1.5 py-0.5 rounded">
                         {session.skillCategory}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700 font-medium">
                      {session.topic}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                         <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[9px] font-bold text-gray-600">
                            {getTeacherName(session.teacherId).charAt(0)}
                         </div>
                         <span className="text-xs text-gray-900">{getTeacherName(session.teacherId)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 text-[10px] text-gray-600 font-medium">
                        <MapPin className="w-3 h-3 text-orange-500" /> {session.location}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100 ml-auto"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-xs italic">
                    No schedules found with the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

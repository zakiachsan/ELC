
import React, { useState } from 'react';
import { Card } from '../Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, SkillCategory, DifficultyLevel, CEFRLevel, Homework } from '../../types';
import { MOCK_SESSIONS, MOCK_SESSION_REPORTS, MOCK_MODULE_PROGRESS, MOCK_ONLINE_MODULES, LEVEL_COLORS, MOCK_HOMEWORKS } from '../../constants';
import { SKILL_ICONS } from '../student/StudentView';
import { TrendingUp, Calendar, CheckCircle, Clock, MapPin, AlertTriangle, BookOpen, Brain, List, Activity, History, Award, FileText, PenLine, Mic, ClipboardCheck, Play, X } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

// --- SHARED DATA HOOK ---
const useParentData = (student: User) => {
  // 1. Attendance Logic
  const attendanceRecords = MOCK_SESSIONS
    .filter(s => new Date(s.dateTime) <= new Date())
    .map(s => {
       const report = MOCK_SESSION_REPORTS[s.id]?.find(r => r.studentId === student.id);
       return report ? report.attendanceStatus : 'PENDING';
    });

  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(s => s === 'PRESENT').length;
  const lateCount = attendanceRecords.filter(s => s === 'LATE').length;
  const absentCount = attendanceRecords.filter(s => s === 'ABSENT').length;
  const attendanceRate = totalClasses > 0 ? Math.round(((presentCount + (lateCount * 0.5)) / totalClasses) * 100) : 0;

  // 2. Get all session reports for this student with scores
  const sessionGrades = MOCK_SESSIONS.map(s => {
    const report = MOCK_SESSION_REPORTS[s.id]?.find(r => r.studentId === student.id);
    if (!report) return null;
    return {
      sessionId: s.id,
      date: s.dateTime,
      topic: s.topic,
      skillCategory: s.skillCategory,
      writtenScore: report.writtenScore,
      oralScore: report.oralScore,
      cefrLevel: report.cefrLevel,
      teacherNotes: report.teacherNotes
    };
  }).filter(Boolean);

  // 3. CEFR progression chart data
  const cefrChartData = sessionGrades
    .filter(g => g?.cefrLevel)
    .map(g => {
      const cefrOrder: Record<string, number> = {
        'A1 - Beginner': 1,
        'A2 - Elementary': 2,
        'B1 - Intermediate': 3,
        'B2 - Upper Intermediate': 4,
        'C1 - Advanced': 5,
        'C2 - Proficient': 6
      };
      return {
        name: new Date(g!.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        level: cefrOrder[g!.cefrLevel!] || 0,
        label: g!.cefrLevel?.split(' - ')[0]
      };
    });

  // 4. Homework for this student
  const studentHomeworks = MOCK_HOMEWORKS.filter(h => h.studentId === student.id);
  const pendingHomeworks = studentHomeworks.filter(h => h.status === 'PENDING');
  const completedHomeworks = studentHomeworks.filter(h => h.status !== 'PENDING');

  // 5. Schedule Logic
  const upcomingClasses = MOCK_SESSIONS
    .filter(s => new Date(s.dateTime) > new Date())
    .sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const pastClasses = MOCK_SESSIONS
    .filter(s => new Date(s.dateTime) <= new Date())
    .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // 6. Latest CEFR level
  const latestCefr = sessionGrades.filter(g => g?.cefrLevel).pop()?.cefrLevel;

  // 7. Average scores
  const writtenScores = sessionGrades.filter(g => g?.writtenScore !== undefined).map(g => g!.writtenScore!);
  const oralScores = sessionGrades.filter(g => g?.oralScore !== undefined).map(g => g!.oralScore!);
  const avgWritten = writtenScores.length > 0 ? Math.round(writtenScores.reduce((a, b) => a + b, 0) / writtenScores.length) : null;
  const avgOral = oralScores.length > 0 ? Math.round(oralScores.reduce((a, b) => a + b, 0) / oralScores.length) : null;

  return {
    attendanceRate, presentCount, lateCount, absentCount,
    sessionGrades, cefrChartData, studentHomeworks, pendingHomeworks, completedHomeworks,
    upcomingClasses, pastClasses, latestCefr, avgWritten, avgOral
  };
};

// --- COMPONENT 1: OVERVIEW ---
export const ParentOverview: React.FC<{ student: User }> = ({ student }) => {
  const { attendanceRate, cefrChartData, pendingHomeworks, latestCefr, avgWritten, avgOral, upcomingClasses } = useParentData(student);
  const { settings } = useSettings();
  const [showVideoModal, setShowVideoModal] = useState(false);

  const isPortrait = settings.videoOrientation === 'portrait';

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Promotional Video Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 rounded-xl p-4 text-white">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Play className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{settings.videoTitle}</span>
            </div>
            <h3 className="text-sm font-bold mb-1">Lihat video terbaru dari ELC!</h3>
            <p className="text-[10px] text-white/80 line-clamp-2">{settings.videoDescription}</p>
          </div>
          <button
            onClick={() => setShowVideoModal(true)}
            className="flex items-center gap-2 bg-white text-teal-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-teal-50 transition-colors shadow-md"
          >
            <Play className="w-4 h-4" /> Tonton Video
          </button>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative ${isPortrait ? 'w-full max-w-sm' : 'w-full max-w-2xl'}`}>
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-3 right-3 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-4">
              <div className="flex items-center gap-2 text-white/90 mb-3">
                <Play className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold">{settings.videoTitle}</span>
              </div>
              <div className={`relative rounded-xl overflow-hidden bg-black ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`}>
                <iframe className="w-full h-full" src={settings.videoUrl} title="Promo Video" allowFullScreen></iframe>
              </div>
              <p className="text-gray-400 text-[10px] mt-3 italic">{settings.videoDescription}</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Parent Dashboard</h2>
          <p className="text-xs text-gray-500">Monitoring: <span className="font-bold text-blue-600">{student.name}</span></p>
        </div>
        <div className="flex gap-3">
          <div className="text-right px-3 border-r border-gray-200">
            <p className="text-[9px] text-gray-500 font-bold uppercase">Attendance</p>
            <p className={`text-lg font-bold ${attendanceRate >= 80 ? 'text-green-600' : 'text-yellow-500'}`}>
              {attendanceRate}%
            </p>
          </div>
          <div className="text-right px-3 border-r border-gray-200">
            <p className="text-[9px] text-gray-500 font-bold uppercase">CEFR Level</p>
            <p className="text-lg font-bold text-teal-600">{latestCefr?.split(' - ')[0] || 'N/A'}</p>
          </div>
          <div className="text-right px-2">
            <p className="text-[9px] text-gray-500 font-bold uppercase">Homework</p>
            <p className={`text-lg font-bold ${pendingHomeworks.length > 0 ? 'text-orange-500' : 'text-green-600'}`}>
              {pendingHomeworks.length} pending
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Stats Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Score Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="!p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PenLine className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-blue-600 uppercase">Avg Written</p>
                  <p className="text-lg font-bold text-blue-900">{avgWritten ?? '—'}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mic className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-purple-600 uppercase">Avg Oral</p>
                  <p className="text-lg font-bold text-purple-900">{avgOral ?? '—'}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-3 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-teal-600 uppercase">CEFR</p>
                  <p className="text-lg font-bold text-teal-900">{latestCefr?.split(' - ')[0] || '—'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* CEFR Progression Chart */}
          <Card className="!p-4">
            <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" /> CEFR Level Progression
            </h3>
            <div className="h-48">
              {cefrChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cefrChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tickFormatter={(v) => ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'][v]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value, name, props) => [props.payload.label, 'CEFR Level']} />
                    <Line type="monotone" dataKey="level" stroke="#0d9488" strokeWidth={3} dot={{ r: 5, fill: '#0d9488' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">
                  No CEFR data recorded yet.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT: Pending Homework */}
        <div className="space-y-4">
          <Card className="!p-3">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-orange-500" /> Pending Homework
            </h4>
            {pendingHomeworks.length > 0 ? (
              <div className="space-y-2">
                {pendingHomeworks.map(hw => (
                  <div key={hw.id} className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-xs font-bold text-gray-900">{hw.title}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-2">{hw.description}</p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-orange-600 font-bold">
                      <Clock className="w-3 h-3" />
                      Due: {new Date(hw.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-[10px] text-gray-500">All homework completed!</p>
              </div>
            )}
          </Card>

          <Card className="!p-3">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" /> Next Class
            </h4>
            {upcomingClasses.length > 0 ? (
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-gray-900">{upcomingClasses[0].topic}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-blue-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(upcomingClasses[0].dateTime).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(upcomingClasses[0].dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic">No upcoming classes.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT 2: ACTIVITY LOG (Grades History) ---
export const ParentActivityLog: React.FC<{ student: User }> = ({ student }) => {
  const { sessionGrades, completedHomeworks } = useParentData(student);
  const [activeTab, setActiveTab] = useState<'grades' | 'homework'>('grades');

  return (
    <div className="space-y-4 animate-in fade-in">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Grades & Homework</h2>
        <p className="text-xs text-gray-500">Track {student.name}'s academic progress and assignments.</p>
      </div>

      <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('grades')}
          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${activeTab === 'grades' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <ClipboardCheck className="w-3 h-3" /> Grades
        </button>
        <button
          onClick={() => setActiveTab('homework')}
          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${activeTab === 'homework' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <BookOpen className="w-3 h-3" /> Homework
        </button>
      </div>

      {activeTab === 'grades' ? (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Topic</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-center">Written</th>
                <th className="px-4 py-2 text-center">Oral</th>
                <th className="px-4 py-2 text-center">CEFR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessionGrades.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs italic">No grades recorded yet.</td></tr>
              )}
              {sessionGrades.map((grade, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-900 font-medium">
                    {new Date(grade!.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-xs font-bold text-gray-900">{grade!.topic}</div>
                    {grade!.teacherNotes && (
                      <div className="text-[10px] text-gray-500 italic">"{grade!.teacherNotes}"</div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[9px] font-bold text-gray-600 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                      {grade!.skillCategory}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {grade!.writtenScore !== undefined ? (
                      <span className={`font-bold ${grade!.writtenScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {grade!.writtenScore}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {grade!.oralScore !== undefined ? (
                      <span className={`font-bold ${grade!.oralScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {grade!.oralScore}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {grade!.cefrLevel ? (
                      <span className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-teal-100">
                        {grade!.cefrLevel.split(' - ')[0]}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Due Date</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {completedHomeworks.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-xs italic">No completed homework yet.</td></tr>
              )}
              {completedHomeworks.map(hw => (
                <tr key={hw.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs font-bold text-gray-900">{hw.title}</td>
                  <td className="px-4 py-2">
                    <div className="text-xs text-gray-600 line-clamp-2">{hw.description}</div>
                    {hw.feedback && (
                      <div className="text-[10px] text-blue-600 italic mt-1">Feedback: {hw.feedback}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[10px] text-gray-500">
                    {new Date(hw.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      hw.status === 'GRADED' ? 'bg-green-100 text-green-700' :
                      hw.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {hw.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {hw.score !== undefined ? (
                      <span className={`font-bold ${hw.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {hw.score}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// --- COMPONENT 3: SCHEDULE ---
export const ParentSchedule: React.FC<{ student: User }> = ({ student }) => {
  const { upcomingClasses, pastClasses } = useParentData(student);
  const [view, setView] = useState<'upcoming' | 'history'>('upcoming');

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Class Schedule</h2>
          <p className="text-xs text-gray-500">View {student.name}'s class timings.</p>
        </div>

        <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setView('upcoming')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${view === 'upcoming' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${view === 'history' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            History
          </button>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Topic</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(view === 'upcoming' ? upcomingClasses : pastClasses).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-xs italic">
                  No {view === 'upcoming' ? 'upcoming' : 'past'} classes.
                </td>
              </tr>
            )}
            {(view === 'upcoming' ? upcomingClasses : pastClasses).map(session => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <div className="text-xs font-medium text-gray-900">{new Date(session.dateTime).toLocaleDateString()}</div>
                  <div className="text-[10px] text-gray-500">{new Date(session.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

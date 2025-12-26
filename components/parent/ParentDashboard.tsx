
import React, { useState } from 'react';
import { Card } from '../Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, SkillCategory, DifficultyLevel } from '../../types';
import { MOCK_SESSIONS, MOCK_SESSION_REPORTS, MOCK_MODULE_PROGRESS, MOCK_ONLINE_MODULES, LEVEL_COLORS } from '../../constants';
import { SKILL_ICONS } from '../student/StudentView';
import { TrendingUp, Calendar, CheckCircle, Clock, MapPin, AlertTriangle, BookOpen, Brain, List, Activity, History } from 'lucide-react';

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

  // 2. Exam/Quiz History (Unified)
  const classExams = MOCK_SESSIONS.map(s => {
      const report = MOCK_SESSION_REPORTS[s.id]?.find(r => r.studentId === student.id);
      if(!report || report.examScore === undefined) return null;
      return {
          id: s.id,
          date: s.dateTime,
          title: s.topic,
          type: 'Class Exam',
          score: report.examScore,
          passed: report.examScore >= 70,
          category: s.skillCategory
      };
  }).filter(Boolean);

  const onlineQuizzes = MOCK_MODULE_PROGRESS.filter(p => p.studentId === student.id && p.status === 'COMPLETED').map(p => {
      const mod = MOCK_ONLINE_MODULES.find(m => m.id === p.moduleId);
      return {
          id: p.moduleId,
          date: p.completedDate || new Date().toISOString(),
          title: mod?.title || 'Unknown Module',
          type: 'Online Module',
          score: p.quizScore || 0,
          passed: (p.quizScore || 0) >= 70,
          category: mod?.skillCategory || SkillCategory.GRAMMAR
      };
  });

  const allActivities = [...classExams, ...onlineQuizzes].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 3. Schedule Logic (Upcoming & Past)
  const upcomingClasses = MOCK_SESSIONS
    .filter(s => new Date(s.dateTime) > new Date())
    .sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const pastClasses = MOCK_SESSIONS
    .filter(s => new Date(s.dateTime) <= new Date())
    .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // 4. Chart Data
  const chartData = allActivities.slice(0, 5).reverse().map(a => ({
      name: a.title.substring(0, 15) + '...',
      score: a.score,
      passing: 70
  }));

  return {
    attendanceRate, presentCount, lateCount, absentCount,
    allActivities, upcomingClasses, pastClasses, chartData
  };
};

// --- COMPONENT 1: OVERVIEW (Skills Moved Away) ---
export const ParentOverview: React.FC<{ student: User }> = ({ student }) => {
  const { attendanceRate, presentCount, lateCount, absentCount, chartData, upcomingClasses } = useParentData(student);

  return (
    <div className="space-y-6 animate-in fade-in">
       {/* HEADER */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Parent Dashboard</h2>
          <p className="text-gray-500">Monitoring: <span className="font-bold text-blue-600 text-lg">{student.name}</span></p>
        </div>
        <div className="flex gap-4">
             <div className="text-right px-4 border-r border-gray-200">
                <p className="text-xs text-gray-500 font-bold uppercase">Attendance Rate</p>
                <p className={`text-2xl font-bold ${attendanceRate >= 80 ? 'text-green-600' : 'text-yellow-500'}`}>
                    {attendanceRate}%
                </p>
             </div>
             <div className="text-right px-2">
                <p className="text-xs text-gray-500 font-bold uppercase">Next Class</p>
                <p className="text-sm font-bold text-gray-900">
                    {upcomingClasses.length > 0 ? new Date(upcomingClasses[0].dateTime).toLocaleDateString() : 'No Schedule'}
                </p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COL: CHART & ALERTS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Score Trend Chart */}
            <Card title="Recent Performance Trend">
                <div className="h-64">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          {/* Updated Blue Line */}
                          <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} name="Score" dot={{r: 4}} />
                          {/* Updated Yellow Line */}
                          <Line type="monotone" dataKey="passing" stroke="#eab308" strokeDasharray="5 5" name="Passing Grade" />
                        </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 italic">
                        No graded activities recorded yet.
                    </div>
                  )}
                </div>
            </Card>
          </div>

          {/* RIGHT COL: ATTENDANCE SUMMARY */}
          <div className="lg:col-span-1 space-y-6">
            <Card title="Attendance Summary">
                <div className="flex items-center justify-center py-6">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                        {/* Updated to Blue */}
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#2563eb" strokeWidth="12" strokeDasharray={`${attendanceRate * 3.51} 351`} />
                      </svg>
                      <span className="absolute text-2xl font-bold text-gray-900">{attendanceRate}%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-100">
                      <span className="text-sm font-medium text-green-800 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Present
                      </span>
                      <span className="font-bold text-green-800">{presentCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded border border-yellow-100">
                      <span className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Late
                      </span>
                      <span className="font-bold text-yellow-800">{lateCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-100">
                      <span className="text-sm font-medium text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Absent
                      </span>
                      <span className="font-bold text-red-800">{absentCount}</span>
                  </div>
                </div>
            </Card>
          </div>
      </div>
    </div>
  );
}

// --- COMPONENT 2: ACTIVITY LOG (Skills Moved Here) ---
export const ParentActivityLog: React.FC<{ student: User }> = ({ student }) => {
  const { allActivities } = useParentData(student);
  
  return (
    <div className="space-y-6 animate-in fade-in">
       <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Progress & History</h2>
          <p className="text-gray-500">Track skill levels and detailed assignment history.</p>
       </div>

        {/* Current Skill Snapshot (Moved from Overview) - No Progress Bars */}
        <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" /> Current Skill Levels
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.values(SkillCategory).map(skill => {
                    const level = student.skillLevels?.[skill];
                    const Icon = SKILL_ICONS[skill];
                    
                    return (
                    <div key={skill} className="bg-white px-3 py-3 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center text-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${level ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300'}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 w-full">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate">{skill}</h4>
                            <div className={`text-xs font-bold mt-1 ${level ? 'text-gray-900' : 'text-gray-400'}`}>
                                {level ? level.replace('-', ' ') : 'N/A'}
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
       
       <Card title="Activity Log Details">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Activity Name</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {allActivities.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400 italic">No activities found.</td></tr>
                    )}
                    {allActivities.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-gray-400">{item.category}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                                item.type === 'Class Exam' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                                {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">
                            {item.score}
                          </td>
                          <td className="px-6 py-4">
                            {item.passed ? (
                                <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                                  <CheckCircle className="w-3 h-3" /> Passed
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-bold">
                                  <AlertTriangle className="w-3 h-3" /> Failed
                                </span>
                            )}
                          </td>
                      </tr>
                    ))}
                </tbody>
              </table>
          </div>
       </Card>
    </div>
  );
}

// --- COMPONENT 3: SCHEDULE (Added History) ---
export const ParentSchedule: React.FC<{ student: User }> = ({ student }) => {
   const { upcomingClasses, pastClasses } = useParentData(student);
   const [view, setView] = useState<'upcoming' | 'history'>('upcoming');

   return (
      <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Class Schedule</h2>
                <p className="text-gray-500">Manage class timings and review attended sessions.</p>
            </div>
            
            <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                <button 
                    onClick={() => setView('upcoming')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${view === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Upcoming
                </button>
                <button 
                    onClick={() => setView('history')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${view === 'history' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    History
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {view === 'upcoming' && upcomingClasses.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No upcoming classes scheduled.</p>
                  </div>
              )}

              {view === 'history' && pastClasses.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No class history available.</p>
                  </div>
              )}

              {(view === 'upcoming' ? upcomingClasses : pastClasses).map((session) => (
                  <div key={session.id} className={`bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all ${view === 'upcoming' ? 'hover:border-blue-300' : 'opacity-90'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`rounded-lg p-3 text-center min-w-[70px] ${view === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          <div className="text-xs font-bold uppercase">{new Date(session.dateTime).toLocaleString('default', {month: 'short'})}</div>
                          <div className="text-2xl font-bold">{new Date(session.dateTime).getDate()}</div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="font-bold text-gray-900">{session.topic}</h4>
                          <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4 text-blue-500" />
                                {new Date(session.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                {session.location}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                                {session.skillCategory}
                              </div>
                          </div>
                        </div>
                    </div>
                  </div>
              ))}
          </div>
      </div>
   );
}

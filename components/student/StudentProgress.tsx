
import React, { useState } from 'react';
import { User, SkillCategory, CEFRLevel, Homework, DifficultyLevel } from '../../types';
import { Card } from '../Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSessions } from '../../hooks/useSessions';
import { useReports } from '../../hooks/useReports';
import { useHomeworks } from '../../hooks/useHomeworks';
import { TrendingUp, BookOpen, Clock, CheckCircle, ClipboardCheck, Calendar, Loader2 } from 'lucide-react';

export const StudentProgress: React.FC<{ student: User }> = ({ student }) => {
  const { sessions: sessionsData, loading: sessionsLoading } = useSessions();
  const { reports: reportsData, loading: reportsLoading } = useReports();
  const { homeworks: homeworksData, loading: homeworksLoading } = useHomeworks({ studentId: student.id });

  const [activeTab, setActiveTab] = useState<'grades' | 'homework'>('grades');

  // Build reports map by session
  const sessionReportsMap: Record<string, any[]> = {};
  reportsData.forEach(r => {
    if (!sessionReportsMap[r.session_id]) {
      sessionReportsMap[r.session_id] = [];
    }
    sessionReportsMap[r.session_id].push({
      studentId: r.student_id,
      studentName: r.student_name || 'Unknown',
      writtenScore: r.written_score,
      oralScore: r.oral_score,
      cefrLevel: r.cefr_level as CEFRLevel,
      teacherNotes: r.notes,
    });
  });

  // Map sessions
  const sessions = sessionsData.map(s => ({
    id: s.id,
    dateTime: s.date_time,
    topic: s.topic,
    skillCategory: s.skill_category as SkillCategory,
    difficultyLevel: s.difficulty_level as DifficultyLevel,
  }));

  // Map homeworks
  const homeworks: Homework[] = homeworksData.map(h => ({
    id: h.id,
    sessionId: h.session_id,
    studentId: h.student_id,
    title: h.title,
    description: h.description || undefined,
    dueDate: h.due_date,
    assignedDate: h.assigned_date,
    status: h.status as 'PENDING' | 'SUBMITTED' | 'GRADED',
    submissionUrl: h.submission_url || undefined,
    score: h.score || undefined,
    feedback: h.feedback || undefined,
  }));

  if (sessionsLoading || reportsLoading || homeworksLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading progress...</span>
      </div>
    );
  }

  // 1. Get all session grades for this student (from teacher input)
  const sessionGrades = sessions.map(s => {
    const report = sessionReportsMap[s.id]?.find((r: any) => r.studentId === student.id);
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

  // 2. CEFR progression chart data
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

  // 3. Homework for this student
  const studentHomeworks = homeworks.filter(h => h.studentId === student.id);
  const pendingHomeworks = studentHomeworks.filter(h => h.status === 'PENDING');
  const completedHomeworks = studentHomeworks.filter(h => h.status !== 'PENDING');

  // 4. Latest CEFR level
  const latestCefr = sessionGrades.filter(g => g?.cefrLevel).pop()?.cefrLevel;

  // 5. Average scores
  const writtenScores = sessionGrades.filter(g => g?.writtenScore !== undefined).map(g => g!.writtenScore!);
  const oralScores = sessionGrades.filter(g => g?.oralScore !== undefined).map(g => g!.oralScore!);
  const avgWritten = writtenScores.length > 0 ? Math.round(writtenScores.reduce((a, b) => a + b, 0) / writtenScores.length) : null;
  const avgOral = oralScores.length > 0 ? Math.round(oralScores.reduce((a, b) => a + b, 0) / oralScores.length) : null;

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Progress</h2>
          <p className="text-xs text-gray-500">Track your grades, CEFR level, and homework.</p>
        </div>
        <div className="flex gap-3">
          <div className="text-right px-3 border-r border-gray-200">
            <p className="text-[9px] text-gray-400 font-bold uppercase">Avg Written</p>
            <p className="text-base font-bold text-blue-600">{avgWritten ?? '—'}</p>
          </div>
          <div className="text-right px-3 border-r border-gray-200">
            <p className="text-[9px] text-gray-400 font-bold uppercase">Avg Oral</p>
            <p className="text-base font-bold text-purple-600">{avgOral ?? '—'}</p>
          </div>
          <div className="text-right px-2">
            <p className="text-[9px] text-gray-400 font-bold uppercase">CEFR Level</p>
            <p className="text-base font-bold text-teal-600">{latestCefr?.split(' - ')[0] || '—'}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
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
          {pendingHomeworks.length > 0 && (
            <span className="bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-full ml-1">{pendingHomeworks.length}</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'grades' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* CEFR Progression Chart */}
          <Card className="!p-3 lg:col-span-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-teal-600" /> CEFR Progression
            </h3>
            <div className="h-36">
              {cefrChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cefrChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tickFormatter={(v) => ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'][v]} tick={{ fontSize: 9 }} width={25} />
                    <Tooltip formatter={(value, name, props) => [props.payload.label, 'CEFR']} />
                    <Line type="monotone" dataKey="level" stroke="#0d9488" strokeWidth={2} dot={{ r: 4, fill: '#0d9488' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-[10px] italic">
                  No CEFR data yet.
                </div>
              )}
            </div>
          </Card>

          {/* Grades Table */}
          <Card className="!p-0 overflow-hidden lg:col-span-2">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <ClipboardCheck className="w-3 h-3 text-blue-600" /> Grades History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Topic</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-center">Written</th>
                    <th className="px-3 py-2 text-center">Oral</th>
                    <th className="px-3 py-2 text-center">CEFR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessionGrades.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400 text-[10px] italic">No grades recorded yet.</td></tr>
                  )}
                  {sessionGrades.map((grade, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-[10px] text-gray-700 font-medium">
                        {new Date(grade!.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[10px] font-bold text-gray-900">{grade!.topic}</div>
                        {grade!.teacherNotes && (
                          <div className="text-[9px] text-gray-500 italic line-clamp-1">"{grade!.teacherNotes}"</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[8px] font-bold text-gray-600 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                          {grade!.skillCategory}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {grade!.writtenScore !== undefined ? (
                          <span className={`text-[10px] font-bold ${grade!.writtenScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {grade!.writtenScore}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {grade!.oralScore !== undefined ? (
                          <span className={`text-[10px] font-bold ${grade!.oralScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {grade!.oralScore}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {grade!.cefrLevel ? (
                          <span className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[8px] font-bold border border-teal-100">
                            {grade!.cefrLevel.split(' - ')[0]}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'homework' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pending Homework */}
          <div className="lg:col-span-1 space-y-3">
            <Card className="!p-3">
              <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pending ({pendingHomeworks.length})
              </h3>
              {pendingHomeworks.length > 0 ? (
                <div className="space-y-2">
                  {pendingHomeworks.map(hw => (
                    <div key={hw.id} className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                      <p className="text-xs font-bold text-gray-900">{hw.title}</p>
                      <p className="text-[9px] text-gray-600 mt-0.5 line-clamp-2">{hw.description}</p>
                      <div className="text-[8px] text-orange-600 font-bold flex items-center gap-1 mt-1">
                        <Calendar className="w-2.5 h-2.5" /> Due: {new Date(hw.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="w-6 h-6 text-green-300 mx-auto mb-1" />
                  <p className="text-[9px] text-gray-400">All done!</p>
                </div>
              )}
            </Card>
          </div>

          {/* Completed Homework */}
          <Card className="!p-0 overflow-hidden lg:col-span-2">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" /> Completed Homework
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Due Date</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {completedHomeworks.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-[10px] italic">No completed homework yet.</td></tr>
                  )}
                  {completedHomeworks.map(hw => (
                    <tr key={hw.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="text-[10px] font-bold text-gray-900">{hw.title}</div>
                        {hw.feedback && (
                          <div className="text-[9px] text-blue-600 italic">Feedback: {hw.feedback}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-gray-500">
                        {new Date(hw.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                          hw.status === 'GRADED' ? 'bg-green-100 text-green-700' :
                          hw.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {hw.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {hw.score !== undefined ? (
                          <span className={`text-[10px] font-bold ${hw.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {hw.score}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

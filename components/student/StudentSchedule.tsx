
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { useSessions } from '../../hooks/useSessions';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../contexts/AuthContext';
import { ClassSession, SkillCategory, DifficultyLevel, CEFRLevel } from '../../types';
import { Calendar, MapPin, Clock, User, FileText, Download, ChevronRight, Loader2 } from 'lucide-react';

export const StudentSchedule: React.FC = () => {
  const { user } = useAuth();
  const { sessions: sessionsData, loading: sessionsLoading, error: sessionsError } = useSessions();
  const { reports: reportsData } = useReports();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  const now = new Date();

  // Map sessions from database
  const sessions: ClassSession[] = sessionsData.map(s => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategory: s.skill_category as SkillCategory,
    difficultyLevel: s.difficulty_level as DifficultyLevel,
    materials: s.materials || [],
  }));

  // Build reports by session
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

  // Filter Logic
  const upcomingSessions = sessions
    .filter(s => new Date(s.dateTime) > now)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const pastSessions = sessions
    .filter(s => new Date(s.dateTime) <= now)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // Helper to get my specific report for a session
  const getMyReport = (sessionId: string) => {
    const reports = sessionReportsMap[sessionId] || [];
    return reports.find(r => r.studentId === user?.id);
  };

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading schedule...</span>
      </div>
    );
  }

  if (sessionsError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading schedule: {sessionsError.message}
      </div>
    );
  }

  // --- DETAIL VIEW COMPONENT ---
  if (selectedSession) {
    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedSession(null)} className="text-xs py-1.5 px-3">
            Back
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Class Details</h2>
            <p className="text-xs text-gray-500">{selectedSession.topic}</p>
          </div>
        </div>

        <div className="space-y-4">
              <Card className="!p-4">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Session Info</h3>
                 <div className="space-y-3">
                    <div className="flex flex-wrap gap-4 text-xs">
                       <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-teal-500" />
                          <span className="font-medium">Date:</span> {new Date(selectedSession.dateTime).toLocaleDateString()}
                       </div>
                       <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-teal-500" />
                          <span className="font-medium">Time:</span> {new Date(selectedSession.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                       </div>
                       <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-teal-500" />
                          <span className="font-medium">Location:</span> {selectedSession.location}
                       </div>
                       <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-3.5 h-3.5 text-teal-500" />
                          <span className="font-medium">Teacher:</span> Mr. John Keating
                       </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</h4>
                       <p className="text-gray-600 text-xs leading-relaxed">
                         {selectedSession.description || "No description available."}
                       </p>
                    </div>

                    {selectedSession.materials && selectedSession.materials.length > 0 && (
                       <div>
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                             <FileText className="w-3 h-3 text-blue-500" /> Materials
                          </h4>
                          <div className="flex flex-wrap gap-2">
                             {selectedSession.materials.map((mat, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2 py-1.5 rounded text-[10px] border border-blue-100 cursor-pointer hover:bg-blue-100">
                                   <Download className="w-3 h-3" /> {mat}
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              </Card>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Schedule</h2>
          <p className="text-xs text-gray-500">Manage classes and review past sessions.</p>
        </div>

        <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
           <button
             onClick={() => setActiveTab('upcoming')}
             className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${activeTab === 'upcoming' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Upcoming
           </button>
           <button
             onClick={() => setActiveTab('history')}
             className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${activeTab === 'history' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             History
           </button>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Topic</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(activeTab === 'upcoming' ? upcomingSessions : pastSessions).map(session => {
              const isHistory = activeTab === 'history';
              const report = isHistory ? getMyReport(session.id) : null;

              return (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <div className="text-xs font-bold text-gray-900">
                      {new Date(session.dateTime).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {new Date(session.dateTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs font-bold text-gray-900">{session.topic}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1 text-[10px] text-gray-600">
                      <MapPin className="w-3 h-3 text-orange-500" /> {session.location}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {!isHistory ? (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        Upcoming
                      </span>
                    ) : report ? (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        report.attendanceStatus === 'PRESENT' ? 'bg-green-50 text-green-700 border border-green-200' :
                        report.attendanceStatus === 'LATE' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {report.attendanceStatus}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100 flex items-center gap-1 ml-auto"
                    >
                      Detail <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {activeTab === 'upcoming' && upcomingSessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400 text-[10px] italic">
                  No upcoming classes scheduled.
                </td>
              </tr>
            )}

            {activeTab === 'history' && pastSessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400 text-[10px] italic">
                  No class history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

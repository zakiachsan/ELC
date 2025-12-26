
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MOCK_SESSIONS, MOCK_SESSION_REPORTS } from '../../constants';
import { ClassSession } from '../../types';
import { AttendanceCheckIn } from './AttendanceCheckIn';
import { Calendar, MapPin, Clock, User, FileText, Download, CheckCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';

export const StudentSchedule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  
  const now = new Date();

  // Filter Logic
  const upcomingSessions = MOCK_SESSIONS
    .filter(s => new Date(s.dateTime) > now)
    .sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const pastSessions = MOCK_SESSIONS
    .filter(s => new Date(s.dateTime) <= now)
    .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // Helper to get my specific report for a session
  const getMyReport = (sessionId: string) => {
    const reports = MOCK_SESSION_REPORTS[sessionId] || [];
    return reports.find(r => r.studentId === 'u3'); // Hardcoded for Sarah Connor
  };

  // --- DETAIL VIEW COMPONENT ---
  if (selectedSession) {
    const isUpcoming = new Date(selectedSession.dateTime) > now;
    const isToday = new Date(selectedSession.dateTime).toDateString() === now.toDateString();

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedSession(null)}>
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Class Details</h2>
            <p className="text-gray-500 text-sm">{selectedSession.topic}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <Card title="Session Information">
                 <div className="space-y-4">
                    <div className="flex flex-wrap gap-6 text-sm">
                       <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-teal-500" />
                          <span className="font-semibold">Date:</span> {new Date(selectedSession.dateTime).toLocaleDateString()}
                       </div>
                       <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-teal-500" />
                          <span className="font-semibold">Time:</span> {new Date(selectedSession.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                       </div>
                       <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-teal-500" />
                          <span className="font-semibold">Location:</span> {selectedSession.location}
                       </div>
                       <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-teal-500" />
                          <span className="font-semibold">Teacher:</span> Mr. John Keating
                       </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                       <h4 className="text-sm font-bold text-gray-900 mb-2">Teaching Notes / Description</h4>
                       <p className="text-gray-600 text-sm leading-relaxed">
                         {selectedSession.description || "No description available for this class."}
                       </p>
                    </div>

                    {selectedSession.materials && selectedSession.materials.length > 0 && (
                       <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                             <FileText className="w-4 h-4 text-blue-500" /> Class Materials
                          </h4>
                          <div className="flex flex-wrap gap-2">
                             {selectedSession.materials.map((mat, i) => (
                                <div key={i} className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-2 rounded text-sm border border-blue-100 cursor-pointer hover:bg-blue-100">
                                   <Download className="w-3 h-3" /> {mat}
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              </Card>
           </div>

           <div className="lg:col-span-1 space-y-6">
              {/* ATTENDANCE CHECK-IN SECTION */}
              {isUpcoming ? (
                 <Card title="Attendance Action">
                    <div className="space-y-4">
                       {isToday ? (
                          <div className="space-y-3">
                             <div className="bg-green-50 text-green-800 p-3 rounded text-sm flex gap-2">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>This class is scheduled for today. Please verify your location to check in.</p>
                             </div>
                             <AttendanceCheckIn />
                          </div>
                       ) : (
                          <div className="text-center py-6 text-gray-500 space-y-2">
                             <Clock className="w-10 h-10 mx-auto text-gray-300" />
                             <p className="text-sm">Check-in opens on the day of class.</p>
                          </div>
                       )}
                    </div>
                 </Card>
              ) : (
                 <Card title="Attendance Status">
                    <div className="text-center py-6">
                       {/* Mock retrieving report */}
                       {(() => {
                          const report = getMyReport(selectedSession.id);
                          if (!report) return <p className="text-gray-500 text-sm">Attendance Pending Review</p>;
                          return (
                             <div className="flex flex-col items-center gap-2">
                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                   report.attendanceStatus === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                   report.attendanceStatus === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                                   'bg-red-100 text-red-800'
                                }`}>
                                   {report.attendanceStatus}
                                </div>
                                <p className="text-xs text-gray-400">Recorded by Teacher</p>
                             </div>
                          );
                       })()}
                    </div>
                 </Card>
              )}
           </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Schedule</h2>
          <p className="text-gray-500">Manage your classes and review past sessions.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
           <button 
             onClick={() => setActiveTab('upcoming')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'upcoming' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Upcoming Classes
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Class History
           </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* SHARED LIST COMPONENT (Functional UI Consistency) */}
        {(activeTab === 'upcoming' ? upcomingSessions : pastSessions).map(session => {
          const isHistory = activeTab === 'history';
          const report = isHistory ? getMyReport(session.id) : null;
          
          return (
            <Card 
              key={session.id} 
              className={`hover:border-teal-300 transition-colors group cursor-pointer ${isHistory ? 'opacity-90 hover:opacity-100' : ''}`}
            >
               <div onClick={() => setSelectedSession(session)} className="flex flex-col md:flex-row gap-6">
                  {/* Date Box */}
                  <div className={`rounded-lg p-4 flex flex-col items-center justify-center min-w-[100px] border border-gray-100 transition-colors h-fit ${isHistory ? 'bg-gray-50 border-gray-100' : 'bg-gray-50 group-hover:bg-teal-50 group-hover:border-teal-100'}`}>
                     <span className={`text-xs font-bold uppercase tracking-wider ${isHistory ? 'text-gray-400' : 'text-gray-500 group-hover:text-teal-600'}`}>
                        {new Date(session.dateTime).toLocaleString('default', { month: 'short' })}
                     </span>
                     <span className={`text-3xl font-bold ${isHistory ? 'text-gray-600' : 'text-gray-900'}`}>
                        {new Date(session.dateTime).getDate()}
                     </span>
                     <span className={`text-xs ${isHistory ? 'text-gray-400' : 'text-gray-500 group-hover:text-teal-600'}`}>
                        {new Date(session.dateTime).toLocaleString('default', { weekday: 'short' })}
                     </span>
                  </div>

                  <div className="flex-1 space-y-3">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <h3 className={`text-lg font-bold transition-colors ${isHistory ? 'text-gray-800' : 'text-gray-900 group-hover:text-teal-600'}`}>{session.topic}</h3>
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          {new Date(session.dateTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                        </span>
                     </div>
                     
                     <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {session.location}</span>
                     </div>

                     <div className="pt-2 flex items-center justify-between">
                        {!isHistory ? (
                          <span className="text-sm text-teal-600 font-medium hover:underline flex items-center gap-1">
                            Lihat detail & presensi <ChevronRight className="w-4 h-4" />
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                             {report ? (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${
                                  report.attendanceStatus === 'PRESENT' ? 'bg-green-50 text-green-700 border-green-200' :
                                  report.attendanceStatus === 'LATE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {report.attendanceStatus}
                                </span>
                             ) : (
                                <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-500 uppercase border border-gray-200">Pending Review</span>
                             )}
                             
                             {report && report.examScore !== undefined && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded">
                                   Score: <span className={report.examScore >= 70 ? 'text-green-600' : 'text-red-600'}>{report.examScore}</span>
                                </div>
                             )}
                          </div>
                        )}
                        {isHistory && (
                          <span className="text-xs text-gray-400 font-medium group-hover:text-teal-600 transition-colors">Lihat detail</span>
                        )}
                     </div>
                  </div>
               </div>
            </Card>
          );
        })}
        
        {activeTab === 'upcoming' && upcomingSessions.length === 0 && (
          <div className="text-center py-10 bg-white rounded-lg border border-dashed text-gray-400">
              No upcoming classes scheduled.
          </div>
        )}
        
        {activeTab === 'history' && pastSessions.length === 0 && (
          <div className="text-center py-10 bg-white rounded-lg border border-dashed text-gray-400">
              No class history found.
          </div>
        )}
      </div>
    </div>
  );
};

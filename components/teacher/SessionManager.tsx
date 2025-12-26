
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MOCK_SESSIONS, LEVEL_COLORS, MOCK_USERS, MOCK_SESSION_REPORTS } from '../../constants';
import { ClassSession, UserRole, StudentSessionReport } from '../../types';
import { Clock, MapPin, Calendar, CheckCircle, FileText, Upload, Trash2, Download, ShieldCheck, ShieldAlert, UserCheck } from 'lucide-react';
import { SKILL_ICONS } from '../student/StudentView';

export const SessionManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [reports, setReports] = useState<Record<string, StudentSessionReport[]>>(MOCK_SESSION_REPORTS);
  
  const now = new Date();
  const upcomingSessions = MOCK_SESSIONS.filter(s => new Date(s.dateTime) > now);
  const pastSessions = MOCK_SESSIONS.filter(s => new Date(s.dateTime) <= now);

  const toggleVerify = (sessionId: string, studentId: string) => {
    const sessionReports = reports[sessionId] || [];
    const updated = sessionReports.map(r => 
        r.studentId === studentId ? { ...r, isVerified: !r.isVerified } : r
    );
    setReports({ ...reports, [sessionId]: updated });
  };

  // --- DETAIL VIEW ---
  if (selectedSession) {
    const Icon = SKILL_ICONS[selectedSession.skillCategory];
    const enrolledStudents = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
    const sessionReports = reports[selectedSession.id] || [];

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-4">
           <Button variant="outline" onClick={() => setSelectedSession(null)}>
              Back
           </Button>
           <div>
              <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
              <p className="text-gray-500 text-sm">Session Details & Attendance</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left Col: Session Details */}
           <div className="lg:col-span-2 space-y-6">
              <Card title="Session Overview">
                 <div className="space-y-6">
                    <div>
                       <div className="flex items-center gap-2 mb-2">
                          <span className="flex items-center gap-1 bg-gray-800 text-white px-2 py-1 rounded text-xs uppercase font-bold">
                             <Icon className="w-3 h-3" /> {selectedSession.skillCategory}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${LEVEL_COLORS[selectedSession.difficultyLevel]}`}>
                             {selectedSession.difficultyLevel}
                          </span>
                       </div>
                       <h3 className="text-2xl font-bold text-gray-900">{selectedSession.topic}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-gray-100 py-4">
                       <div>
                          <label className="text-xs text-gray-500 font-bold uppercase">Date</label>
                          <div className="flex items-center gap-2 text-gray-900 font-medium">
                             <Calendar className="w-4 h-4 text-teal-500" />
                             {new Date(selectedSession.dateTime).toLocaleDateString()}
                          </div>
                       </div>
                       <div>
                          <label className="text-xs text-gray-500 font-bold uppercase">Time</label>
                          <div className="flex items-center gap-2 text-gray-900 font-medium">
                             <Clock className="w-4 h-4 text-teal-500" />
                             {new Date(selectedSession.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </div>
                       </div>
                       <div>
                          <label className="text-xs text-gray-500 font-bold uppercase">Location</label>
                          <div className="flex items-center gap-2 text-gray-900 font-medium">
                             <MapPin className="w-4 h-4 text-teal-500" />
                             {selectedSession.location}
                          </div>
                       </div>
                    </div>

                    <div>
                       <h4 className="font-bold text-gray-900 mb-2">Description / Teacher Notes</h4>
                       <textarea
                          className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-gray-700 text-sm leading-relaxed"
                          rows={4}
                          placeholder="Add notes, instructions, or descriptions for this class..."
                          value={selectedSession.description || ''}
                          onChange={(e) => setSelectedSession({ ...selectedSession, description: e.target.value })}
                       />
                    </div>
                 </div>
              </Card>

              {/* Attendance List with Verification Toggle */}
              <Card title={`Enrolled Students (${enrolledStudents.length})`}>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                             <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student Name</th>
                             <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">GPS Status</th>
                             <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Teacher Verification</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {enrolledStudents.map((student) => {
                             const report = sessionReports.find(r => r.studentId === student.id);
                             const hasCheckedIn = report?.attendanceStatus === 'PRESENT';

                             return (
                                <tr key={student.id} className={hasCheckedIn && !report?.isVerified ? 'bg-yellow-50/30' : ''}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                                    <td className="px-4 py-3">
                                        {hasCheckedIn ? (
                                            <span className="flex items-center gap-1 text-green-600 text-[10px] font-black uppercase bg-green-50 px-2 py-1 rounded w-fit border border-green-100">
                                                <MapPin className="w-3 h-3" /> GPS OK
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 text-[10px] font-bold uppercase italic">Not Checked-in</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {hasCheckedIn ? (
                                            <button 
                                                onClick={() => toggleVerify(selectedSession.id, student.id)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                                                    report?.isVerified 
                                                    ? 'bg-blue-600 text-white border-blue-600' 
                                                    : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'
                                                }`}
                                            >
                                                {report?.isVerified ? (
                                                    <><ShieldCheck className="w-3.5 h-3.5" /> Verified</>
                                                ) : (
                                                    <><ShieldAlert className="w-3.5 h-3.5 animate-pulse" /> Verify Now</>
                                                )}
                                            </button>
                                        ) : (
                                            <Button variant="outline" className="text-[10px] py-1 h-auto" onClick={() => alert("Student must check-in first via GPS.")}>Manual Proxy</Button>
                                        )}
                                    </td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
              </Card>
           </div>
           
           <div className="lg:col-span-1 space-y-4">
              <Card title="Class Materials">
                 <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                       <p>Materials uploaded here will be visible to students in their schedule details.</p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                       <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                       <p className="text-xs font-medium text-gray-600">Click to upload PDFs or Docs</p>
                    </div>

                    <div className="space-y-2">
                       <p className="text-xs font-bold text-gray-500 uppercase mb-2">Attached Files</p>
                       {selectedSession.materials && selectedSession.materials.length > 0 ? (
                          selectedSession.materials.map((file, idx) => (
                             <div key={idx} className="flex items-center justify-between p-2 bg-white border rounded text-sm">
                                <div className="flex items-center gap-2 truncate">
                                   <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                   <span className="truncate max-w-[120px]" title={file}>{file}</span>
                                </div>
                                <div className="flex gap-1">
                                   <button className="text-gray-400 hover:text-blue-500"><Download className="w-3 h-3" /></button>
                                   <button className="text-gray-400 hover:text-red-500" onClick={() => { if(window.confirm(`Remove ${file}?`)) { const updated = selectedSession.materials?.filter(m => m !== file); setSelectedSession({...selectedSession, materials: updated}); } }}><Trash2 className="w-3 h-3" /></button>
                                </div>
                             </div>
                          ))
                       ) : (
                          <p className="text-xs text-gray-400 italic">No materials attached yet.</p>
                       )}
                    </div>
                 </div>
              </Card>
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
            <h3 className="text-xl font-bold text-gray-900">Teaching Schedule</h3>
            <p className="text-gray-500 text-sm">View your upcoming classes and manage materials.</p>
          </div>
      </div>
      
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('upcoming')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upcoming' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Upcoming</button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>History</button>
      </div>
      
      <div className="space-y-4">
        {(activeTab === 'upcoming' ? upcomingSessions : pastSessions).map(session => {
            const sessionReports = reports[session.id] || [];
            const pendingVerify = sessionReports.filter(r => r.attendanceStatus === 'PRESENT' && !r.isVerified).length;

            return (
                <div key={session.id} onClick={() => setSelectedSession(session)} className={`relative bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start cursor-pointer hover:shadow-md transition-shadow border-l-4 ${activeTab === 'upcoming' ? 'border-l-teal-500 shadow-sm' : 'border-l-gray-300'}`}>
                    <div className="flex flex-row md:flex-col items-center justify-center bg-gray-50 rounded-lg p-3 min-w-[80px] h-full text-center border border-gray-100 gap-2 md:gap-0">
                        <span className="text-xs font-bold text-gray-400 uppercase">{new Date(session.dateTime).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-2xl font-bold text-gray-800">{new Date(session.dateTime).getDate()}</span>
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 bg-gray-800 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                                {session.skillCategory}
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${LEVEL_COLORS[session.difficultyLevel]}`}>
                                {session.difficultyLevel}
                            </div>
                            {pendingVerify > 0 && (
                                <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-orange-200">
                                    <UserCheck className="w-3 h-3" /> {pendingVerify} Unverified
                                </div>
                            )}
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">{session.topic}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(session.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {session.location}</span>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

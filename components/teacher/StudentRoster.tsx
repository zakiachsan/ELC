
import React, { useState } from 'react';
import { Card } from '../Card';
import { MOCK_USERS, LEVEL_COLORS, MOCK_SESSIONS, MOCK_SESSION_REPORTS, MOCK_MODULE_PROGRESS } from '../../constants';
import { UserRole, User, SkillCategory } from '../../types';
import { ChevronRight, Search, MapPin, Clock, CheckCircle, FileText, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '../Button';
import { SKILL_ICONS } from '../student/StudentView';

export const StudentRoster: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('All Locations');

  const students = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
  const locations = ['All Locations', ...Array.from(new Set(students.map(s => s.branch).filter(Boolean)))];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === 'All Locations' || student.branch === locationFilter;
    return matchesSearch && matchesLocation;
  });

  if (selectedStudent) {
    return <StudentDetail student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Roster</h2>
          <p className="text-gray-500">View student profiles and their activity history.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search student name..." 
               className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:ring-teal-500 focus:border-teal-500"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
           
           <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-48 appearance-none bg-white focus:ring-teal-500 focus:border-teal-500 cursor-pointer"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                {locations.map(loc => (
                  <option key={loc as string} value={loc as string}>{loc}</option>
                ))}
              </select>
           </div>
        </div>
      </div>
      
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
             <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4"></th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
             {filteredStudents.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No students found.</td>
                </tr>
             )}
             {filteredStudents.map(student => {
                // Mocking "Last Activity" for the list view since it's not strictly in the user object
                const activities = [
                   "Completed Grammar Quiz",
                   "Attended Speaking Class",
                   "Logged In",
                   "Submitted Essay"
                ];
                const randomActivity = activities[Math.floor(Math.random() * activities.length)];
                
                return (
                   <tr key={student.id} onClick={() => setSelectedStudent(student)} className="hover:bg-gray-50 cursor-pointer group transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                               {student.name.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-900 group-hover:text-blue-600">{student.name}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                         {student.branch || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                         <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-teal-500" />
                            {randomActivity} <span className="text-gray-400">- 2h ago</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                      </td>
                   </tr>
                )
             })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const StudentDetail: React.FC<{ student: User; onBack: () => void }> = ({ student, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'grades'>('overview');
  
  // Grade Form State
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [gradeScore, setGradeScore] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DATA MOCKING ---
  
  // Mock Class History (Linked to Attendance)
  const classHistory = MOCK_SESSIONS
    .filter(s => new Date(s.dateTime) <= new Date()) // Only past classes
    .map(session => {
       const report = MOCK_SESSION_REPORTS[session.id]?.find(r => r.studentId === student.id);
       return {
          id: session.id,
          date: session.dateTime,
          topic: session.topic,
          skill: session.skillCategory,
          status: report?.attendanceStatus || 'PENDING',
          location: session.location
       };
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Mock Exam Results
  const examResults = MOCK_SESSIONS
    .map(session => {
       const report = MOCK_SESSION_REPORTS[session.id]?.find(r => r.studentId === student.id);
       if (!report || report.examScore === undefined) return null;
       return {
          id: session.id,
          date: session.dateTime,
          topic: session.topic,
          score: report.examScore,
          placement: report.placementResult,
          feedback: "Great work on the essay section. Focus on prepositions next time." // Mock feedback
       };
    }).filter(Boolean);

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API Call
    setTimeout(() => {
       setIsSubmitting(false);
       alert("Grade and materials saved successfully!");
       // Reset
       setSelectedSessionId('');
       setGradeScore('');
       setTeacherNotes('');
       setUploadedFile(null);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
               <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {student.branch}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
         <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
            Overview
         </button>
         <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
            Attendance History
         </button>
         <button
            onClick={() => setActiveTab('grades')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'grades' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
            Exams & Assignments
         </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
         <div className="space-y-6">
            <Card title="Skill Levels Profile">
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.values(SkillCategory).map(skill => {
                     const level = student.skillLevels?.[skill];
                     const Icon = SKILL_ICONS[skill];
                     return (
                        <div key={skill} className="flex flex-col items-center p-3 border rounded-xl bg-gray-50 text-center">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${level ? 'bg-white text-gray-800 shadow-sm' : 'bg-gray-200 text-gray-400'}`}>
                              <Icon className="w-4 h-4" />
                           </div>
                           <div className="text-[10px] font-bold text-gray-500 uppercase">{skill}</div>
                           {level ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 ${LEVEL_COLORS[level]}`}>
                                 {level}
                              </span>
                           ) : (
                              <span className="text-[10px] text-gray-400 italic mt-1">No Data</span>
                           )}
                        </div>
                     );
                  })}
               </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card title="Quick Stats">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Classes Attended</span>
                        <span className="font-bold text-gray-900">{classHistory.filter(c => c.status === 'PRESENT').length}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Online Modules Completed</span>
                        <span className="font-bold text-gray-900">{MOCK_MODULE_PROGRESS.filter(p => p.studentId === student.id && p.status === 'COMPLETED').length}</span>
                     </div>
                  </div>
               </Card>
               <Card title="Teacher Notes">
                  <p className="text-sm text-gray-600 italic">
                     "{student.teacherNotes || 'No notes added yet.'}"
                  </p>
               </Card>
            </div>
         </div>
      )}

      {/* TAB CONTENT: ATTENDANCE */}
      {activeTab === 'attendance' && (
         <Card title="Class Attendance Log">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                     <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Class Topic</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Location</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {classHistory.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                           <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {new Date(session.date).toLocaleDateString()}
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-600">
                              {session.topic}
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                 session.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                                 session.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' :
                                 'bg-red-100 text-red-700'
                              }`}>
                                 {session.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-500">
                              {session.location}
                           </td>
                        </tr>
                     ))}
                     {classHistory.length === 0 && (
                        <tr><td colSpan={4} className="text-center py-6 text-gray-400">No attendance history available.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </Card>
      )}

      {/* TAB CONTENT: GRADES & TASKS */}
      {activeTab === 'grades' && (
         <div className="space-y-6">
            {/* Input Form */}
            <Card title="Add Exam Result / Assignment Grade">
               <form onSubmit={handleSaveGrade} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Select Teaching Schedule (Topic)</label>
                        <select 
                           required
                           className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500"
                           value={selectedSessionId}
                           onChange={(e) => setSelectedSessionId(e.target.value)}
                        >
                           <option value="">-- Select Class Session --</option>
                           {MOCK_SESSIONS.map(s => (
                              <option key={s.id} value={s.id}>{s.topic} ({new Date(s.dateTime).toLocaleDateString()})</option>
                           ))}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Score (0-100)</label>
                        <input 
                           type="number" 
                           min="0" max="100" required
                           className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-teal-500"
                           placeholder="e.g. 85"
                           value={gradeScore}
                           onChange={(e) => setGradeScore(e.target.value)}
                        />
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-700">Description / Teacher Notes</label>
                     <textarea 
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-teal-500"
                        rows={3}
                        placeholder="Detailed feedback about the student's performance..."
                        value={teacherNotes}
                        onChange={(e) => setTeacherNotes(e.target.value)}
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-700">Upload Graded Paper / File (Optional)</label>
                     <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center text-center">
                        <input 
                           type="file" 
                           id="file-upload"
                           className="hidden"
                           onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                           <Upload className="w-6 h-6 text-gray-400" />
                           <span className="text-sm text-blue-600 font-medium hover:underline">Click to upload file</span>
                        </label>
                        {uploadedFile && (
                           <div className="mt-2 text-xs bg-white border px-2 py-1 rounded flex items-center gap-1 text-gray-700">
                              <FileText className="w-3 h-3" /> {uploadedFile.name}
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="flex justify-end pt-2">
                     <Button type="submit" isLoading={isSubmitting}>
                        Save Grade
                     </Button>
                  </div>
               </form>
            </Card>

            {/* History List */}
            <Card title="Academic History Log">
               <div className="space-y-4">
                  {examResults.map((result, idx) => (
                     <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-white hover:border-teal-300 transition-colors">
                        <div className="flex-1 space-y-1">
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 uppercase">{new Date(result!.date).toLocaleDateString()}</span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Class Exam</span>
                           </div>
                           <h4 className="font-bold text-gray-900 text-lg">{result!.topic}</h4>
                           <p className="text-sm text-gray-600 italic">"{result!.feedback}"</p>
                           {idx === 0 && (
                             <div className="flex items-center gap-1 text-xs text-blue-600 mt-2">
                                <FileText className="w-3 h-3" /> graded_essay_scan.pdf
                             </div>
                           )}
                        </div>
                        <div className="flex items-center gap-4 border-l pl-4 border-gray-100">
                           <div className="text-center">
                              <div className="text-xs font-bold text-gray-400 uppercase">Score</div>
                              <div className={`text-2xl font-bold ${result!.score >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                                 {result!.score}
                              </div>
                           </div>
                           <div className="text-center">
                              <div className="text-xs font-bold text-gray-400 uppercase">Placement</div>
                              <span className={`text-xs font-bold px-2 py-1 rounded ${result!.placement ? LEVEL_COLORS[result!.placement] : ''}`}>
                                 {result!.placement || '-'}
                              </span>
                           </div>
                        </div>
                     </div>
                  ))}
                  {examResults.length === 0 && <p className="text-center text-gray-400 italic py-4">No exam results recorded.</p>}
               </div>
            </Card>
         </div>
      )}
    </div>
  );
};

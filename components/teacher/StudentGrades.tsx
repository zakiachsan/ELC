
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MOCK_USERS, MOCK_SCHOOLS, MOCK_SESSIONS, MOCK_SESSION_REPORTS } from '../../constants';
import { UserRole, User } from '../../types';
import { School, ChevronRight, GraduationCap, Calendar, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';

export const StudentGrades: React.FC = () => {
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [semesterGrades, setSemesterGrades] = useState<Record<string, { mid: string; final: string }>>({});

  // Get schools
  const schools = MOCK_SCHOOLS;

  // Get all students
  const students = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);

  const saveSemesterGrade = (studentId: string) => {
    const grade = semesterGrades[studentId];
    if (grade) {
      console.log('Saving semester grade for', studentId, grade, 'at school:', selectedSchool);
      alert('Nilai semester berhasil disimpan!');
    }
  };

  const saveAllGrades = () => {
    const gradesWithValues = Object.entries(semesterGrades).filter(
      ([_, grade]) => grade.mid || grade.final
    );
    if (gradesWithValues.length > 0) {
      console.log('Saving all grades:', gradesWithValues, 'at school:', selectedSchool);
      alert(`${gradesWithValues.length} nilai semester berhasil disimpan!`);
    } else {
      alert('Tidak ada nilai untuk disimpan.');
    }
  };

  const getLetterGrade = (score: number) => {
    if (score >= 90) return { letter: 'A', color: 'text-green-600 bg-green-50 border-green-200' };
    if (score >= 80) return { letter: 'B', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (score >= 70) return { letter: 'C', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    if (score >= 60) return { letter: 'D', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { letter: 'E', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  // --- STUDENT DETAIL VIEW ---
  if (selectedStudent && selectedSchool) {
    // Get all sessions at this school
    const schoolSessions = MOCK_SESSIONS.filter(s =>
      s.location.includes(selectedSchool.split(' - ')[0]) ||
      (selectedSchool === 'Online (Zoom)' && s.location.includes('Online'))
    );

    // Get student's reports for each session
    const studentClassHistory = schoolSessions.map(session => {
      const reports = MOCK_SESSION_REPORTS[session.id] || [];
      const studentReport = reports.find(r => r.studentId === selectedStudent.id);
      return {
        session,
        report: studentReport
      };
    }).sort((a, b) => new Date(b.session.dateTime).getTime() - new Date(a.session.dateTime).getTime());

    const grade = semesterGrades[selectedStudent.id] || { mid: '', final: '' };
    const avg = grade.mid && grade.final
      ? Math.round((parseInt(grade.mid) + parseInt(grade.final)) / 2)
      : null;

    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedStudent(null)} className="text-xs py-1.5 px-3">
            Back
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detail Siswa</h2>
            <p className="text-xs text-gray-500">{selectedSchool}</p>
          </div>
        </div>

        {/* Student Info Card */}
        <Card className="!p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold text-xl">
              {selectedStudent.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">{selectedStudent.name}</h3>
              <p className="text-xs text-gray-500">{selectedStudent.email}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-gray-400 uppercase">Semester Grade</p>
              {avg !== null ? (
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className="text-lg font-bold text-gray-900">{avg}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLetterGrade(avg).color}`}>
                    {getLetterGrade(avg).letter}
                  </span>
                </div>
              ) : (
                <span className="text-gray-300 text-sm">—</span>
              )}
            </div>
          </div>
        </Card>

        {/* Semester Grades Input */}
        <Card className="!p-4">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Nilai Semester</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Mid Semester</label>
              <input
                type="number"
                min="0"
                max="100"
                value={grade.mid}
                onChange={e => setSemesterGrades({
                  ...semesterGrades,
                  [selectedStudent.id]: { ...grade, mid: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase">Final Semester</label>
              <input
                type="number"
                min="0"
                max="100"
                value={grade.final}
                onChange={e => setSemesterGrades({
                  ...semesterGrades,
                  [selectedStudent.id]: { ...grade, final: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                placeholder="0-100"
              />
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={() => saveSemesterGrade(selectedStudent.id)} className="text-xs py-1.5 px-3">
              Simpan Nilai
            </Button>
          </div>
        </Card>

        {/* Class History */}
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs font-bold text-gray-700">Riwayat Kelas ({studentClassHistory.length})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {studentClassHistory.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-xs italic">
                Belum ada kelas yang diikuti di lokasi ini.
              </div>
            ) : (
              studentClassHistory.map(({ session, report }) => (
                <div key={session.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900">{session.topic}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.dateTime).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.location}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {report ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 justify-end">
                            {report.attendanceStatus === 'PRESENT' ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                <CheckCircle className="w-3 h-3" /> Hadir
                              </span>
                            ) : report.attendanceStatus === 'LATE' ? (
                              <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                                Terlambat
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                <XCircle className="w-3 h-3" /> Absen
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 justify-end text-[10px]">
                            {report.writtenScore !== undefined && (
                              <span className="text-gray-600">Written: <strong className={report.writtenScore >= 70 ? 'text-green-600' : 'text-red-600'}>{report.writtenScore}</strong></span>
                            )}
                            {report.oralScore !== undefined && (
                              <span className="text-gray-600">Oral: <strong className={report.oralScore >= 70 ? 'text-green-600' : 'text-red-600'}>{report.oralScore}</strong></span>
                            )}
                          </div>
                          {report.cefrLevel && (
                            <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {report.cefrLevel.split(' - ')[0]}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">Belum ada nilai</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  }

  // --- SCHOOL SELECTION VIEW ---
  if (!selectedSchool) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nilai Siswa</h2>
          <p className="text-xs text-gray-500">Pilih sekolah untuk mengelola nilai mid & final semester siswa.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {schools.map((school) => (
            <Card
              key={school.id}
              className="!p-4 cursor-pointer hover:border-purple-400 transition-all group"
              onClick={() => setSelectedSchool(school.name)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <School className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600">{school.name}</h3>
                  <p className="text-[10px] text-gray-500">{school.address}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500" />
              </div>
            </Card>
          ))}
          {/* Online option */}
          <Card
            className="!p-4 cursor-pointer hover:border-teal-400 transition-all group"
            onClick={() => setSelectedSchool('Online (Zoom)')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-teal-600">Online (Zoom)</h3>
                <p className="text-[10px] text-gray-500">Kelas Virtual</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- GRADES LIST VIEW ---
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedSchool(null)} className="text-xs py-1.5 px-3">
            Ganti Sekolah
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nilai Semester</h2>
            <p className="text-xs text-gray-500">{selectedSchool}</p>
          </div>
        </div>
        <Button onClick={saveAllGrades} className="text-xs py-1.5 px-3">
          Simpan Semua
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-bold text-gray-700">
            Nilai Mid & Final Semester
          </h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2 text-center">Mid Semester</th>
              <th className="px-4 py-2 text-center">Final Semester</th>
              <th className="px-4 py-2 text-center">Average</th>
              <th className="px-4 py-2 text-center">Grade</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => {
              const grade = semesterGrades[student.id] || { mid: '', final: '' };
              const avg = grade.mid && grade.final
                ? Math.round((parseInt(grade.mid) + parseInt(grade.final)) / 2)
                : null;

              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="flex items-center gap-2 text-left hover:text-purple-600 transition-colors"
                    >
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-[10px]">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 hover:text-purple-600">{student.name}</span>
                        <p className="text-[9px] text-gray-400">{student.email}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-gray-300" />
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grade.mid}
                      onChange={e => setSemesterGrades({
                        ...semesterGrades,
                        [student.id]: { ...grade, mid: e.target.value }
                      })}
                      className="w-16 px-2 py-1 border rounded text-center text-xs"
                      placeholder="0-100"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grade.final}
                      onChange={e => setSemesterGrades({
                        ...semesterGrades,
                        [student.id]: { ...grade, final: e.target.value }
                      })}
                      className="w-16 px-2 py-1 border rounded text-center text-xs"
                      placeholder="0-100"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    {avg !== null ? (
                      <span className={`font-bold ${avg >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {avg}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {avg !== null ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLetterGrade(avg).color}`}>
                        {getLetterGrade(avg).letter}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => saveSemesterGrade(student.id)}
                      className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-[9px] font-bold uppercase hover:bg-purple-600 hover:text-white transition-all border border-purple-100"
                    >
                      Simpan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

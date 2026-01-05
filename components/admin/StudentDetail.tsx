import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../Card';
import { Button } from '../Button';
import { useStudents, useLocations } from '../../hooks/useProfiles';
import { useSessions } from '../../hooks/useSessions';
import { useReports } from '../../hooks/useReports';
import { useStudentGrades } from '../../hooks/useStudentGrades';
import { User, SkillCategory, DifficultyLevel } from '../../types';
import {
  ArrowLeft, Mail, Phone, School, MapPin, Calendar,
  BookOpen, Award, TrendingUp, CheckCircle, XCircle,
  Clock, Loader2, GraduationCap, Save
} from 'lucide-react';

// Generate academic year options
const generateAcademicYears = (): string[] => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = -2; i <= 1; i++) {
    const startYear = currentYear + i;
    years.push(`${startYear}/${startYear + 1}`);
  }
  return years;
};

const LEVEL_COLORS: Record<string, string> = {
  'Advanced': 'bg-purple-100 text-purple-700 border-purple-200',
  'Upper-Intermediate': 'bg-blue-100 text-blue-700 border-blue-200',
  'Intermediate': 'bg-green-100 text-green-700 border-green-200',
  'Elementary': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Starter': 'bg-orange-100 text-orange-700 border-orange-200',
};

export const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const { profiles: studentsData, loading: studentsLoading } = useStudents();
  const { locations: locationsData } = useLocations();
  const { sessions: sessionsData } = useSessions();
  const { reports: reportsData } = useReports();

  // Academic year and semester state
  const academicYears = generateAcademicYears();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultAcademicYear = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
  const defaultSemester = currentMonth >= 6 ? '1' : '2';

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(defaultAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(defaultSemester as '1' | '2');

  // Find the student
  const student = studentsData.find(s => s.id === studentId);
  const studentLocation = locationsData.find(l => l.id === student?.assigned_location_id);

  // Get grades for this student
  const {
    grades: studentGrades,
    loading: gradesLoading,
  } = useStudentGrades(
    selectedAcademicYear,
    selectedSemester,
    studentLocation?.name || student?.school_origin || '',
    student?.branch || ''
  );

  // Find this student's grade
  const studentGrade = studentGrades.find(g => g.student_id === studentId);

  // Calculate stats from reports
  const studentReports = reportsData.filter(r => r.student_id === studentId);
  const totalSessions = studentReports.length;
  const presentCount = studentReports.filter(r => r.attendance_status === 'PRESENT' || r.attendance_status === 'LATE').length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  const writtenScores = studentReports.filter(r => r.written_score != null).map(r => r.written_score!);
  const oralScores = studentReports.filter(r => r.oral_score != null).map(r => r.oral_score!);
  const avgWritten = writtenScores.length > 0 ? Math.round(writtenScores.reduce((a, b) => a + b, 0) / writtenScores.length) : null;
  const avgOral = oralScores.length > 0 ? Math.round(oralScores.reduce((a, b) => a + b, 0) / oralScores.length) : null;
  const overallAvg = avgWritten && avgOral ? Math.round((avgWritten + avgOral) / 2) : (avgWritten || avgOral || null);

  // Calculate semester grade average
  const semesterValues = [
    studentGrade?.quiz1, studentGrade?.quiz2, studentGrade?.quiz3,
    studentGrade?.participation, studentGrade?.mid, studentGrade?.final
  ].filter(v => v != null) as number[];
  const semesterAvg = semesterValues.length > 0
    ? Math.round(semesterValues.reduce((a, b) => a + b, 0) / semesterValues.length)
    : null;

  const getLetterGrade = (score: number) => {
    if (score >= 90) return { letter: 'A', color: 'text-green-600 bg-green-50 border-green-200' };
    if (score >= 80) return { letter: 'B', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (score >= 70) return { letter: 'C', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    if (score >= 60) return { letter: 'D', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { letter: 'E', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  if (studentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/admin/students')} className="text-xs py-1.5 px-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          Siswa tidak ditemukan.
        </div>
      </div>
    );
  }

  const skillLevels = student.skill_levels as Record<string, string> | undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate('/admin/students')} className="text-xs py-1.5 px-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Detail Siswa</h2>
          <p className="text-xs text-gray-500">Informasi lengkap dan nilai siswa</p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card className="!p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            {student.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {student.email}
              </span>
              {student.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {student.phone}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {studentLocation && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-medium border border-blue-100">
                  <School className="w-3 h-3" /> {studentLocation.name}
                </span>
              )}
              {student.school_origin && !studentLocation && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-medium border border-blue-100">
                  <School className="w-3 h-3" /> {student.school_origin}
                </span>
              )}
              {student.branch && (
                <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-medium border border-orange-100">
                  <GraduationCap className="w-3 h-3" /> Kelas {student.branch}
                </span>
              )}
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${student.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {student.status}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="!p-3 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rata-rata Nilai</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {overallAvg ?? '-'}
          </div>
        </Card>
        <Card className="!p-3 bg-gradient-to-br from-green-50 to-white border-green-100">
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kehadiran</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {attendanceRate}%
          </div>
        </Card>
        <Card className="!p-3 bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Sesi</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {totalSessions}
          </div>
        </Card>
        <Card className="!p-3 bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Written / Oral</div>
          <div className="text-lg font-bold text-orange-600 mt-1">
            {avgWritten ?? '-'} / {avgOral ?? '-'}
          </div>
        </Card>
      </div>

      {/* Skill Levels */}
      {skillLevels && Object.keys(skillLevels).length > 0 && (
        <Card className="!p-4">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Skill Levels</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {(['Grammar', 'Listening', 'Reading', 'Writing', 'Speaking', 'Vocabulary'] as SkillCategory[]).map(skill => {
              const level = skillLevels[skill];
              return (
                <div key={skill} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[9px] font-bold text-gray-500 uppercase">{skill}</div>
                  {level ? (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${LEVEL_COLORS[level] || 'bg-gray-100 text-gray-600'}`}>
                      {level}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Belum dinilai</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Semester Grades Section */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Nilai Semester
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-bold text-gray-500 uppercase">Tahun:</label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white"
              >
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-bold text-gray-500 uppercase">Semester:</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as '1' | '2')}
                className="px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white"
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
          </div>
        </div>

        {gradesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <span className="ml-2 text-xs text-gray-500">Memuat nilai...</span>
          </div>
        ) : studentGrade ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <div className="text-[9px] font-bold text-gray-500 uppercase">Quiz 1</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {studentGrade.quiz1 ?? '-'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <div className="text-[9px] font-bold text-gray-500 uppercase">Quiz 2</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {studentGrade.quiz2 ?? '-'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <div className="text-[9px] font-bold text-gray-500 uppercase">Quiz 3</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {studentGrade.quiz3 ?? '-'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <div className="text-[9px] font-bold text-gray-500 uppercase">Participation</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {studentGrade.participation ?? '-'}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                <div className="text-[9px] font-bold text-blue-600 uppercase">Mid Semester</div>
                <div className="text-xl font-bold text-blue-700 mt-1">
                  {studentGrade.mid ?? '-'}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-center">
                <div className="text-[9px] font-bold text-purple-600 uppercase">Final Semester</div>
                <div className="text-xl font-bold text-purple-700 mt-1">
                  {studentGrade.final ?? '-'}
                </div>
              </div>
            </div>

            {/* Average and Letter Grade */}
            {semesterAvg !== null && (
              <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
                <div className="text-center">
                  <div className="text-[9px] font-black text-gray-400 uppercase">Rata-rata Semester</div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">{semesterAvg}</div>
                </div>
                <div className={`px-4 py-2 rounded-lg text-xl font-bold border ${getLetterGrade(semesterAvg).color}`}>
                  {getLetterGrade(semesterAvg).letter}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 text-xs italic">
            Belum ada nilai untuk TA {selectedAcademicYear} Semester {selectedSemester}
          </div>
        )}
      </Card>

      {/* Recent Session Reports */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-xs font-bold text-gray-700">Riwayat Sesi ({studentReports.length})</h4>
        </div>
        <div className="divide-y divide-gray-100">
          {studentReports.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-xs italic">
              Belum ada riwayat sesi.
            </div>
          ) : (
            studentReports.slice(0, 10).map((report) => {
              const session = sessionsData.find(s => s.id === report.session_id);
              return (
                <div key={report.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-gray-900">{session?.topic || 'Unknown Session'}</h5>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                        {session?.date_time && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.date_time).toLocaleDateString('id-ID')}
                          </span>
                        )}
                        {session?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {session.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        report.attendance_status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                        report.attendance_status === 'LATE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {report.attendance_status === 'PRESENT' ? 'Hadir' :
                         report.attendance_status === 'LATE' ? 'Terlambat' : 'Absen'}
                      </span>
                      <div className="flex items-center gap-2 justify-end mt-1 text-[10px]">
                        {report.written_score != null && (
                          <span className="text-gray-600">Written: <strong>{report.written_score}</strong></span>
                        )}
                        {report.oral_score != null && (
                          <span className="text-gray-600">Oral: <strong>{report.oral_score}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

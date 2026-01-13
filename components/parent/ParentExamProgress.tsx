import React, { useState, useEffect } from 'react';
import { User, ClassType } from '../../types';
import { Card } from '../Card';
import { StudentGrade } from '../../hooks/useStudentGrades';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { parentEngagementService } from '../../services/parentEngagement.service';
import {
  GraduationCap, Calendar, TrendingUp, Award,
  Loader2, BookOpen, School, Globe, UserCheck
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

const getLetterGrade = (score: number) => {
  if (score >= 90) return { letter: 'A', color: 'text-green-600 bg-green-50 border-green-200' };
  if (score >= 80) return { letter: 'B', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (score >= 70) return { letter: 'C', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
  if (score >= 60) return { letter: 'D', color: 'text-orange-600 bg-orange-50 border-orange-200' };
  return { letter: 'E', color: 'text-red-600 bg-red-50 border-red-200' };
};

interface StudentProfile {
  school_origin: string | null;
  branch: string | null;
  assigned_location_id: string | null;
  class_type: string | null;
  school: string | null;
  class_name: string | null;
}

export const ParentExamProgress: React.FC<{ student: User }> = ({ student }) => {
  const { user } = useAuth();
  const academicYears = generateAcademicYears();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Track page view
  useEffect(() => {
    if (user?.id && user.role === 'PARENT') {
      parentEngagementService.trackPageView(user.id, 'exam-progress', '/parent/exam-progress');
    }
  }, [user?.id, user?.role]);
  const defaultAcademicYear = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
  const defaultSemester = currentMonth >= 6 ? '1' : '2';

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(defaultAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(defaultSemester as '1' | '2');
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [studentGrade, setStudentGrade] = useState<StudentGrade | null>(null);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [allTimeGrades, setAllTimeGrades] = useState<StudentGrade[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch student's profile info
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('school_origin, branch, assigned_location_id, class_type, school, class_name')
        .eq('id', student.id)
        .single();

      if (data) {
        setStudentProfile(data as StudentProfile);
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [student.id]);

  // Fetch grade for selected academic year/semester
  useEffect(() => {
    const fetchGrade = async () => {
      if (!student.id) return;
      
      setGradesLoading(true);
      const { data } = await supabase
        .from('student_grades')
        .select('*')
        .eq('student_id', student.id)
        .eq('academic_year', selectedAcademicYear)
        .eq('semester', selectedSemester)
        .maybeSingle();

      setStudentGrade(data as StudentGrade | null);
      setGradesLoading(false);
    };
    fetchGrade();
  }, [student.id, selectedAcademicYear, selectedSemester]);

  // Fetch all grades history
  useEffect(() => {
    const fetchAllGrades = async () => {
      setHistoryLoading(true);
      const { data } = await supabase
        .from('student_grades')
        .select('*')
        .eq('student_id', student.id)
        .order('academic_year', { ascending: false })
        .order('semester', { ascending: false });

      if (data) {
        setAllTimeGrades(data as StudentGrade[]);
      }
      setHistoryLoading(false);
    };
    fetchAllGrades();
  }, [student.id]);

  // Get school name
  const getSchoolName = () => {
    if (studentProfile?.school) return studentProfile.school;
    // Try to parse from school_origin if school is not set
    if (studentProfile?.school_origin && studentProfile.school_origin.includes(' - ')) {
      return studentProfile.school_origin.split(' - ')[0];
    }
    return studentProfile?.school_origin || '';
  };

  // Get class name
  const getClassName = () => {
    if (studentProfile?.class_name) return studentProfile.class_name;
    if (studentProfile?.branch) return studentProfile.branch;
    // Try to parse from school_origin if class_name is not set
    if (studentProfile?.school_origin && studentProfile.school_origin.includes(' - ')) {
      const parts = studentProfile.school_origin.split(' - ');
      return parts.slice(1).join(' - ');
    }
    return '';
  };

  const schoolName = getSchoolName();
  const className = getClassName();
  const isBilingual = studentProfile?.class_type === 'BILINGUAL' || 
                      studentProfile?.class_type === ClassType.BILINGUAL ||
                      className.toLowerCase().includes('bilingual');

  // Calculate semester average - base scores
  const getBaseScores = (grade: StudentGrade) => [
    grade.quiz1, grade.quiz2, grade.quiz3,
    grade.mid, grade.final,
    grade.speaking, grade.listening
  ].filter(v => v != null) as number[];

  // Calculate semester average - bilingual scores
  const getBilingualScores = (grade: StudentGrade) => [
    ...getBaseScores(grade),
    grade.reading, grade.writing, grade.maths, grade.science
  ].filter(v => v != null) as number[];

  const semesterValues = studentGrade 
    ? (isBilingual ? getBilingualScores(studentGrade) : getBaseScores(studentGrade))
    : [];
  const semesterAvg = semesterValues.length > 0
    ? Math.round(semesterValues.reduce((a, b) => a + b, 0) / semesterValues.length)
    : null;

  const isLoading = profileLoading || gradesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading grades...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Exam Progress - {student.name}
          </h2>
          <p className="text-xs text-gray-500">Lihat nilai semester anak Anda.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {schoolName && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
              <School className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">{schoolName}</span>
            </div>
          )}
          {className && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-100">
              <BookOpen className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">Kelas {className}</span>
            </div>
          )}
          {isBilingual ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold border border-blue-200">
              <Globe className="w-3 h-3" /> Bilingual
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-[10px] font-bold border border-teal-200">
              <UserCheck className="w-3 h-3" /> Regular
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <label className="text-xs font-bold text-gray-600">Tahun Ajaran:</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-600">Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as '1' | '2')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Current Semester Grades */}
      {studentGrade ? (
        <Card className="!p-4">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Nilai TA {selectedAcademicYear} - Semester {selectedSemester}
          </h3>

          {/* Main Exam Scores */}
          <div className="mb-4">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Nilai Ujian Utama</h4>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
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
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                <div className="text-[9px] font-bold text-blue-600 uppercase">UTS</div>
                <div className="text-xl font-bold text-blue-700 mt-1">
                  {studentGrade.mid ?? '-'}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-center">
                <div className="text-[9px] font-bold text-purple-600 uppercase">UAS</div>
                <div className="text-xl font-bold text-purple-700 mt-1">
                  {studentGrade.final ?? '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Speaking & Listening */}
          <div className="mb-4">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Speaking & Listening</h4>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                <div className="text-[9px] font-bold text-green-600 uppercase">Speaking</div>
                <div className="text-xl font-bold text-green-700 mt-1">
                  {studentGrade.speaking ?? '-'}
                </div>
              </div>
              <div className="p-3 bg-teal-50 rounded-lg border border-teal-100 text-center">
                <div className="text-[9px] font-bold text-teal-600 uppercase">Listening</div>
                <div className="text-xl font-bold text-teal-700 mt-1">
                  {studentGrade.listening ?? '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Bilingual-only scores */}
          {isBilingual && (
            <div className="mb-4">
              <h4 className="text-[10px] font-bold text-blue-600 uppercase mb-2 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Bilingual Subjects
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-center">
                  <div className="text-[9px] font-bold text-indigo-600 uppercase">Reading</div>
                  <div className="text-xl font-bold text-indigo-700 mt-1">
                    {studentGrade.reading ?? '-'}
                  </div>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-100 text-center">
                  <div className="text-[9px] font-bold text-pink-600 uppercase">Writing</div>
                  <div className="text-xl font-bold text-pink-700 mt-1">
                    {studentGrade.writing ?? '-'}
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center">
                  <div className="text-[9px] font-bold text-amber-600 uppercase">Maths</div>
                  <div className="text-xl font-bold text-amber-700 mt-1">
                    {studentGrade.maths ?? '-'}
                  </div>
                </div>
                <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-100 text-center">
                  <div className="text-[9px] font-bold text-cyan-600 uppercase">Science</div>
                  <div className="text-xl font-bold text-cyan-700 mt-1">
                    {studentGrade.science ?? '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Average and Letter Grade */}
          {semesterAvg !== null && (
            <div className="flex items-center justify-center gap-6 p-4 bg-gradient-to-r from-green-50 to-purple-50 rounded-xl border border-green-100">
              <div className="text-center">
                <div className="text-[9px] font-black text-gray-400 uppercase">Rata-rata Semester</div>
                <div className="text-4xl font-bold text-gray-900 mt-1">{semesterAvg}</div>
              </div>
              <div className={`px-6 py-3 rounded-xl text-3xl font-bold border-2 ${getLetterGrade(semesterAvg).color}`}>
                {getLetterGrade(semesterAvg).letter}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="!p-8 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Belum ada nilai untuk TA {selectedAcademicYear} Semester {selectedSemester}</p>
          <p className="text-xs text-gray-400 mt-1">Nilai akan muncul setelah guru memasukkan data.</p>
        </Card>
      )}

      {/* Grade History */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Riwayat Nilai Semester
          </h4>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : allTimeGrades.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-xs italic">
            Belum ada riwayat nilai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase">TA</th>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase">Sem</th>
                  <th className="px-2 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Q1</th>
                  <th className="px-2 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Q2</th>
                  <th className="px-2 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Q3</th>
                  <th className="px-2 py-2 text-center text-[9px] font-black text-blue-500 uppercase">UTS</th>
                  <th className="px-2 py-2 text-center text-[9px] font-black text-purple-500 uppercase">UAS</th>
                  <th className="px-2 py-2 text-center text-[9px] font-black text-green-500 uppercase">Spk</th>
                  <th className="px-2 py-2 text-center text-[9px] font-black text-teal-500 uppercase">Lst</th>
                  {isBilingual && (
                    <>
                      <th className="px-2 py-2 text-center text-[9px] font-black text-indigo-500 uppercase">Rd</th>
                      <th className="px-2 py-2 text-center text-[9px] font-black text-pink-500 uppercase">Wr</th>
                      <th className="px-2 py-2 text-center text-[9px] font-black text-amber-500 uppercase">Mt</th>
                      <th className="px-2 py-2 text-center text-[9px] font-black text-cyan-500 uppercase">Sc</th>
                    </>
                  )}
                  <th className="px-2 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Avg</th>
                  <th className="px-2 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Grd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allTimeGrades.map((grade) => {
                  const values = isBilingual 
                    ? getBilingualScores(grade)
                    : getBaseScores(grade);
                  const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

                  return (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900 text-[10px]">{grade.academic_year}</td>
                      <td className="px-3 py-2 text-gray-600 text-[10px]">{grade.semester}</td>
                      <td className="px-2 py-2 text-center">{grade.quiz1 ?? '-'}</td>
                      <td className="px-2 py-2 text-center">{grade.quiz2 ?? '-'}</td>
                      <td className="px-2 py-2 text-center">{grade.quiz3 ?? '-'}</td>
                      <td className="px-2 py-2 text-center text-blue-600 font-medium">{grade.mid ?? '-'}</td>
                      <td className="px-2 py-2 text-center text-purple-600 font-medium">{grade.final ?? '-'}</td>
                      <td className="px-2 py-2 text-center text-green-600">{grade.speaking ?? '-'}</td>
                      <td className="px-2 py-2 text-center text-teal-600">{grade.listening ?? '-'}</td>
                      {isBilingual && (
                        <>
                          <td className="px-2 py-2 text-center text-indigo-600">{grade.reading ?? '-'}</td>
                          <td className="px-2 py-2 text-center text-pink-600">{grade.writing ?? '-'}</td>
                          <td className="px-2 py-2 text-center text-amber-600">{grade.maths ?? '-'}</td>
                          <td className="px-2 py-2 text-center text-cyan-600">{grade.science ?? '-'}</td>
                        </>
                      )}
                      <td className="px-2 py-2 text-center">
                        {avg !== null ? (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            avg >= 80 ? 'bg-green-100 text-green-700' :
                            avg >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {avg}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {avg !== null && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getLetterGrade(avg).color}`}>
                            {getLetterGrade(avg).letter}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

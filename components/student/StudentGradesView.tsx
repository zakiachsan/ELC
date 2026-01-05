import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Card } from '../Card';
import { useStudentGrades, StudentGrade } from '../../hooks/useStudentGrades';
import { useLocations } from '../../hooks/useProfiles';
import { supabase } from '../../lib/supabase';
import {
  GraduationCap, Calendar, TrendingUp, Award,
  Loader2, BookOpen, School
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
}

export const StudentGradesView: React.FC<{ student: User }> = ({ student }) => {
  const academicYears = generateAcademicYears();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultAcademicYear = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
  const defaultSemester = currentMonth >= 6 ? '1' : '2';

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(defaultAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(defaultSemester as '1' | '2');
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const { locations } = useLocations();

  // Fetch student's school info from profiles
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('school_origin, branch, assigned_location_id')
        .eq('id', student.id)
        .single();

      if (data) {
        setStudentProfile(data);
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [student.id]);

  // Get school name
  const getSchoolName = () => {
    if (studentProfile?.assigned_location_id) {
      const location = locations.find(l => l.id === studentProfile.assigned_location_id);
      if (location) return location.name;
    }
    return studentProfile?.school_origin || '';
  };

  const schoolName = getSchoolName();
  const className = studentProfile?.branch || '';

  // Get grades
  const {
    grades: allGrades,
    loading: gradesLoading,
  } = useStudentGrades(
    selectedAcademicYear,
    selectedSemester,
    schoolName,
    className
  );

  // Find this student's grade
  const studentGrade = allGrades.find(g => g.student_id === student.id);

  // Calculate semester average
  const semesterValues = [
    studentGrade?.quiz1, studentGrade?.quiz2, studentGrade?.quiz3,
    studentGrade?.participation, studentGrade?.mid, studentGrade?.final
  ].filter(v => v != null) as number[];
  const semesterAvg = semesterValues.length > 0
    ? Math.round(semesterValues.reduce((a, b) => a + b, 0) / semesterValues.length)
    : null;

  // Get all grades for all semesters to show history
  const [allTimeGrades, setAllTimeGrades] = useState<StudentGrade[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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
        setAllTimeGrades(data);
      }
      setHistoryLoading(false);
    };
    fetchAllGrades();
  }, [student.id]);

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
            Nilai Semester
          </h2>
          <p className="text-xs text-gray-500">Lihat nilai semester kamu.</p>
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

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
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
                  <th className="px-4 py-2 text-left text-[9px] font-black text-gray-400 uppercase">Tahun Ajaran</th>
                  <th className="px-4 py-2 text-left text-[9px] font-black text-gray-400 uppercase">Semester</th>
                  <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Q1</th>
                  <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Q2</th>
                  <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Q3</th>
                  <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Part</th>
                  <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase">UTS</th>
                  <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase">UAS</th>
                  <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Avg</th>
                  <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allTimeGrades.map((grade) => {
                  const values = [grade.quiz1, grade.quiz2, grade.quiz3, grade.participation, grade.mid, grade.final].filter(v => v != null) as number[];
                  const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

                  return (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{grade.academic_year}</td>
                      <td className="px-4 py-2 text-gray-600">Semester {grade.semester}</td>
                      <td className="px-4 py-2 text-center">{grade.quiz1 ?? '-'}</td>
                      <td className="px-4 py-2 text-center">{grade.quiz2 ?? '-'}</td>
                      <td className="px-4 py-2 text-center">{grade.quiz3 ?? '-'}</td>
                      <td className="px-4 py-2 text-center">{grade.participation ?? '-'}</td>
                      <td className="px-4 py-2 text-center text-blue-600 font-medium">{grade.mid ?? '-'}</td>
                      <td className="px-4 py-2 text-center text-purple-600 font-medium">{grade.final ?? '-'}</td>
                      <td className="px-4 py-2 text-center">
                        {avg !== null ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            avg >= 80 ? 'bg-green-100 text-green-700' :
                            avg >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {avg}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {avg !== null && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLetterGrade(avg).color}`}>
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

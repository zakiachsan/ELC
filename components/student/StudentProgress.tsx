
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Card } from '../Card';
import { useStudentGrades } from '../../hooks/useStudentGrades';
import { supabase } from '../../lib/supabase';
import { TrendingUp, BookOpen, ClipboardCheck, Calendar, Loader2, Award, GraduationCap } from 'lucide-react';

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

export const StudentProgress: React.FC<{ student: User }> = ({ student }) => {
  const academicYears = generateAcademicYears();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultAcademicYear = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
  const defaultSemester = currentMonth >= 6 ? '1' : '2';

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(defaultAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(defaultSemester as '1' | '2');
  const [studentProfile, setStudentProfile] = useState<{ school: string; className: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch student profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('school_origin, assigned_location_id')
        .eq('id', student.id)
        .single();

      if (data) {
        let school = '';
        let className = '';
        
        if (data.school_origin && data.school_origin.includes(' - ')) {
          const parts = data.school_origin.split(' - ');
          school = parts[0];
          className = parts.slice(1).join(' - ');
        } else {
          school = data.school_origin || '';
        }
        
        setStudentProfile({ school, className });
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [student.id]);

  // Get grades from student_grades table
  const { grades: allGrades, loading: gradesLoading } = useStudentGrades(
    selectedAcademicYear,
    selectedSemester,
    studentProfile?.school || '',
    studentProfile?.className || ''
  );

  // Find this student's grade
  const studentGrade = allGrades.find(g => g.student_id === student.id);

  // Calculate average
  const gradeValues = [
    studentGrade?.quiz1, studentGrade?.quiz2, studentGrade?.quiz3,
    studentGrade?.mid, studentGrade?.final
  ].filter(v => v != null) as number[];
  const average = gradeValues.length > 0
    ? Math.round(gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length)
    : null;

  if (profileLoading || gradesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading progress...</span>
      </div>
    );
  }

  const getScoreColor = (score: number | null | undefined) => {
    if (score == null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number | null | undefined) => {
    if (score == null) return 'bg-gray-50 border-gray-200';
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            My Progress
          </h2>
          <p className="text-xs text-gray-500">Track your grades and learning progress.</p>
        </div>
        
        {/* Semester Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
          >
            {academicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value as '1' | '2')}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>
      </div>

      {/* Average Score Card */}
      {average !== null && (
        <Card className="!p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Semester Average</p>
                <p className="text-2xl font-bold text-gray-900">{average}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreBg(average)} ${getScoreColor(average)}`}>
              {average >= 80 ? 'Excellent' : average >= 70 ? 'Good' : average >= 60 ? 'Fair' : 'Needs Improvement'}
            </div>
          </div>
        </Card>
      )}

      {/* Grades Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Quiz 1 */}
        <Card className={`!p-3 ${getScoreBg(studentGrade?.quiz1)}`}>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Quiz 1</span>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(studentGrade?.quiz1)}`}>
            {studentGrade?.quiz1 ?? '-'}
          </p>
        </Card>

        {/* Quiz 2 */}
        <Card className={`!p-3 ${getScoreBg(studentGrade?.quiz2)}`}>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Quiz 2</span>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(studentGrade?.quiz2)}`}>
            {studentGrade?.quiz2 ?? '-'}
          </p>
        </Card>

        {/* Quiz 3 */}
        <Card className={`!p-3 ${getScoreBg(studentGrade?.quiz3)}`}>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Quiz 3</span>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(studentGrade?.quiz3)}`}>
            {studentGrade?.quiz3 ?? '-'}
          </p>
        </Card>

        {/* Mid Semester */}
        <Card className={`!p-3 ${getScoreBg(studentGrade?.mid)}`}>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">UTS</span>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(studentGrade?.mid)}`}>
            {studentGrade?.mid ?? '-'}
          </p>
        </Card>

        {/* Final Semester */}
        <Card className={`!p-3 ${getScoreBg(studentGrade?.final)}`}>
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">UAS</span>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(studentGrade?.final)}`}>
            {studentGrade?.final ?? '-'}
          </p>
        </Card>
      </div>

      {/* Participation Score (if any) */}
      {studentGrade?.participation != null && (
        <Card className="!p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-500" />
              <span className="text-xs font-bold text-gray-700">Participation Score</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(studentGrade.participation)}`}>
              {studentGrade.participation}
            </span>
          </div>
        </Card>
      )}

      {/* No Data Message */}
      {!studentGrade && (
        <Card className="!p-6 text-center">
          <div className="text-gray-400 mb-2">
            <ClipboardCheck className="w-10 h-10 mx-auto opacity-50" />
          </div>
          <p className="text-sm text-gray-500">No grades recorded for this semester yet.</p>
          <p className="text-xs text-gray-400 mt-1">Grades will appear here once your teacher records them.</p>
        </Card>
      )}
    </div>
  );
};

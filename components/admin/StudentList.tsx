
import React, { useState, useMemo } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { useStudents } from '../../hooks/useProfiles';
import { useSessions } from '../../hooks/useSessions';
import { useReports } from '../../hooks/useReports';
import type { Database } from '../../lib/database.types';
import {
  Mail, Search, X,
  TrendingUp, List as ListIcon, Eye,
  User as UserIcon, ShieldAlert, School,
  Smartphone, BarChart3, Users, GraduationCap,
  Trophy, Calendar
} from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type DifficultyLevel = 'Starter' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced';

const LEVEL_OPTIONS: { value: DifficultyLevel | ''; label: string }[] = [
  { value: '', label: 'Semua Level' },
  { value: 'Starter', label: 'Starter' },
  { value: 'Elementary', label: 'Elementary' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Upper-Intermediate', label: 'Upper-Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

export const StudentList: React.FC = () => {
  // Data Hooks
  const { profiles: students, loading: studentsLoading } = useStudents();
  const { sessions, loading: sessionsLoading } = useSessions();
  const { reports, loading: reportsLoading } = useReports();

  // UI State
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'statistics'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  // Modal State
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);

  // Calculate unique schools from students
  const uniqueSchools = useMemo(() => {
    const schools = students
      .map(s => s.school_origin)
      .filter((school): school is string => !!school);
    return [...new Set(schools)].sort();
  }, [students]);

  // Calculate student statistics
  const studentStats = useMemo(() => {
    const stats: Record<string, {
      totalSessions: number;
      totalReports: number;
      writtenScores: number[];
      oralScores: number[];
      attendance: { present: number; late: number; absent: number };
      level: string;
    }> = {};

    // Initialize stats for each student
    students.forEach(student => {
      stats[student.id] = {
        totalSessions: 0,
        totalReports: 0,
        writtenScores: [],
        oralScores: [],
        attendance: { present: 0, late: 0, absent: 0 },
        level: '',
      };

      // Get skill level from skill_levels JSON
      const skillLevels = student.skill_levels as Record<string, string> | null;
      if (skillLevels && skillLevels['Grammar']) {
        stats[student.id].level = skillLevels['Grammar'];
      }
    });

    // Calculate from reports
    reports.forEach(report => {
      if (stats[report.student_id]) {
        stats[report.student_id].totalReports++;

        if (report.written_score !== null) {
          stats[report.student_id].writtenScores.push(report.written_score);
        }
        if (report.oral_score !== null) {
          stats[report.student_id].oralScores.push(report.oral_score);
        }

        if (report.attendance_status === 'PRESENT') {
          stats[report.student_id].attendance.present++;
        } else if (report.attendance_status === 'LATE') {
          stats[report.student_id].attendance.late++;
        } else if (report.attendance_status === 'ABSENT') {
          stats[report.student_id].attendance.absent++;
        }
      }
    });

    return stats;
  }, [students, reports]);

  // Calculate averages
  const getStudentAverage = (studentId: string) => {
    const stats = studentStats[studentId];
    if (!stats) return { written: 0, oral: 0, overall: 0 };

    const writtenAvg = stats.writtenScores.length > 0
      ? stats.writtenScores.reduce((a, b) => a + b, 0) / stats.writtenScores.length
      : 0;
    const oralAvg = stats.oralScores.length > 0
      ? stats.oralScores.reduce((a, b) => a + b, 0) / stats.oralScores.length
      : 0;
    const overall = (writtenAvg + oralAvg) / 2;

    return { written: writtenAvg, oral: oralAvg, overall };
  };

  // Statistics by school
  const schoolStats = useMemo(() => {
    const stats: Record<string, {
      studentCount: number;
      avgWritten: number;
      avgOral: number;
      avgOverall: number;
      attendanceRate: number;
      students: Profile[];
    }> = {};

    students.forEach(student => {
      const school = student.school_origin || 'Tidak Diketahui';
      if (!stats[school]) {
        stats[school] = {
          studentCount: 0,
          avgWritten: 0,
          avgOral: 0,
          avgOverall: 0,
          attendanceRate: 0,
          students: [],
        };
      }
      stats[school].studentCount++;
      stats[school].students.push(student);
    });

    // Calculate averages per school
    Object.keys(stats).forEach(school => {
      const schoolStudents = stats[school].students;
      let totalWritten = 0, totalOral = 0, totalAttendance = 0, count = 0;

      schoolStudents.forEach(student => {
        const avg = getStudentAverage(student.id);
        const studentStat = studentStats[student.id];
        if (avg.written > 0 || avg.oral > 0) {
          totalWritten += avg.written;
          totalOral += avg.oral;
          count++;
        }
        if (studentStat) {
          const total = studentStat.attendance.present + studentStat.attendance.late + studentStat.attendance.absent;
          if (total > 0) {
            totalAttendance += ((studentStat.attendance.present + studentStat.attendance.late) / total) * 100;
          }
        }
      });

      if (count > 0) {
        stats[school].avgWritten = totalWritten / count;
        stats[school].avgOral = totalOral / count;
        stats[school].avgOverall = (stats[school].avgWritten + stats[school].avgOral) / 2;
      }
      if (schoolStudents.length > 0) {
        stats[school].attendanceRate = totalAttendance / schoolStudents.length;
      }
    });

    return stats;
  }, [students, studentStats]);

  // Statistics by level
  const levelStats = useMemo(() => {
    const stats: Record<string, {
      studentCount: number;
      avgScore: number;
      students: Profile[];
    }> = {};

    students.forEach(student => {
      const level = studentStats[student.id]?.level || 'Belum Ditentukan';
      if (!stats[level]) {
        stats[level] = {
          studentCount: 0,
          avgScore: 0,
          students: [],
        };
      }
      stats[level].studentCount++;
      stats[level].students.push(student);
    });

    // Calculate averages per level
    Object.keys(stats).forEach(level => {
      const levelStudents = stats[level].students;
      let totalScore = 0, count = 0;

      levelStudents.forEach(student => {
        const avg = getStudentAverage(student.id);
        if (avg.overall > 0) {
          totalScore += avg.overall;
          count++;
        }
      });

      if (count > 0) {
        stats[level].avgScore = totalScore / count;
      }
    });

    return stats;
  }, [students, studentStats]);

  // Top performing students
  const topStudents = useMemo(() => {
    return students
      .map(student => ({
        ...student,
        average: getStudentAverage(student.id),
        stats: studentStats[student.id],
      }))
      .filter(s => s.average.overall > 0)
      .sort((a, b) => b.average.overall - a.average.overall)
      .slice(0, 10);
  }, [students, studentStats]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSchool = !schoolFilter || student.school_origin === schoolFilter;

      const studentLevel = studentStats[student.id]?.level || '';
      const matchesLevel = !levelFilter || studentLevel === levelFilter;

      return matchesSearch && matchesSchool && matchesLevel;
    });
  }, [students, searchQuery, schoolFilter, levelFilter, studentStats]);

  // Loading state
  const isLoading = studentsLoading || sessionsLoading || reportsLoading;

  const getAttendanceRate = (studentId: string) => {
    const stats = studentStats[studentId];
    if (!stats) return 0;
    const total = stats.attendance.present + stats.attendance.late + stats.attendance.absent;
    if (total === 0) return 0;
    return ((stats.attendance.present + stats.attendance.late) / total) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-600" /> Manajemen Siswa
          </h2>
          <p className="text-xs text-gray-500">Kelola direktori siswa dan lihat statistik.</p>
        </div>

        <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeSubTab === 'directory' ? 'theme-bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ListIcon className="w-3 h-3" /> Direktori
          </button>
          <button
            onClick={() => setActiveSubTab('statistics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeSubTab === 'statistics' ? 'theme-bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-3 h-3" /> Statistik
          </button>
        </div>
      </div>

      {/* Statistics Tab */}
      {activeSubTab === 'statistics' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card className="!p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-blue-500 uppercase">Total Siswa</p>
                      <p className="text-xl font-black text-gray-900">{students.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="!p-4 bg-gradient-to-br from-green-50 to-white border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <School className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-green-500 uppercase">Sekolah</p>
                      <p className="text-xl font-black text-gray-900">{uniqueSchools.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="!p-4 bg-gradient-to-br from-amber-50 to-white border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-amber-500 uppercase">Total Sesi</p>
                      <p className="text-xl font-black text-gray-900">{sessions.length}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Stats by School */}
              <Card className="!p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" /> Statistik per Sekolah
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase">Sekolah</th>
                        <th className="px-3 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Siswa</th>
                        <th className="px-3 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Rata-rata Written</th>
                        <th className="px-3 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Rata-rata Oral</th>
                        <th className="px-3 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Rata-rata Keseluruhan</th>
                        <th className="px-3 py-2 text-center text-[9px] font-black text-gray-400 uppercase">Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(schoolStats)
                        .sort((a, b) => b[1].studentCount - a[1].studentCount)
                        .map(([school, stats]) => (
                          <tr key={school} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-bold text-gray-900">{school}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                {stats.studentCount}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center font-bold">
                              {stats.avgWritten > 0 ? stats.avgWritten.toFixed(1) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center font-bold">
                              {stats.avgOral > 0 ? stats.avgOral.toFixed(1) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                stats.avgOverall >= 80 ? 'bg-green-100 text-green-700' :
                                stats.avgOverall >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                stats.avgOverall > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {stats.avgOverall > 0 ? stats.avgOverall.toFixed(1) : '-'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center font-bold">
                              {stats.attendanceRate > 0 ? `${stats.attendanceRate.toFixed(0)}%` : '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Stats by Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="!p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" /> Distribusi Level
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(levelStats)
                      .sort((a, b) => b[1].studentCount - a[1].studentCount)
                      .map(([level, stats]) => (
                        <div key={level} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              level === 'Advanced' ? 'bg-purple-100 text-purple-700' :
                              level === 'Upper-Intermediate' ? 'bg-blue-100 text-blue-700' :
                              level === 'Intermediate' ? 'bg-green-100 text-green-700' :
                              level === 'Elementary' ? 'bg-yellow-100 text-yellow-700' :
                              level === 'Starter' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {level}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-gray-600">
                              {stats.studentCount} siswa
                            </span>
                            <span className="text-xs font-bold text-gray-400">
                              Avg: {stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '-'}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>

                {/* Top Performing Students */}
                <Card className="!p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" /> Top 10 Siswa Berprestasi
                  </h3>
                  <div className="space-y-2">
                    {topStudents.map((student, idx) => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            idx === 0 ? 'bg-yellow-400 text-white' :
                            idx === 1 ? 'bg-gray-300 text-gray-700' :
                            idx === 2 ? 'bg-amber-600 text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{student.name}</p>
                            <p className="text-[10px] text-gray-500">{student.school_origin || 'N/A'}</p>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {student.average.overall.toFixed(1)}
                        </span>
                      </div>
                    ))}
                    {topStudents.length === 0 && (
                      <p className="text-xs text-gray-400 italic text-center py-4">Belum ada data nilai</p>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Directory Tab */}
      {activeSubTab === 'directory' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {/* Filters Row */}
          <Card className="!p-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                {/* Search */}
                <div className="flex-1 min-w-0">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1 block">Cari Siswa</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Nama atau email..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 focus:bg-white"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* School Filter */}
                <div className="w-full sm:w-48">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <School className="w-3 h-3" /> Sekolah
                  </label>
                  <select
                    value={schoolFilter}
                    onChange={e => setSchoolFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 focus:bg-white"
                  >
                    <option value="">Semua Sekolah</option>
                    {uniqueSchools.map(school => (
                      <option key={school} value={school}>{school}</option>
                    ))}
                  </select>
                </div>

                {/* Level Filter */}
                <div className="w-full sm:w-48">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Level
                  </label>
                  <select
                    value={levelFilter}
                    onChange={e => setLevelFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 focus:bg-white"
                  >
                    {LEVEL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stats & Reset */}
              <div className="flex items-end gap-2 w-full sm:w-auto">
                <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <span className="text-[9px] font-bold text-blue-400 uppercase block">Hasil</span>
                  <span className="text-sm font-bold text-blue-900">{filteredStudents.length} Siswa</span>
                </div>
                {(schoolFilter || levelFilter || searchQuery) && (
                  <button
                    onClick={() => { setSchoolFilter(''); setLevelFilter(''); setSearchQuery(''); }}
                    className="px-4 py-2 h-[42px] bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-all flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reset
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Student Table */}
          <Card className="!p-0 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Siswa</th>
                      <th className="px-4 py-3">Sekolah</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3 text-center">Rata-rata</th>
                      <th className="px-4 py-3 text-center">Kehadiran</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => {
                      const avg = getStudentAverage(student.id);
                      const attendance = getAttendanceRate(student.id);
                      const level = studentStats[student.id]?.level || 'N/A';

                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg theme-bg-primary text-white flex items-center justify-center font-bold text-sm">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{student.name}</p>
                                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {student.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                              {student.school_origin || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                              level === 'Advanced' ? 'bg-purple-100 text-purple-700' :
                              level === 'Upper-Intermediate' ? 'bg-blue-100 text-blue-700' :
                              level === 'Intermediate' ? 'bg-green-100 text-green-700' :
                              level === 'Elementary' ? 'bg-yellow-100 text-yellow-700' :
                              level === 'Starter' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {avg.overall > 0 ? (
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                avg.overall >= 80 ? 'bg-green-100 text-green-700' :
                                avg.overall >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {avg.overall.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {attendance > 0 ? (
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                attendance >= 80 ? 'bg-green-100 text-green-700' :
                                attendance >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {attendance.toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm italic">
                          Tidak ada siswa ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* --- MODAL: STUDENT DETAIL --- */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="absolute top-4 right-4">
              <button onClick={() => setSelectedStudent(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Compact Header */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                <div className="w-14 h-14 theme-bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-xs text-gray-500">Profil Siswa</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 p-3 rounded-xl text-center">
                  <p className="text-xl font-black text-blue-600">{getStudentAverage(selectedStudent.id).overall.toFixed(1) || '-'}</p>
                  <p className="text-[9px] font-bold text-blue-500 uppercase">Rata-rata</p>
                </div>
                <div className="bg-green-50 p-3 rounded-xl text-center">
                  <p className="text-xl font-black text-green-600">{getAttendanceRate(selectedStudent.id).toFixed(0) || 0}%</p>
                  <p className="text-[9px] font-bold text-green-500 uppercase">Kehadiran</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl text-center">
                  <p className="text-xl font-black text-purple-600">{studentStats[selectedStudent.id]?.totalReports || 0}</p>
                  <p className="text-[9px] font-bold text-purple-500 uppercase">Sesi</p>
                </div>
              </div>

              {/* Detail Content Grid */}
              <div className="space-y-4">
                {/* Student Data Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-600" /> Informasi Siswa
                  </h4>
                  <div className="grid grid-cols-1 gap-2 bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500">Email</span>
                      <span className="text-gray-900 font-medium truncate ml-4">{selectedStudent.email}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500">Telepon</span>
                      <span className="text-gray-900 font-medium flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-blue-500" /> {selectedStudent.phone || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500">Sekolah</span>
                      <span className="text-gray-900 font-medium">{selectedStudent.school_origin || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500">Level</span>
                      <span className="text-gray-900 font-medium">{studentStats[selectedStudent.id]?.level || 'Belum Ditentukan'}</span>
                    </div>
                  </div>
                </div>

                {/* Score Details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" /> Detail Nilai
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-green-600 uppercase mb-1">Written Score</p>
                      <p className="text-2xl font-black text-green-700">{getStudentAverage(selectedStudent.id).written.toFixed(1) || '-'}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-blue-600 uppercase mb-1">Oral Score</p>
                      <p className="text-2xl font-black text-blue-700">{getStudentAverage(selectedStudent.id).oral.toFixed(1) || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <Button onClick={() => setSelectedStudent(null)} className="w-full h-11 rounded-xl font-bold">
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

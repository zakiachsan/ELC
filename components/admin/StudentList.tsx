
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../Card';
import { useStudents, useStudentsPaginated, useLocations } from '../../hooks/useProfiles';
import { useSessions } from '../../hooks/useSessions';
import { useReports } from '../../hooks/useReports';
import type { Database } from '../../lib/database.types';
import {
  Mail, Search, X,
  List as ListIcon, Eye,
  User as UserIcon, School,
  BarChart3, Users, GraduationCap,
  Trophy, Calendar,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
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

const PAGE_SIZE = 20;

// Helper function to get school level priority for sorting
const getSchoolLevelPriority = (schoolName: string): number => {
  const name = schoolName.toUpperCase();

  // Check by name prefix
  if (name.startsWith('TK ') || name.startsWith('TK-')) return 1;
  if (name.startsWith('SD ') || name.startsWith('SDK ')) return 2;
  if (name.startsWith('SMP ')) return 3;
  if (name.startsWith('SMA ') || name.startsWith('SMK ')) return 4;

  return 5; // Other schools at the end
};

// Sort schools by level (TK → SD → SMP → SMA/SMK) then by name
const sortSchoolsByLevel = (schools: string[]): string[] => {
  return [...schools].sort((a, b) => {
    const priorityA = getSchoolLevelPriority(a);
    const priorityB = getSchoolLevelPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Same level, sort alphabetically by name
    return a.localeCompare(b);
  });
};

export const StudentList: React.FC = () => {
  const navigate = useNavigate();

  // UI State
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'statistics'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 when search changes
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page and class filter when school filter changes
  useEffect(() => {
    setCurrentPage(1);
    setClassFilter(''); // Reset class filter when school changes
  }, [schoolFilter]);

  // Reset page when class filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [classFilter]);

  // Data Hooks - Statistics tab uses all students
  const { profiles: allStudents, loading: allStudentsLoading } = useStudents();
  const { sessions, loading: sessionsLoading } = useSessions();
  const { reports, loading: reportsLoading } = useReports();
  const { locations, loading: locationsLoading } = useLocations();

  // Find location ID from school filter
  const selectedLocationId = useMemo(() => {
    if (!schoolFilter) return undefined;
    const location = locations.find(loc => loc.name === schoolFilter);
    return location?.id;
  }, [schoolFilter, locations]);

  // Data Hook - Directory tab uses paginated students
  const {
    students: paginatedStudents,
    totalCount,
    totalPages,
    loading: paginatedLoading
  } = useStudentsPaginated({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    locationId: selectedLocationId,
  });

  // Helper to get school name from assigned_location_id or school_origin
  const getSchoolName = (student: Profile): string => {
    if (student.assigned_location_id) {
      const location = locations.find(loc => loc.id === student.assigned_location_id);
      if (location) return location.name;
    }
    // school_origin format: "SCHOOL_NAME - CLASS_NAME", extract school part
    if (student.school_origin) {
      const parts = student.school_origin.split(' - ');
      return parts[0] || student.school_origin;
    }
    return '';
  };

  // Helper to get class name from school_origin or assigned_classes
  const getClassName = (student: Profile): string => {
    // First check assigned_classes array
    if (student.assigned_classes && student.assigned_classes.length > 0) {
      return student.assigned_classes.join(', ');
    }
    // Then check class_name field
    if (student.class_name) {
      return student.class_name;
    }
    // Finally, try to parse from school_origin (format: "SCHOOL - CLASS")
    if (student.school_origin && student.school_origin.includes(' - ')) {
      const parts = student.school_origin.split(' - ');
      if (parts.length > 1) {
        return parts.slice(1).join(' - '); // Get everything after first " - "
      }
    }
    return '';
  };

  // Calculate unique schools from all students (for dropdown filter)
  const uniqueSchools = useMemo(() => {
    const schools = allStudents
      .map(s => getSchoolName(s))
      .filter((school): school is string => !!school);
    return sortSchoolsByLevel([...new Set(schools)]);
  }, [allStudents, locations]);

  // Calculate unique classes based on selected school (for dropdown filter)
  const uniqueClasses = useMemo(() => {
    // Filter students by selected school first
    const studentsInSchool = schoolFilter
      ? allStudents.filter(s => getSchoolName(s) === schoolFilter)
      : allStudents;

    const classes = studentsInSchool
      .map(s => getClassName(s))
      .filter((cls): cls is string => !!cls);
    return [...new Set(classes)].sort();
  }, [allStudents, schoolFilter, locations]);

  // Filter paginated students by class (client-side filtering since server doesn't support class filter)
  const filteredStudents = useMemo(() => {
    if (!classFilter) return paginatedStudents;
    return paginatedStudents.filter(s => getClassName(s) === classFilter);
  }, [paginatedStudents, classFilter]);

  // Calculate student statistics (uses all students for statistics tab)
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
    allStudents.forEach(student => {
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
  }, [allStudents, reports]);

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

    allStudents.forEach(student => {
      const school = getSchoolName(student) || 'Tidak Diketahui';
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
  }, [allStudents, studentStats, locations]);

  // Statistics by level
  const levelStats = useMemo(() => {
    const stats: Record<string, {
      studentCount: number;
      avgScore: number;
      students: Profile[];
    }> = {};

    allStudents.forEach(student => {
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
  }, [allStudents, studentStats]);

  // Top performing students
  const topStudents = useMemo(() => {
    return allStudents
      .map(student => ({
        ...student,
        average: getStudentAverage(student.id),
        stats: studentStats[student.id],
      }))
      .filter(s => s.average.overall > 0)
      .sort((a, b) => b.average.overall - a.average.overall)
      .slice(0, 10);
  }, [allStudents, studentStats]);

  // Loading state for statistics
  const isStatisticsLoading = allStudentsLoading || sessionsLoading || reportsLoading || locationsLoading;
  // Loading state for directory
  const isDirectoryLoading = paginatedLoading || locationsLoading;

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
          {isStatisticsLoading ? (
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
                      <p className="text-xl font-black text-gray-900">{allStudents.length}</p>
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
                            <p className="text-[10px] text-gray-500">{getSchoolName(student) || 'N/A'}</p>
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

                {/* Class Filter */}
                <div className="w-full sm:w-32">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Kelas
                  </label>
                  <select
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 focus:bg-white"
                  >
                    <option value="">Semua</option>
                    {uniqueClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stats & Reset */}
              <div className="flex items-end gap-2 w-full sm:w-auto">
                <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <span className="text-[9px] font-bold text-blue-400 uppercase block">Hasil</span>
                  <span className="text-sm font-bold text-blue-900">
                    {classFilter ? `${filteredStudents.length} / ${totalCount.toLocaleString()}` : totalCount.toLocaleString()} Siswa
                  </span>
                </div>
                {(schoolFilter || classFilter || searchQuery) && (
                  <button
                    onClick={() => { setSchoolFilter(''); setClassFilter(''); setSearchQuery(''); setCurrentPage(1); }}
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
            {isDirectoryLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-3">Siswa</th>
                        <th className="px-4 py-3">Sekolah</th>
                        <th className="px-4 py-3">Kelas</th>
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
                                {getSchoolName(student) || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-gray-600">
                                {getClassName(student) || '-'}
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
                                onClick={() => navigate(`/admin/students/${student.id}`)}
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
                          <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm italic">
                            Tidak ada siswa ditemukan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="text-xs text-gray-500">
                      Menampilkan {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalCount)} dari {totalCount.toLocaleString()} siswa
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Halaman Pertama"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Halaman Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                                currentPage === pageNum
                                  ? 'theme-bg-primary text-white'
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Halaman Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Halaman Terakhir"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}

    </div>
  );
};

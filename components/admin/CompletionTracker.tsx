import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../Card';
import { Calendar, CheckCircle2, XCircle, User, School, Loader2, ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react';
import { sessionsService } from '../../services';
import type { Profile, Location, ClassSession } from '../../lib/database.types';
import type { ClassItem } from '../../hooks/useProfiles';
import { getClassNamesForLocation } from '../../utils/teacherClasses';

type SortOption = 'incomplete-first' | 'complete-first' | 'name-asc' | 'name-desc';

interface Props {
  teachers: Profile[];
  locations: Location[];
  classes: ClassItem[];
}

interface TeacherAssignment {
  locationId: string;
  locationName: string;
  className: string;
  locationKey: string;
  hasSchedule: boolean;
  sessionCount: number;
}

interface TeacherStatus {
  teacher: Profile;
  assignments: TeacherAssignment[];
  completedCount: number;
  totalCount: number;
}

// Week calculation utilities
const getAcademicYear = (date: Date): string => {
  const month = date.getMonth();
  const year = date.getFullYear();
  return month >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

const getSemester = (date: Date): number => {
  return date.getMonth() >= 6 ? 1 : 2;
};

const getWeekInSemester = (date: Date, academicYear: string): number => {
  const semester = getSemester(date);
  const [startYear] = academicYear.split('/').map(Number);
  const semesterStart = semester === 1
    ? new Date(startYear, 6, 1)
    : new Date(startYear + 1, 0, 1);
  const diffTime = date.getTime() - semesterStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
};

const getWeekDateRange = (year: string, semester: number, week: number) => {
  const [startYear] = year.split('/').map(Number);
  const semesterStart = semester === 1
    ? new Date(startYear, 6, 1)
    : new Date(startYear + 1, 0, 1);
  const weekStart = new Date(semesterStart);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return { start: weekStart, end: weekEnd };
};

// Generate available academic years (current year +/- 2 years)
const generateAcademicYears = (): string[] => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = -2; i <= 1; i++) {
    years.push(`${currentYear + i}/${currentYear + i + 1}`);
  }
  return years;
};

// Generate weeks for a semester (approximately 26 weeks per semester)
const generateWeeks = (): number[] => {
  return Array.from({ length: 26 }, (_, i) => i + 1);
};

export const CompletionTracker: React.FC<Props> = ({ teachers, locations, classes }) => {
  const [loading, setLoading] = useState(true);
  const [weekSessions, setWeekSessions] = useState<ClassSession[]>([]);
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());

  // Current date defaults
  const today = new Date();
  const currentAcademicYear = getAcademicYear(today);
  const currentSemester = getSemester(today);
  const currentWeek = getWeekInSemester(today, currentAcademicYear);

  // Selectable filters
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(currentAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<number>(currentSemester);
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [sortOption, setSortOption] = useState<SortOption>('incomplete-first');

  // Calculate week date range based on selections
  const { start: weekStart, end: weekEnd } = useMemo(() => 
    getWeekDateRange(selectedAcademicYear, selectedSemester, selectedWeek),
    [selectedAcademicYear, selectedSemester, selectedWeek]
  );

  // Available options
  const academicYears = useMemo(() => generateAcademicYears(), []);
  const weeks = useMemo(() => generateWeeks(), []);

  // Location lookup map
  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    locations.forEach(loc => map.set(loc.id, loc.name));
    return map;
  }, [locations]);

  // Classes lookup: locationId -> Set of class names at that location
  const classesLookup = useMemo(() => {
    const lookup = new Map<string, Set<string>>();
    classes.forEach(cls => {
      if (!lookup.has(cls.location_id)) {
        lookup.set(cls.location_id, new Set());
      }
      lookup.get(cls.location_id)!.add(cls.name);
    });
    return lookup;
  }, [classes]);

  // Fetch sessions for selected week
  useEffect(() => {
    const fetchWeekSessions = async () => {
      try {
        setLoading(true);
        const sessions = await sessionsService.getByDateRange(
          weekStart.toISOString(),
          weekEnd.toISOString()
        );
        setWeekSessions(sessions);
      } catch (error) {
        console.error('Error fetching week sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeekSessions();
  }, [weekStart.toISOString(), weekEnd.toISOString()]);

  // Build session lookup: teacherId -> Set of "School - Class" strings
  const sessionLookup = useMemo(() => {
    const lookup = new Map<string, Set<string>>();
    weekSessions.forEach(session => {
      if (!lookup.has(session.teacher_id)) {
        lookup.set(session.teacher_id, new Set());
      }
      lookup.get(session.teacher_id)!.add(session.location);
    });
    return lookup;
  }, [weekSessions]);

  // Calculate teacher statuses
  const teacherStatuses: TeacherStatus[] = useMemo(() => {
    return teachers
      .filter(t => t.role === 'TEACHER' && t.status === 'ACTIVE')
      .map(teacher => {
        const assignments: TeacherAssignment[] = [];
        const teacherSessions = sessionLookup.get(teacher.id) || new Set();

        // Build assignments from teacher's assigned_location_ids + assigned_classes
        // Uses centralized utility that handles both old format (class name) and new format (location_id|class_name)
        const locationIds = teacher.assigned_location_ids || [];
        const teacherClasses = teacher.assigned_classes || [];

        locationIds.forEach(locId => {
          const locationName = locationMap.get(locId);
          if (!locationName) return;

          // Filter: only include classes that exist at this location
          const validClassesAtLocation = classesLookup.get(locId) || new Set();

          // Get class names for this specific location (handles both old and new format)
          const classNamesForLocation = getClassNamesForLocation(teacherClasses, locId);

          classNamesForLocation
            .filter(className => validClassesAtLocation.has(className))
            .forEach(className => {
              const locationKey = `${locationName} - ${className}`;
              const hasSchedule = teacherSessions.has(locationKey);
              const sessionCount = weekSessions.filter(
                s => s.teacher_id === teacher.id && s.location === locationKey
              ).length;

              assignments.push({
                locationId: locId,
                locationName,
                className,
                locationKey,
                hasSchedule,
                sessionCount
              });
            });
        });

        return {
          teacher,
          assignments,
          completedCount: assignments.filter(a => a.hasSchedule).length,
          totalCount: assignments.length
        };
      })
      .filter(status => status.totalCount > 0);
  }, [teachers, locationMap, classesLookup, sessionLookup, weekSessions]);

  // Sorted teacher statuses based on sort option
  const sortedTeacherStatuses = useMemo(() => {
    return [...teacherStatuses].sort((a, b) => {
      switch (sortOption) {
        case 'incomplete-first': {
          const rateA = a.totalCount > 0 ? a.completedCount / a.totalCount : 1;
          const rateB = b.totalCount > 0 ? b.completedCount / b.totalCount : 1;
          return rateA - rateB;
        }
        case 'complete-first': {
          const rateA = a.totalCount > 0 ? a.completedCount / a.totalCount : 1;
          const rateB = b.totalCount > 0 ? b.completedCount / b.totalCount : 1;
          return rateB - rateA;
        }
        case 'name-asc':
          return a.teacher.name.localeCompare(b.teacher.name);
        case 'name-desc':
          return b.teacher.name.localeCompare(a.teacher.name);
        default:
          return 0;
      }
    });
  }, [teacherStatuses, sortOption]);

  const toggleExpand = (teacherId: string) => {
    setExpandedTeachers(prev => {
      const next = new Set(prev);
      if (next.has(teacherId)) {
        next.delete(teacherId);
      } else {
        next.add(teacherId);
      }
      return next;
    });
  };

  // Summary stats
  const totalTeachers = teacherStatuses.length;
  const fullyCompleted = teacherStatuses.filter(t => t.completedCount === t.totalCount).length;
  const partiallyCompleted = teacherStatuses.filter(t => t.completedCount > 0 && t.completedCount < t.totalCount).length;
  const notStarted = teacherStatuses.filter(t => t.completedCount === 0).length;

  // Check if current selection matches today
  const isCurrentWeek = selectedAcademicYear === currentAcademicYear && 
                        selectedSemester === currentSemester && 
                        selectedWeek === currentWeek;

  return (
    <div className="space-y-4">
      {/* Week Info Header with Selectors */}
      <Card className="!p-4">
        <div className="flex flex-col gap-4">
          {/* Selectors Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Academic Year Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Tahun Ajaran:</label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Semester Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Semester:</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>Semester 1 (Jul-Dec)</option>
                <option value={2}>Semester 2 (Jan-Jun)</option>
              </select>
            </div>

            {/* Week Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Week:</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {weeks.map(week => (
                  <option key={week} value={week}>Week {week}</option>
                ))}
              </select>
            </div>

            {/* Reset to Current Button */}
            {!isCurrentWeek && (
              <button
                onClick={() => {
                  setSelectedAcademicYear(currentAcademicYear);
                  setSelectedSemester(currentSemester);
                  setSelectedWeek(currentWeek);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors"
              >
                ← Minggu Ini
              </button>
            )}
          </div>

          {/* Week Info & Stats Row */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  Week {selectedWeek} - Semester {selectedSemester}
                  {isCurrentWeek && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                      Current
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | {selectedAcademicYear}
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{fullyCompleted}</div>
                <div className="text-gray-500">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{partiallyCompleted}</div>
                <div className="text-gray-500">Partial</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{notStarted}</div>
                <div className="text-gray-500">Not Started</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading schedule data...</span>
        </div>
      ) : (
        /* Teacher List */
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Teacher Schedule Completion</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">{totalTeachers} teachers with class assignments</p>
            </div>
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="incomplete-first">Belum Lengkap</option>
                <option value="complete-first">Sudah Lengkap</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {sortedTeacherStatuses.map(({ teacher, assignments, completedCount, totalCount }) => {
              const isExpanded = expandedTeachers.has(teacher.id);
              const isComplete = completedCount === totalCount;
              const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              // Group assignments by location
              const assignmentsByLocation = assignments.reduce((acc, assignment) => {
                if (!acc[assignment.locationName]) {
                  acc[assignment.locationName] = [];
                }
                acc[assignment.locationName].push(assignment);
                return acc;
              }, {} as Record<string, TeacherAssignment[]>);

              return (
                <div key={teacher.id}>
                  {/* Teacher Row */}
                  <div
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(teacher.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-xs text-gray-500">{teacher.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Progress Bar */}
                      <div className="w-24 md:w-32 hidden sm:block">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isComplete ? 'bg-green-500' : completedCount > 0 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Counter */}
                      <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                        isComplete
                          ? 'bg-green-100 text-green-700'
                          : completedCount > 0
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {completedCount}/{totalCount} classes
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pl-12 bg-gray-50 space-y-3">
                      {Object.entries(assignmentsByLocation).map(([locationName, locAssignments]) => {
                        const locCompleted = locAssignments.filter(a => a.hasSchedule).length;
                        const locTotal = locAssignments.length;
                        
                        return (
                          <div key={locationName}>
                            <div className="flex items-center gap-2 mb-2">
                              <School className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-700">{locationName}</span>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                locCompleted === locTotal
                                  ? 'bg-green-100 text-green-700'
                                  : locCompleted > 0
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-red-100 text-red-700'
                              }`}>
                                {locCompleted}/{locTotal}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {locAssignments.map((assignment, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs ${
                                    assignment.hasSchedule
                                      ? 'bg-green-50 border border-green-200'
                                      : 'bg-red-50 border border-red-200'
                                  }`}
                                >
                                  {assignment.hasSchedule ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                  )}
                                  <span className={`font-medium truncate ${
                                    assignment.hasSchedule ? 'text-green-800' : 'text-red-800'
                                  }`}>
                                    {assignment.className}
                                  </span>
                                  {assignment.hasSchedule && assignment.sessionCount > 1 && (
                                    <span className="ml-auto text-green-700 font-bold text-[10px]">
                                      {assignment.sessionCount}x
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {sortedTeacherStatuses.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No teachers with class assignments found.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

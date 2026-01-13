import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { useAuth } from '../../contexts/AuthContext';
import { useSessions } from '../../hooks/useSessions';
import { useLocations } from '../../hooks/useProfiles';
import {
  CalendarDays,
  Search,
  Loader2,
  School,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';

// Date formatting helpers
const formatDate = (date: Date, format: string): string => {
  if (format === 'MMMM yyyy') {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  if (format === 'd MMM yyyy') {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (format === 'HH:mm') {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return date.toLocaleDateString('id-ID');
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
};

const addMonths = (date: Date, months: number): Date => {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
};

const subMonths = (date: Date, months: number): Date => {
  return new Date(date.getFullYear(), date.getMonth() - months, 1);
};

export const SchoolTeacherSchedule: React.FC = () => {
  const { user } = useAuth();
  const { locations } = useLocations();
  const [schoolName, setSchoolName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get school info
  useEffect(() => {
    if (user?.assignedLocationId && locations.length > 0) {
      const school = locations.find((l) => l.id === user.assignedLocationId);
      if (school) {
        setSchoolName(school.name);
      }
    }
  }, [user, locations]);

  // Fetch all sessions - we'll filter for Teacher grade
  const { sessions, loading } = useSessions({
    enabled: !!schoolName,
  });

  // Filter by month and Teacher grade
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Filter sessions for Teacher training (grade contains "Teacher")
  const teacherSessions = sessions.filter((s) => {
    // Check if location matches school and grade is "Teacher" or "Teachers"
    const matchesSchool = s.location.toLowerCase().includes(schoolName.toLowerCase());
    const isTeacherGrade =
      s.location.toLowerCase().includes('teacher') ||
      (s.topic && s.topic.toLowerCase().includes('teacher training'));

    const date = new Date(s.date_time);
    const inMonth = date >= monthStart && date <= monthEnd;

    const matchesSearch =
      searchTerm === '' ||
      s.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.teacher_name && s.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSchool && isTeacherGrade && inMonth && matchesSearch;
  });

  // Sort by date
  const sortedSessions = [...teacherSessions].sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );

  if (!schoolName) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No school assigned to this account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-600" />
          Teacher Training Schedule
        </h1>
        <p className="text-sm text-gray-500 mt-1">{schoolName}</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by topic, trainer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {formatDate(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Schedule List */}
      <Card className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : sortedSessions.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No teacher training scheduled for this period</p>
            <p className="text-xs text-gray-400 mt-1">
              Teacher training sessions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg border bg-purple-50 border-purple-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{session.topic}</p>
                      <p className="text-sm text-gray-500">{session.location}</p>
                      {session.teacher_name && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{session.teacher_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          Teacher Training
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {session.skill_category}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {session.difficulty_level}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(new Date(session.date_time), 'd MMM yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(new Date(session.date_time), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Summary */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{sortedSessions.length}</p>
            <p className="text-xs text-gray-500">Teacher training sessions this month</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SchoolTeacherSchedule;

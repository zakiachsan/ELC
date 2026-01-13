import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { useAuth } from '../../contexts/AuthContext';
import { useSessions } from '../../hooks/useSessions';
import { useTests } from '../../hooks/useTests';
import { useLocations } from '../../hooks/useProfiles';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Users,
  BookOpen,
  FileText,
  Loader2,
  School,
} from 'lucide-react';

// Date formatting helpers
const formatDate = (date: Date, format: string): string => {
  const options: Intl.DateTimeFormatOptions = {};
  if (format === 'yyyy-MM-dd') {
    return date.toISOString().split('T')[0];
  }
  if (format === 'HH:mm') {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (format === 'EEEE, d MMMM yyyy') {
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (format === 'd MMM, HH:mm') {
    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dateStr}, ${timeStr}`;
  }
  return date.toLocaleDateString('id-ID');
};

export const SchoolDashboard: React.FC = () => {
  const { user } = useAuth();
  const { locations } = useLocations();
  const [schoolName, setSchoolName] = useState<string>('');

  // Get school info from user's assigned_location_id
  useEffect(() => {
    if (user?.assignedLocationId && locations.length > 0) {
      const school = locations.find((l) => l.id === user.assignedLocationId);
      if (school) {
        setSchoolName(school.name);
      }
    }
  }, [user, locations]);

  // Fetch today's sessions for this school
  const { sessions, loading: sessionsLoading } = useSessions({
    location: schoolName,
    enabled: !!schoolName,
  });

  // Fetch tests for this school
  const { tests, loading: testsLoading } = useTests({
    location: schoolName,
    enabled: !!schoolName,
  });

  // Filter for today's sessions
  const today = new Date();
  const todayStr = formatDate(today, 'yyyy-MM-dd');

  const todaySessions = sessions.filter((s) => {
    const sessionDate = formatDate(new Date(s.date_time), 'yyyy-MM-dd');
    return sessionDate === todayStr;
  });

  const todayTests = tests.filter((t) => {
    const testDate = formatDate(new Date(t.date_time), 'yyyy-MM-dd');
    return testDate === todayStr;
  });

  const upcomingTests = tests
    .filter((t) => new Date(t.date_time) > today)
    .slice(0, 5);

  const loading = sessionsLoading || testsLoading;

  if (!schoolName) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No school assigned to this account.</p>
          <p className="text-sm text-gray-400">Please contact admin to assign your school.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
            School Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">{schoolName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {formatDate(today, 'EEEE, d MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{todaySessions.length}</p>
              <p className="text-xs text-gray-500">Sessions Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{todayTests.length}</p>
              <p className="text-xs text-gray-500">Tests Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              <p className="text-xs text-gray-500">Total Sessions</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingTests.length}</p>
              <p className="text-xs text-gray-500">Upcoming Tests</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Sessions */}
        <Card className="p-4">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            Today's Sessions
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : todaySessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No sessions scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{session.topic}</p>
                      <p className="text-xs text-gray-500 mt-1">{session.location}</p>
                    </div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {formatDate(new Date(session.date_time), 'HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {session.skill_category}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {session.difficulty_level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Today's Tests & Upcoming */}
        <Card className="p-4">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-600" />
            Tests & Exams
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Today's Tests */}
              {todayTests.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                    Today
                  </p>
                  <div className="space-y-2">
                    {todayTests.map((test) => (
                      <div
                        key={test.id}
                        className="p-3 bg-red-50 rounded-lg border border-red-100"
                      >
                        <p className="font-medium text-gray-900 text-sm">{test.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">{test.class_name}</span>
                          <span className="text-xs text-red-600">
                            {formatDate(new Date(test.date_time), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Tests */}
              {upcomingTests.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Upcoming
                  </p>
                  <div className="space-y-2">
                    {upcomingTests.map((test) => (
                      <div
                        key={test.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <p className="font-medium text-gray-900 text-sm">{test.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">{test.class_name}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(new Date(test.date_time), 'd MMM, HH:mm')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {todayTests.length === 0 && upcomingTests.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No tests scheduled</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SchoolDashboard;

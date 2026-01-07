import React, { useState } from 'react';
import { Card } from '../Card';
import { 
  Calendar, Clock, User as UserIcon, BookOpen, MapPin, Eye, Filter, 
  School, Loader2, FileText, CheckCircle, AlertCircle, ChevronRight
} from 'lucide-react';
import { useTests } from '../../hooks/useTests';
import { useTeachers, useLocations } from '../../hooks/useProfiles';
import { TestSchedule } from '../../services/tests.service';

const TEST_TYPE_LABELS: Record<string, string> = {
  'QUIZ': 'Quiz',
  'MID_SEMESTER': 'Mid Semester',
  'FINAL_SEMESTER': 'Final Semester',
};

const TEST_TYPE_COLORS: Record<string, string> = {
  'QUIZ': 'bg-blue-50 text-blue-700 border-blue-200',
  'MID_SEMESTER': 'bg-purple-50 text-purple-700 border-purple-200',
  'FINAL_SEMESTER': 'bg-orange-50 text-orange-700 border-orange-200',
};

export const TestScheduleManager: React.FC = () => {
  const { tests: testsData, loading: testsLoading, error: testsError } = useTests();
  const { profiles: teachersData, loading: teachersLoading } = useTeachers();
  const { locations: locationsData, loading: locationsLoading } = useLocations();

  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedTestType, setSelectedTestType] = useState<string>('all');
  const [selectedTest, setSelectedTest] = useState<TestSchedule | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const teachers = teachersData.map(t => ({
    id: t.id,
    name: t.name,
    role: t.role,
  }));

  const schools = locationsData.map(l => ({
    id: l.id,
    name: l.name,
  }));

  // Filter tests based on selected filters
  let filteredTests = [...testsData];

  if (selectedLocation !== 'all') {
    filteredTests = filteredTests.filter(t => t.location === selectedLocation);
  }

  if (selectedTeacher !== 'all') {
    filteredTests = filteredTests.filter(t => t.teacher_id === selectedTeacher);
  }

  if (selectedTestType !== 'all') {
    filteredTests = filteredTests.filter(t => t.test_type === selectedTestType);
  }

  // Split into upcoming and past
  const now = new Date();
  const upcomingTests = filteredTests
    .filter(t => new Date(t.date_time) >= now)
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

  const pastTests = filteredTests
    .filter(t => new Date(t.date_time) < now)
    .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

  const displayedTests = activeTab === 'upcoming' ? upcomingTests : pastTests;

  const getTeacherName = (id: string | null) => {
    if (!id) return 'Unknown Teacher';
    return teachers.find(t => t.id === id)?.name || 'Unknown Teacher';
  };

  const getTestStatus = (test: TestSchedule) => {
    const testDate = new Date(test.date_time);
    if (testDate > now) {
      if (test.has_online_test && test.is_published) {
        return { label: 'Published', color: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle };
      }
      if (test.has_online_test) {
        return { label: 'Has Questions', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: FileText };
      }
      return { label: 'Scheduled', color: 'bg-gray-50 text-gray-700 border-gray-100', icon: Calendar };
    }
    return { label: 'Completed', color: 'bg-gray-50 text-gray-500 border-gray-100', icon: CheckCircle };
  };

  if (testsLoading || teachersLoading || locationsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading test schedules...</span>
      </div>
    );
  }

  if (testsError) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <span className="ml-2 text-sm text-red-500">Error loading test schedules</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Test Schedule</h2>
          <p className="text-xs text-gray-500 mt-0.5">View all tests scheduled by teachers</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">
            {upcomingTests.length} Upcoming
          </span>
          <span className="px-2 py-1 rounded bg-gray-50 text-gray-600 font-medium">
            {pastTests.length} Past
          </span>
        </div>
      </div>

      {/* Filters - Compact inline layout */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-xs font-medium hidden sm:inline">Filter:</span>
        </div>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 min-w-[120px]"
        >
          <option value="all">All Schools</option>
          {schools.map(school => (
            <option key={school.id} value={school.name}>{school.name}</option>
          ))}
        </select>
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 min-w-[120px]"
        >
          <option value="all">All Teachers</option>
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
        <select
          value={selectedTestType}
          onChange={(e) => setSelectedTestType(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 min-w-[100px]"
        >
          <option value="all">All Types</option>
          <option value="QUIZ">Quiz</option>
          <option value="MID_SEMESTER">Mid Semester</option>
          <option value="FINAL_SEMESTER">Final Semester</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming ({upcomingTests.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'past'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Past ({pastTests.length})
        </button>
      </div>

      {/* Test List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {displayedTests.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500 text-sm">
            No {activeTab} tests found
          </div>
        ) : (
          displayedTests.map(test => {
            const status = getTestStatus(test);
            const StatusIcon = status.icon;
            return (
              <Card
                key={test.id}
                className={`p-3 hover:shadow-md transition-shadow cursor-pointer border ${
                  selectedTest?.id === test.id ? 'ring-2 ring-teal-500 border-teal-200' : ''
                }`}
                onClick={() => setSelectedTest(selectedTest?.id === test.id ? null : test)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${TEST_TYPE_COLORS[test.test_type]}`}>
                        {TEST_TYPE_LABELS[test.test_type]}
                        {test.test_type === 'QUIZ' && test.quiz_number && ` #${test.quiz_number}`}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {status.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 truncate">{test.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{test.description || 'No description'}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${selectedTest?.id === test.id ? 'rotate-90' : ''}`} />
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {new Date(test.date_time).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {new Date(test.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {test.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <UserIcon className="w-3 h-3 text-gray-400" />
                    {getTeacherName(test.teacher_id)}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedTest?.id === test.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Class:</span>
                        <span className="ml-1 font-medium text-gray-700">{test.class_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-1 font-medium text-gray-700">{test.duration_minutes} mins</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Academic Year:</span>
                        <span className="ml-1 font-medium text-gray-700">{test.academic_year}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Semester:</span>
                        <span className="ml-1 font-medium text-gray-700">{test.semester}</span>
                      </div>
                    </div>
                    {test.materials && test.materials.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Materials:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {test.materials.map((material, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                              {material}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {test.has_online_test && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <FileText className="w-3 h-3 text-blue-500" />
                        <span className="text-blue-600 font-medium">Online test available</span>
                        {test.is_published && (
                          <span className="text-green-600 font-medium">• Published</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TestScheduleManager;

import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { useLocations } from '../../hooks/useProfiles';
import { useTeachersOfTheMonth } from '../../hooks/useSchoolTeacherReviews';
import { useSettings } from '../../contexts/SettingsContext';
import { SCHOOL_RATING_LABELS, getCurrentReviewMonth } from '../../services/schoolTeacherReviews.service';
import {
  Award,
  Star,
  Loader2,
  Building2,
  ChevronLeft,
  ChevronRight,
  User,
  Trophy,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
} from 'lucide-react';
// Date formatting helpers
const formatDate = (date: Date, format: string): string => {
  if (format === 'MMMM yyyy') {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  if (format === 'yyyy-MM-01') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }
  return date.toLocaleDateString('id-ID');
};

const addMonths = (date: Date, months: number): Date => {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
};

const subMonths = (date: Date, months: number): Date => {
  return new Date(date.getFullYear(), date.getMonth() - months, 1);
};

export const TeacherOfTheMonthAdmin: React.FC = () => {
  const { locations } = useLocations();
  const { settings, updateSettings } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const monthStr = formatDate(selectedMonth, 'yyyy-MM-01');
  const { teachers, loading, refetch } = useTeachersOfTheMonth(monthStr);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter teachers by selected school
  const filteredTeachers = selectedSchoolId
    ? teachers.filter((t) => t.school?.id === selectedSchoolId)
    : teachers;

  // Get unique schools from teachers
  const schoolsWithReviews = Array.from(
    new Map(teachers.filter((t) => t.school).map((t) => [t.school!.id, t.school!])).values()
  );

  const handleToggleHomepage = async () => {
    setUpdatingSettings(true);
    try {
      await updateSettings({ showTeacherOfMonth: !settings.showTeacherOfMonth });
    } catch (err) {
      console.error('Error updating settings:', err);
    } finally {
      setUpdatingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Teacher of the Month
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage teacher rankings across all schools</p>
        </div>
        <button
          onClick={() => setShowSettingsPanel(!showSettingsPanel)}
          className={`p-2 rounded-lg transition-colors ${
            showSettingsPanel ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettingsPanel && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.showTeacherOfMonth ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Show on Homepage</p>
                <p className="text-sm text-gray-500">
                  {settings.showTeacherOfMonth
                    ? 'Teacher of the Month section is visible on the homepage'
                    : 'Teacher of the Month section is hidden from the homepage'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleHomepage}
              disabled={updatingSettings}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                settings.showTeacherOfMonth
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } disabled:opacity-50`}
            >
              {updatingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : settings.showTeacherOfMonth ? (
                'Hide'
              ) : (
                'Show'
              )}
            </button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* School Filter */}
          <div className="flex items-center gap-3 flex-1">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Schools</option>
              {locations
                .filter((l) => l.name && !l.name.includes('Online'))
                .map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {formatDate(selectedMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredTeachers.length}</p>
              <p className="text-xs text-gray-500">Teachers Reviewed</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{schoolsWithReviews.length}</p>
              <p className="text-xs text-gray-500">Schools Participating</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTeachers.length > 0
                  ? (filteredTeachers.reduce((sum, t) => sum + t.average_rating, 0) / filteredTeachers.length).toFixed(1)
                  : '-'}
              </p>
              <p className="text-xs text-gray-500">Average Rating</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTeachers.reduce((sum, t) => sum + t.review_count, 0)}
              </p>
              <p className="text-xs text-gray-500">Total Reviews</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card className="p-4">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Teacher Rankings - {formatDate(selectedMonth, 'MMMM yyyy')}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reviews found for this period</p>
            <p className="text-xs text-gray-400 mt-1">
              Reviews are submitted by schools between 25th-31st of each month
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Teacher</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">School</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Reviews</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher, index) => (
                  <React.Fragment key={teacher.teacher_id}>
                    <tr
                      className={`border-b border-gray-50 hover:bg-gray-50 ${
                        index < 3 ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? 'bg-amber-500 text-white'
                              : index === 1
                              ? 'bg-gray-400 text-white'
                              : index === 2
                              ? 'bg-orange-400 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {teacher.teacher.photo_url ? (
                            <img
                              src={teacher.teacher.photo_url}
                              alt={teacher.teacher.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{teacher.teacher.name}</p>
                            <p className="text-xs text-gray-500">{teacher.teacher.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-gray-600">{teacher.school?.name || '-'}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-sm font-medium text-gray-900">{teacher.review_count}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-lg font-bold text-gray-900">
                            {teacher.average_rating.toFixed(1)}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded details for top 3 */}
                    {index < 3 && (
                      <tr className="bg-amber-50/20">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 text-xs">
                            {Object.entries(SCHOOL_RATING_LABELS).map(([key, label]) => {
                              const avgKey = key.replace('_rating', '_avg') as keyof typeof teacher;
                              return (
                                <div key={key} className="text-center p-2 bg-white rounded border border-gray-100">
                                  <p className="text-gray-500 truncate text-[10px]" title={label}>
                                    {label.split(' ').slice(0, 1).join(' ')}
                                  </p>
                                  <p className="font-bold text-gray-900 mt-1">
                                    {(teacher[avgKey] as number)?.toFixed(1) || '-'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Rating Criteria Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Rating Criteria</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(SCHOOL_RATING_LABELS).map(([key, label]) => (
            <div key={key} className="text-xs p-2 bg-gray-50 rounded">
              <p className="text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TeacherOfTheMonthAdmin;

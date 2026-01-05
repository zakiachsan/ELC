import React, { useState, useMemo } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { useTeacherReviews, useTeacherAverages } from '../../hooks/useTeacherReviews';
import { useTeachers } from '../../hooks/useProfiles';
import {
  TeacherReview,
  RATING_LABELS,
  getCurrentReviewMonth,
  calculateAverageRating,
} from '../../services/teacherReviews.service';
import {
  Star,
  Calendar,
  User,
  Users,
  ChevronRight,
  Loader2,
  Award,
  TrendingUp,
  MessageSquare,
  Filter,
  Search,
  GraduationCap,
  BarChart3,
} from 'lucide-react';

// Star Rating Display Component
const RatingDisplay: React.FC<{ value: number; size?: 'sm' | 'md' }> = ({ value, size = 'sm' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${
          star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))}
  </div>
);

// Rating Bar Component
const RatingBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-600 w-48 truncate">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="bg-yellow-400 h-full rounded-full transition-all"
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
    <span className="text-xs font-bold text-gray-700 w-8 text-right">{value.toFixed(1)}</span>
  </div>
);

export const ReviewManager: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentReviewMonth());
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<'ALL' | 'STUDENT' | 'PARENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { reviews, loading: reviewsLoading } = useTeacherReviews({ reviewMonth: selectedMonth });
  const { averages, loading: averagesLoading } = useTeacherAverages(selectedMonth);
  const { profiles: teachers, loading: teachersLoading } = useTeachers();

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      options.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      });
    }
    return options;
  }, []);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    let result = reviews;

    if (selectedTeacher) {
      result = result.filter((r) => r.teacher_id === selectedTeacher);
    }

    if (filterRole !== 'ALL') {
      result = result.filter((r) => r.reviewer_role === filterRole);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.teacher as any)?.name?.toLowerCase().includes(query) ||
          (r.reviewer as any)?.name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [reviews, selectedTeacher, filterRole, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const studentReviews = reviews.filter((r) => r.reviewer_role === 'STUDENT');
    const parentReviews = reviews.filter((r) => r.reviewer_role === 'PARENT');

    return {
      totalReviews: reviews.length,
      studentReviews: studentReviews.length,
      parentReviews: parentReviews.length,
      averageRating:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + calculateAverageRating(r), 0) / reviews.length
          : 0,
    };
  }, [reviews]);

  // Get selected teacher details and their reviews
  const selectedTeacherData = useMemo(() => {
    if (!selectedTeacher) return null;

    const teacher = teachers.find((t) => t.id === selectedTeacher);
    const teacherReviews = filteredReviews.filter((r) => r.teacher_id === selectedTeacher);

    // Calculate average ratings per category
    const categoryAverages = {
      technology_rating: 0,
      punctuality_rating: 0,
      material_quality_rating: 0,
      english_encouragement_rating: 0,
      teaching_topics_rating: 0,
      pedagogic_rating: 0,
    };

    if (teacherReviews.length > 0) {
      Object.keys(categoryAverages).forEach((key) => {
        categoryAverages[key as keyof typeof categoryAverages] =
          teacherReviews.reduce((sum, r) => sum + r[key as keyof typeof categoryAverages], 0) /
          teacherReviews.length;
      });
    }

    return {
      teacher,
      reviews: teacherReviews,
      categoryAverages,
      overallAverage:
        teacherReviews.length > 0
          ? teacherReviews.reduce((sum, r) => sum + calculateAverageRating(r), 0) /
            teacherReviews.length
          : 0,
    };
  }, [selectedTeacher, teachers, filteredReviews]);

  if (reviewsLoading || averagesLoading || teachersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading reviews...</span>
      </div>
    );
  }

  // Teacher Detail View
  if (selectedTeacher && selectedTeacherData) {
    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setSelectedTeacher(null)}
            className="text-xs py-1.5 px-3"
          >
            Kembali
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detail Review Guru</h2>
            <p className="text-xs text-gray-500">
              {selectedTeacherData.teacher?.name} -{' '}
              {new Date(selectedMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Teacher Overview */}
        <Card className="!p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                {selectedTeacherData.teacher?.name?.charAt(0) || 'T'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedTeacherData.teacher?.name}</h3>
                <p className="text-sm text-gray-500">{selectedTeacherData.teacher?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <RatingDisplay value={Math.round(selectedTeacherData.overallAverage)} size="md" />
                  <span className="text-sm font-bold text-gray-700">
                    {selectedTeacherData.overallAverage.toFixed(1)} / 5.0
                  </span>
                  <span className="text-xs text-gray-500">
                    ({selectedTeacherData.reviews.length} review)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Rating Breakdown */}
        <Card className="!p-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Rating per Kategori
          </h4>
          <div className="space-y-3">
            {Object.entries(RATING_LABELS).map(([key, label]) => (
              <RatingBar
                key={key}
                label={label}
                value={selectedTeacherData.categoryAverages[key as keyof typeof selectedTeacherData.categoryAverages]}
              />
            ))}
          </div>
        </Card>

        {/* Filter by Role */}
        <div className="flex gap-2">
          {(['ALL', 'STUDENT', 'PARENT'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterRole === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {role === 'ALL' ? 'Semua' : role === 'STUDENT' ? 'Siswa' : 'Orang Tua'}
            </button>
          ))}
        </div>

        {/* Individual Reviews */}
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Review Individual ({filteredReviews.filter((r) => r.teacher_id === selectedTeacher).length})
            </h4>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filteredReviews
              .filter((r) => r.teacher_id === selectedTeacher)
              .map((review) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                      {(review.reviewer as any)?.name?.charAt(0) || 'R'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">
                          {(review.reviewer as any)?.name || 'Anonymous'}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            review.reviewer_role === 'STUDENT'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : 'bg-purple-50 text-purple-600 border border-purple-200'
                          }`}
                        >
                          {review.reviewer_role === 'STUDENT' ? 'Siswa' : 'Orang Tua'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <RatingDisplay value={Math.round(calculateAverageRating(review))} />
                        <span className="text-xs text-gray-500">
                          {calculateAverageRating(review).toFixed(1)}
                        </span>
                      </div>
                      {review.comments && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          "{review.comments}"
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(review.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            {filteredReviews.filter((r) => r.teacher_id === selectedTeacher).length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">Tidak ada review</div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Main List View
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Review Guru
          </h2>
          <p className="text-xs text-gray-500">
            Lihat semua review dari siswa dan orang tua
          </p>
        </div>

        {/* Month Selector */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Total Review</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalReviews}</p>
            </div>
          </div>
        </Card>

        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Star className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Rata-rata</p>
              <p className="text-lg font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Dari Siswa</p>
              <p className="text-lg font-bold text-gray-900">{stats.studentReviews}</p>
            </div>
          </div>
        </Card>

        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Dari Ortu</p>
              <p className="text-lg font-bold text-gray-900">{stats.parentReviews}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama guru atau reviewer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Teacher Rankings */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> Peringkat Guru
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {averages.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              Belum ada review untuk periode ini
            </div>
          ) : (
            averages
              .sort((a, b) => b.averageRating - a.averageRating)
              .map((item, index) => (
                <div
                  key={item.teacherId}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTeacher(item.teacherId)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                          ? 'bg-gray-100 text-gray-600'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {item.teacher?.name?.charAt(0) || 'T'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {item.teacher?.name || 'Teacher'}
                      </h4>
                      <p className="text-xs text-gray-500">{item.reviewCount} review</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RatingDisplay value={Math.round(item.averageRating)} />
                      <span className="text-sm font-bold text-gray-700">{item.averageRating.toFixed(1)}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </Card>

      {/* All Reviews (Filtered) */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Semua Review ({filteredReviews.length})
          </h3>
          <div className="flex gap-1">
            {(['ALL', 'STUDENT', 'PARENT'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                  filterRole === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {role === 'ALL' ? 'Semua' : role === 'STUDENT' ? 'Siswa' : 'Ortu'}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {filteredReviews.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Tidak ada review</div>
          ) : (
            filteredReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedTeacher(review.teacher_id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                    {(review.reviewer as any)?.name?.charAt(0) || 'R'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">
                        {(review.reviewer as any)?.name || 'Anonymous'}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          review.reviewer_role === 'STUDENT'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-purple-50 text-purple-600 border border-purple-200'
                        }`}
                      >
                        {review.reviewer_role === 'STUDENT' ? 'Siswa' : 'Ortu'}
                      </span>
                      <span className="text-[9px] text-gray-400">untuk</span>
                      <span className="font-bold text-blue-600 text-sm">
                        {(review.teacher as any)?.name || 'Teacher'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <RatingDisplay value={Math.round(calculateAverageRating(review))} />
                      <span className="text-xs text-gray-500">
                        {calculateAverageRating(review).toFixed(1)}
                      </span>
                    </div>
                    {review.comments && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        "{review.comments}"
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReviewManager;

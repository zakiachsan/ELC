import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { useAuth } from '../../contexts/AuthContext';
import { useLocations } from '../../hooks/useProfiles';
import {
  useSchoolTeacherReviews,
  useTeacherAverages,
  useTeachersAtSchool,
} from '../../hooks/useSchoolTeacherReviews';
import {
  SCHOOL_RATING_LABELS,
  isReviewPeriod,
  getDaysUntilReviewEnd,
  getCurrentReviewMonth,
  SchoolTeacherReviewInsert,
} from '../../services/schoolTeacherReviews.service';
import {
  Award,
  Star,
  Loader2,
  School,
  AlertCircle,
  CheckCircle,
  User,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Calendar,
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

type TabType = 'review' | 'rankings';

export const SchoolTeacherOfTheMonth: React.FC = () => {
  const { user } = useAuth();
  const { locations } = useLocations();
  const [schoolId, setSchoolId] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('review');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Review form state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [ratings, setRatings] = useState<Record<string, number>>({
    academic_expertise_rating: 5,
    communication_rating: 5,
    empathy_rating: 5,
    collaboration_rating: 5,
    dedication_rating: 5,
    flexibility_rating: 5,
    classroom_management_rating: 5,
    creativity_rating: 5,
    integrity_rating: 5,
    inclusive_education_rating: 5,
  });
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get school info
  useEffect(() => {
    if (user?.assignedLocationId && locations.length > 0) {
      const school = locations.find((l) => l.id === user.assignedLocationId);
      if (school) {
        setSchoolId(school.id);
        setSchoolName(school.name);
      }
    }
  }, [user, locations]);

  // Hooks
  const { teachers: teachersAtSchool, loading: loadingTeachers } = useTeachersAtSchool(schoolId);
  const { teachers: rankedTeachers, loading: loadingRankings, refetch: refetchRankings } = useTeacherAverages(
    schoolId,
    formatDate(selectedMonth, 'yyyy-MM-01')
  );
  const { createReview, checkExistingReview } = useSchoolTeacherReviews({ enabled: false });

  const canReview = isReviewPeriod();
  const daysLeft = getDaysUntilReviewEnd();
  const currentReviewMonth = getCurrentReviewMonth();

  const handleRatingChange = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitReview = async () => {
    if (!selectedTeacherId || !user || !schoolId) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Check if already reviewed this teacher this month
      const existing = await checkExistingReview(user.id, selectedTeacherId, schoolId, currentReviewMonth);
      if (existing) {
        setSubmitError('Anda sudah memberikan review untuk guru ini bulan ini.');
        setSubmitting(false);
        return;
      }

      const review: SchoolTeacherReviewInsert = {
        teacher_id: selectedTeacherId,
        school_id: schoolId,
        reviewer_id: user.id,
        review_month: currentReviewMonth,
        academic_expertise_rating: ratings.academic_expertise_rating,
        communication_rating: ratings.communication_rating,
        empathy_rating: ratings.empathy_rating,
        collaboration_rating: ratings.collaboration_rating,
        dedication_rating: ratings.dedication_rating,
        flexibility_rating: ratings.flexibility_rating,
        classroom_management_rating: ratings.classroom_management_rating,
        creativity_rating: ratings.creativity_rating,
        integrity_rating: ratings.integrity_rating,
        inclusive_education_rating: ratings.inclusive_education_rating,
        comments: comments || null,
      };

      await createReview(review);
      setSubmitSuccess(true);
      setSelectedTeacherId('');
      setComments('');
      setRatings({
        academic_expertise_rating: 5,
        communication_rating: 5,
        empathy_rating: 5,
        collaboration_rating: 5,
        dedication_rating: 5,
        flexibility_rating: 5,
        classroom_management_rating: 5,
        creativity_rating: 5,
        integrity_rating: 5,
        inclusive_education_rating: 5,
      });
      refetchRankings();
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengirim review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!schoolId) {
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
          <Award className="w-5 h-5 text-amber-500" />
          Teacher of the Month
        </h1>
        <p className="text-sm text-gray-500 mt-1">{schoolName}</p>
      </div>

      {/* Review Period Notice */}
      <Card className={`p-4 ${canReview ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${canReview ? 'bg-green-100' : 'bg-amber-100'}`}>
            <Calendar className={`w-5 h-5 ${canReview ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
          <div>
            {canReview ? (
              <>
                <p className="font-medium text-green-800">Periode Review Aktif!</p>
                <p className="text-sm text-green-600">
                  Anda dapat memberikan review untuk guru. Sisa waktu: {daysLeft} hari lagi.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-amber-800">Periode Review Belum Dimulai</p>
                <p className="text-sm text-amber-600">
                  Review dapat dilakukan pada tanggal 25-31 setiap bulan.
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'review'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Review Guru
        </button>
        <button
          onClick={() => setActiveTab('rankings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'rankings'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Peringkat
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'review' ? (
        <Card className="p-6">
          {!canReview ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-gray-600">Review hanya dapat dilakukan pada tanggal 25-31.</p>
              <p className="text-sm text-gray-400 mt-1">Silakan kunjungi halaman ini pada periode tersebut.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              {submitSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700">Review berhasil dikirim!</p>
                </div>
              )}

              {/* Error Message */}
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700">{submitError}</p>
                </div>
              )}

              {/* Select Teacher */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Guru</label>
                {loadingTeachers ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Memuat daftar guru...</span>
                  </div>
                ) : teachersAtSchool.length === 0 ? (
                  <p className="text-sm text-gray-500">Tidak ada guru yang tersedia untuk di-review.</p>
                ) : (
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Pilih Guru --</option>
                    {teachersAtSchool.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Rating Criteria */}
              {selectedTeacherId && (
                <>
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-gray-700">Penilaian (Skala 1-10)</p>
                    {Object.entries(SCHOOL_RATING_LABELS).map(([key, label]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-600">{label}</label>
                          <span className="text-sm font-bold text-amber-600">{ratings[key]}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={ratings[key]}
                          onChange={(e) => handleRatingChange(key, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>1</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Komentar (Opsional)
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                      placeholder="Tulis komentar tambahan..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="w-full py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        Kirim Review
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </Card>
      ) : (
        /* Rankings Tab */
        <div className="space-y-4">
          {/* Month Selector */}
          <Card className="p-4">
            <div className="flex items-center justify-center gap-4">
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
          </Card>

          {/* Rankings List */}
          <Card className="p-4">
            {loadingRankings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : rankedTeachers.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Belum ada review untuk bulan ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankedTeachers.map((teacher, index) => (
                  <div
                    key={teacher.teacher_id}
                    className={`p-4 rounded-lg border ${
                      index === 0
                        ? 'bg-amber-50 border-amber-200'
                        : index === 1
                        ? 'bg-gray-100 border-gray-200'
                        : index === 2
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0
                            ? 'bg-amber-500 text-white'
                            : index === 1
                            ? 'bg-gray-400 text-white'
                            : index === 2
                            ? 'bg-orange-400 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Teacher Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {teacher.teacher.photo_url ? (
                            <img
                              src={teacher.teacher.photo_url}
                              alt={teacher.teacher.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{teacher.teacher.name}</p>
                            <p className="text-xs text-gray-500">{teacher.review_count} review</p>
                          </div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                          <span className="text-xl font-bold text-gray-900">
                            {teacher.average_rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">dari 10</p>
                      </div>
                    </div>

                    {/* Detailed Ratings (expanded for top 3) */}
                    {index < 3 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                          {Object.entries(SCHOOL_RATING_LABELS).slice(0, 5).map(([key, label]) => {
                            const avgKey = key.replace('_rating', '_avg') as keyof typeof teacher;
                            return (
                              <div key={key} className="text-center p-2 bg-white rounded">
                                <p className="text-gray-500 truncate" title={label}>
                                  {label.split(' ').slice(0, 2).join(' ')}
                                </p>
                                <p className="font-bold text-gray-900">
                                  {(teacher[avgKey] as number)?.toFixed(1) || '-'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default SchoolTeacherOfTheMonth;

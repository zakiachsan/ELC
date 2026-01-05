import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTeachers } from '../../hooks/useProfiles';
import { useTeacherReviews } from '../../hooks/useTeacherReviews';
import {
  teacherReviewsService,
  TeacherReviewInsert,
  RATING_LABELS,
  getCurrentReviewMonth,
  isReviewPeriod,
  getDaysUntilReviewEnd,
  calculateAverageRating,
} from '../../services/teacherReviews.service';
import {
  Star,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  MessageSquare,
  Award,
  Bell,
} from 'lucide-react';

// Star Rating Component
const StarRating: React.FC<{
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className={`p-0.5 transition-all ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= (hoverValue || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// Rating Display Component
const RatingDisplay: React.FC<{ value: number }> = ({ value }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-3 h-3 ${
          star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))}
  </div>
);

export const TeacherReview: React.FC = () => {
  const { user } = useAuth();
  const { profiles: teachers, loading: teachersLoading } = useTeachers();
  const { reviews: myReviews, loading: reviewsLoading, createReview } = useTeacherReviews({
    reviewerId: user?.id,
  });

  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [ratings, setRatings] = useState({
    technology_rating: 0,
    punctuality_rating: 0,
    material_quality_rating: 0,
    english_encouragement_rating: 0,
    teaching_topics_rating: 0,
    pedagogic_rating: 0,
  });
  const [comments, setComments] = useState('');

  const currentMonth = getCurrentReviewMonth();
  const inReviewPeriod = isReviewPeriod();
  const daysRemaining = getDaysUntilReviewEnd();
  const monthName = new Date(currentMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Check if user already reviewed a teacher this month
  const hasReviewedTeacher = (teacherId: string) => {
    return myReviews.some(
      (r) => r.teacher_id === teacherId && r.review_month === currentMonth
    );
  };

  // Get review for a teacher
  const getReviewForTeacher = (teacherId: string) => {
    return myReviews.find(
      (r) => r.teacher_id === teacherId && r.review_month === currentMonth
    );
  };

  // Handle teacher selection
  const handleSelectTeacher = async (teacherId: string) => {
    setSelectedTeacher(teacherId);
    setSubmitError(null);
    setSubmitSuccess(false);

    // Check for existing review
    const existing = getReviewForTeacher(teacherId);
    if (existing) {
      setExistingReview(existing);
      setRatings({
        technology_rating: existing.technology_rating,
        punctuality_rating: existing.punctuality_rating,
        material_quality_rating: existing.material_quality_rating,
        english_encouragement_rating: existing.english_encouragement_rating,
        teaching_topics_rating: existing.teaching_topics_rating,
        pedagogic_rating: existing.pedagogic_rating,
      });
      setComments(existing.comments || '');
    } else {
      setExistingReview(null);
      setRatings({
        technology_rating: 0,
        punctuality_rating: 0,
        material_quality_rating: 0,
        english_encouragement_rating: 0,
        teaching_topics_rating: 0,
        pedagogic_rating: 0,
      });
      setComments('');
    }
    setShowReviewForm(true);
  };

  // Handle rating change
  const handleRatingChange = (field: keyof typeof ratings, value: number) => {
    setRatings((prev) => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validate all ratings are filled
    const allRated = Object.values(ratings).every((r: number) => r > 0);
    if (!allRated) {
      setSubmitError('Mohon isi semua rating terlebih dahulu');
      return;
    }

    if (!selectedTeacher || !user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const reviewData: TeacherReviewInsert = {
        teacher_id: selectedTeacher,
        reviewer_id: user.id,
        reviewer_role: user.role === 'PARENT' ? 'PARENT' : 'STUDENT',
        review_month: currentMonth,
        ...ratings,
        comments: comments || null,
      };

      await createReview(reviewData);
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowReviewForm(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      if (err.message?.includes('duplicate')) {
        setSubmitError('Anda sudah memberikan review untuk guru ini bulan ini');
      } else {
        setSubmitError('Gagal mengirim review. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (teachersLoading || reviewsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  // Review Form Modal
  if (showReviewForm && selectedTeacher) {
    const teacher = teachers.find((t) => t.id === selectedTeacher);
    const isViewOnly = existingReview && !inReviewPeriod;

    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowReviewForm(false)}
            className="text-xs py-1.5 px-3"
          >
            Kembali
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {existingReview ? 'Review Anda' : 'Beri Review'}
            </h2>
            <p className="text-xs text-gray-500">
              {teacher?.name} - {monthName}
            </p>
          </div>
        </div>

        <Card className="!p-4">
          {/* Teacher Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              {teacher?.name?.charAt(0) || 'T'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{teacher?.name}</h3>
              <p className="text-xs text-gray-500">{teacher?.email}</p>
            </div>
          </div>

          {submitSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">Review Berhasil Dikirim!</h3>
              <p className="text-sm text-gray-500">Terima kasih atas feedback Anda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Rating Fields */}
              {Object.entries(RATING_LABELS).map(([key, label]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
                  <label className="text-sm text-gray-700 font-medium">{label}</label>
                  <StarRating
                    value={ratings[key as keyof typeof ratings]}
                    onChange={(value) => handleRatingChange(key as keyof typeof ratings, value)}
                    disabled={isViewOnly}
                  />
                </div>
              ))}

              {/* Comments */}
              <div className="pt-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Komentar Tambahan (Opsional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  disabled={isViewOnly}
                  placeholder="Berikan masukan atau saran untuk guru..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {submitError}
                </div>
              )}

              {!isViewOnly && (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Mengirim...' : existingReview ? 'Update Review' : 'Kirim Review'}
                </Button>
              )}

              {isViewOnly && (
                <div className="p-3 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-xs text-center">
                  Review hanya dapat diubah pada periode 25-31 setiap bulan
                </div>
              )}
            </div>
          )}
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
            Berikan penilaian untuk guru Anda setiap bulan
          </p>
        </div>
      </div>

      {/* Review Period Banner */}
      {inReviewPeriod ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Bell className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-green-800 text-sm">Periode Review Aktif!</h3>
            <p className="text-xs text-green-700 mt-0.5">
              Anda dapat memberikan review untuk {monthName}. {daysRemaining > 0 ? `${daysRemaining} hari tersisa.` : 'Hari terakhir!'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-800 text-sm">Periode Review Belum Dimulai</h3>
            <p className="text-xs text-blue-700 mt-0.5">
              Review dapat diberikan pada tanggal 25-31 setiap bulan
            </p>
          </div>
        </div>
      )}

      {/* Teachers List */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Daftar Guru ({teachers.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {teachers.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              Tidak ada guru yang tersedia
            </div>
          ) : (
            teachers.map((teacher) => {
              const reviewed = hasReviewedTeacher(teacher.id);
              const review = getReviewForTeacher(teacher.id);

              return (
                <div
                  key={teacher.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleSelectTeacher(teacher.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {teacher.name?.charAt(0) || 'T'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {teacher.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{teacher.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {reviewed ? (
                        <div className="flex items-center gap-2">
                          <RatingDisplay value={Math.round(calculateAverageRating(review!))} />
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            Sudah Review
                          </span>
                        </div>
                      ) : inReviewPeriod ? (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                          Belum Review
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                          -
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* My Reviews History */}
      {myReviews.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Riwayat Review Anda
            </h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {myReviews.slice(0, 10).map((review) => (
              <div key={review.id} className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                  {(review.teacher as any)?.name?.charAt(0) || 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {(review.teacher as any)?.name || 'Teacher'}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {new Date(review.review_month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold text-gray-700">
                    {calculateAverageRating(review).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TeacherReview;

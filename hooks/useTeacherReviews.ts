import { useState, useEffect, useCallback } from 'react';
import { teacherReviewsService, TeacherReview, TeacherReviewInsert, TeacherReviewUpdate, getCurrentReviewMonth } from '../services/teacherReviews.service';

interface UseTeacherReviewsOptions {
  teacherId?: string;
  reviewerId?: string;
  reviewMonth?: string;
}

export function useTeacherReviews(options: UseTeacherReviewsOptions = {}) {
  const [reviews, setReviews] = useState<TeacherReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: TeacherReview[];

      if (options.teacherId) {
        data = await teacherReviewsService.getByTeacher(options.teacherId);
      } else if (options.reviewerId) {
        data = await teacherReviewsService.getByReviewer(options.reviewerId);
      } else if (options.reviewMonth) {
        data = await teacherReviewsService.getByMonth(options.reviewMonth);
      } else {
        data = await teacherReviewsService.getAll();
      }

      setReviews(data);
    } catch (err) {
      console.error('Error fetching teacher reviews:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch reviews'));
    } finally {
      setLoading(false);
    }
  }, [options.teacherId, options.reviewerId, options.reviewMonth]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const createReview = async (review: TeacherReviewInsert) => {
    const created = await teacherReviewsService.create(review);
    await fetchReviews();
    return created;
  };

  const updateReview = async (id: string, updates: TeacherReviewUpdate) => {
    const updated = await teacherReviewsService.update(id, updates);
    await fetchReviews();
    return updated;
  };

  const deleteReview = async (id: string) => {
    await teacherReviewsService.delete(id);
    await fetchReviews();
  };

  const checkExistingReview = async (reviewerId: string, teacherId: string, reviewMonth?: string) => {
    return await teacherReviewsService.getExistingReview(
      reviewerId,
      teacherId,
      reviewMonth || getCurrentReviewMonth()
    );
  };

  return {
    reviews,
    loading,
    error,
    refetch: fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    checkExistingReview,
  };
}

// Hook for teacher averages
export function useTeacherAverages(reviewMonth?: string) {
  const [averages, setAverages] = useState<Array<{
    teacherId: string;
    teacher: any;
    averageRating: number;
    reviewCount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAverages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherReviewsService.getTeacherAveragesForMonth(
        reviewMonth || getCurrentReviewMonth()
      );
      setAverages(data);
    } catch (err) {
      console.error('Error fetching teacher averages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch averages'));
    } finally {
      setLoading(false);
    }
  }, [reviewMonth]);

  useEffect(() => {
    fetchAverages();
  }, [fetchAverages]);

  return {
    averages,
    loading,
    error,
    refetch: fetchAverages,
  };
}

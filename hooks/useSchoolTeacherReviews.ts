import { useState, useEffect, useCallback } from 'react';
import {
  schoolTeacherReviewsService,
  SchoolTeacherReview,
  SchoolTeacherReviewInsert,
  SchoolTeacherReviewUpdate,
  TeacherWithAverage,
  getCurrentReviewMonth,
} from '../services/schoolTeacherReviews.service';

interface UseSchoolTeacherReviewsOptions {
  schoolId?: string;
  teacherId?: string;
  reviewMonth?: string;
  enabled?: boolean;
}

export function useSchoolTeacherReviews(options: UseSchoolTeacherReviewsOptions = {}) {
  const { schoolId, teacherId, reviewMonth, enabled = true } = options;
  const [reviews, setReviews] = useState<SchoolTeacherReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let data: SchoolTeacherReview[];

      if (schoolId) {
        data = await schoolTeacherReviewsService.getBySchool(schoolId);
      } else if (teacherId) {
        data = await schoolTeacherReviewsService.getByTeacher(teacherId);
      } else if (reviewMonth) {
        data = await schoolTeacherReviewsService.getByMonth(reviewMonth);
      } else {
        data = await schoolTeacherReviewsService.getAll();
      }

      setReviews(data);
    } catch (err) {
      console.error('Error fetching school teacher reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [schoolId, teacherId, reviewMonth, enabled]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const createReview = useCallback(async (review: SchoolTeacherReviewInsert) => {
    try {
      const newReview = await schoolTeacherReviewsService.create(review);
      setReviews((prev) => [newReview, ...prev]);
      return newReview;
    } catch (err) {
      console.error('Error creating review:', err);
      throw err;
    }
  }, []);

  const updateReview = useCallback(async (id: string, updates: SchoolTeacherReviewUpdate) => {
    try {
      const updated = await schoolTeacherReviewsService.update(id, updates);
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err) {
      console.error('Error updating review:', err);
      throw err;
    }
  }, []);

  const deleteReview = useCallback(async (id: string) => {
    try {
      await schoolTeacherReviewsService.delete(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error deleting review:', err);
      throw err;
    }
  }, []);

  const checkExistingReview = useCallback(
    async (reviewerId: string, teacherId: string, schoolId: string, month?: string) => {
      const reviewMonth = month || getCurrentReviewMonth();
      return schoolTeacherReviewsService.getExistingReview(reviewerId, teacherId, schoolId, reviewMonth);
    },
    []
  );

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

// Hook for getting teachers with averages (for rankings)
export function useTeacherAverages(schoolId: string, reviewMonth?: string) {
  const [teachers, setTeachers] = useState<TeacherWithAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAverages = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await schoolTeacherReviewsService.getTeachersWithAverages(schoolId, reviewMonth);
      setTeachers(data);
    } catch (err) {
      console.error('Error fetching teacher averages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch teacher averages');
    } finally {
      setLoading(false);
    }
  }, [schoolId, reviewMonth]);

  useEffect(() => {
    fetchAverages();
  }, [fetchAverages]);

  return {
    teachers,
    loading,
    error,
    refetch: fetchAverages,
  };
}

// Hook for getting teachers of the month (for homepage)
export function useTeachersOfTheMonth(reviewMonth?: string) {
  const [teachers, setTeachers] = useState<TeacherWithAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await schoolTeacherReviewsService.getTeachersOfTheMonth(reviewMonth);
      setTeachers(data);
    } catch (err) {
      console.error('Error fetching teachers of the month:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch teachers of the month');
    } finally {
      setLoading(false);
    }
  }, [reviewMonth]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return {
    teachers,
    loading,
    error,
    refetch: fetchTeachers,
  };
}

// Hook for getting teachers at a school (for review form)
export function useTeachersAtSchool(schoolId: string | undefined) {
  const [teachers, setTeachers] = useState<{ id: string; name: string; email: string; photo_url: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await schoolTeacherReviewsService.getTeachersAtSchool(schoolId);
      setTeachers(data);
    } catch (err) {
      console.error('Error fetching teachers at school:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return {
    teachers,
    loading,
    error,
    refetch: fetchTeachers,
  };
}

export default useSchoolTeacherReviews;

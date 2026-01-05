import { supabase, supabaseAdmin } from '../lib/supabase';

export interface TeacherReview {
  id: string;
  teacher_id: string;
  reviewer_id: string;
  reviewer_role: 'STUDENT' | 'PARENT';
  review_month: string;
  technology_rating: number;
  punctuality_rating: number;
  material_quality_rating: number;
  english_encouragement_rating: number;
  teaching_topics_rating: number;
  pedagogic_rating: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  teacher?: {
    id: string;
    name: string;
    email: string;
    photo_url: string | null;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface TeacherReviewInsert {
  teacher_id: string;
  reviewer_id: string;
  reviewer_role: 'STUDENT' | 'PARENT';
  review_month: string;
  technology_rating: number;
  punctuality_rating: number;
  material_quality_rating: number;
  english_encouragement_rating: number;
  teaching_topics_rating: number;
  pedagogic_rating: number;
  comments?: string | null;
}

export interface TeacherReviewUpdate {
  technology_rating?: number;
  punctuality_rating?: number;
  material_quality_rating?: number;
  english_encouragement_rating?: number;
  teaching_topics_rating?: number;
  pedagogic_rating?: number;
  comments?: string | null;
}

// Rating labels in Indonesian
export const RATING_LABELS = {
  technology_rating: 'Teknologi dalam Pengajaran',
  punctuality_rating: 'Ketepatan Waktu Mengajar',
  material_quality_rating: 'Kualitas Materi Pembelajaran',
  english_encouragement_rating: 'Upaya Mengajak Berbicara Bahasa Inggris',
  teaching_topics_rating: 'Topik Pengajaran',
  pedagogic_rating: 'Pedagogik',
};

// Helper to get current review month (first day of current month)
export const getCurrentReviewMonth = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

// Helper to check if we're in review period (25th-31st)
export const isReviewPeriod = (): boolean => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  return dayOfMonth >= 25 && dayOfMonth <= 31;
};

// Helper to get days until review period ends
export const getDaysUntilReviewEnd = (): number => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  if (dayOfMonth >= 25) {
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return lastDay - dayOfMonth;
  }
  return 0;
};

// Calculate average rating from a review
export const calculateAverageRating = (review: TeacherReview): number => {
  const sum =
    review.technology_rating +
    review.punctuality_rating +
    review.material_quality_rating +
    review.english_encouragement_rating +
    review.teaching_topics_rating +
    review.pedagogic_rating;
  return Math.round((sum / 6) * 10) / 10;
};

export const teacherReviewsService = {
  // Get all reviews (for admin)
  async getAll() {
    const { data, error } = await supabase
      .from('teacher_reviews')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email, photo_url),
        reviewer:profiles!reviewer_id(id, name, email, role)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TeacherReview[];
  },

  // Get reviews by teacher
  async getByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('teacher_reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(id, name, email, role)
      `)
      .eq('teacher_id', teacherId)
      .order('review_month', { ascending: false });

    if (error) throw error;
    return data as TeacherReview[];
  },

  // Get reviews by reviewer
  async getByReviewer(reviewerId: string) {
    const { data, error } = await supabase
      .from('teacher_reviews')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email, photo_url)
      `)
      .eq('reviewer_id', reviewerId)
      .order('review_month', { ascending: false });

    if (error) throw error;
    return data as TeacherReview[];
  },

  // Get review by reviewer, teacher, and month (to check if already reviewed)
  async getExistingReview(reviewerId: string, teacherId: string, reviewMonth: string) {
    const { data, error } = await supabase
      .from('teacher_reviews')
      .select('*')
      .eq('reviewer_id', reviewerId)
      .eq('teacher_id', teacherId)
      .eq('review_month', reviewMonth)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data as TeacherReview | null;
  },

  // Get reviews by month (for admin)
  async getByMonth(reviewMonth: string) {
    const { data, error } = await supabase
      .from('teacher_reviews')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email, photo_url),
        reviewer:profiles!reviewer_id(id, name, email, role)
      `)
      .eq('review_month', reviewMonth)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TeacherReview[];
  },

  // Get teacher average ratings for a specific month
  async getTeacherAveragesForMonth(reviewMonth: string) {
    const { data, error } = await supabase
      .from('teacher_reviews')
      .select(`
        teacher_id,
        technology_rating,
        punctuality_rating,
        material_quality_rating,
        english_encouragement_rating,
        teaching_topics_rating,
        pedagogic_rating,
        teacher:profiles!teacher_id(id, name, email, photo_url)
      `)
      .eq('review_month', reviewMonth);

    if (error) throw error;

    // Group by teacher and calculate averages
    const teacherRatings: Record<string, {
      teacher: any;
      ratings: number[];
      count: number;
    }> = {};

    data?.forEach((review: any) => {
      if (!teacherRatings[review.teacher_id]) {
        teacherRatings[review.teacher_id] = {
          teacher: review.teacher,
          ratings: [],
          count: 0,
        };
      }
      const avg = (
        review.technology_rating +
        review.punctuality_rating +
        review.material_quality_rating +
        review.english_encouragement_rating +
        review.teaching_topics_rating +
        review.pedagogic_rating
      ) / 6;
      teacherRatings[review.teacher_id].ratings.push(avg);
      teacherRatings[review.teacher_id].count++;
    });

    return Object.entries(teacherRatings).map(([teacherId, data]) => ({
      teacherId,
      teacher: data.teacher,
      averageRating: Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10,
      reviewCount: data.count,
    }));
  },

  // Create review
  async create(review: TeacherReviewInsert) {
    const { data, error } = await supabaseAdmin
      .from('teacher_reviews')
      .insert(review as any)
      .select()
      .single();

    if (error) throw error;
    return data as TeacherReview;
  },

  // Update review
  async update(id: string, updates: TeacherReviewUpdate) {
    const { data, error } = await supabaseAdmin
      .from('teacher_reviews')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TeacherReview;
  },

  // Delete review
  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('teacher_reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export default teacherReviewsService;

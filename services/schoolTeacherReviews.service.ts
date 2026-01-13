import { supabase, supabaseAdmin } from '../lib/supabase';

export interface SchoolTeacherReview {
  id: string;
  teacher_id: string;
  school_id: string;
  reviewer_id: string;
  review_month: string;
  academic_expertise_rating: number;
  communication_rating: number;
  empathy_rating: number;
  collaboration_rating: number;
  dedication_rating: number;
  flexibility_rating: number;
  classroom_management_rating: number;
  creativity_rating: number;
  integrity_rating: number;
  inclusive_education_rating: number;
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
  school?: {
    id: string;
    name: string;
  };
  reviewer?: {
    id: string;
    name: string;
  };
}

export interface SchoolTeacherReviewInsert {
  teacher_id: string;
  school_id: string;
  reviewer_id: string;
  review_month: string;
  academic_expertise_rating: number;
  communication_rating: number;
  empathy_rating: number;
  collaboration_rating: number;
  dedication_rating: number;
  flexibility_rating: number;
  classroom_management_rating: number;
  creativity_rating: number;
  integrity_rating: number;
  inclusive_education_rating: number;
  comments?: string | null;
}

export interface SchoolTeacherReviewUpdate {
  academic_expertise_rating?: number;
  communication_rating?: number;
  empathy_rating?: number;
  collaboration_rating?: number;
  dedication_rating?: number;
  flexibility_rating?: number;
  classroom_management_rating?: number;
  creativity_rating?: number;
  integrity_rating?: number;
  inclusive_education_rating?: number;
  comments?: string | null;
}

// Rating labels in Indonesian (10 criteria, scale 1-10)
export const SCHOOL_RATING_LABELS = {
  academic_expertise_rating: 'Keahlian akademis yang unggul',
  communication_rating: 'Komunikasi yang efektif',
  empathy_rating: 'Empati',
  collaboration_rating: 'Kolaborasi',
  dedication_rating: 'Semangat dan dedikasi',
  flexibility_rating: 'Fleksibilitas',
  classroom_management_rating: 'Manajemen kelas yang baik',
  creativity_rating: 'Kreativitas dan inovasi',
  integrity_rating: 'Integritas dan etika profesional',
  inclusive_education_rating: 'Pemahaman terhadap prinsip pendidikan inklusif',
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

// Calculate average rating from a review (10 criteria, scale 1-10)
export const calculateAverageRating = (review: SchoolTeacherReview): number => {
  const sum =
    review.academic_expertise_rating +
    review.communication_rating +
    review.empathy_rating +
    review.collaboration_rating +
    review.dedication_rating +
    review.flexibility_rating +
    review.classroom_management_rating +
    review.creativity_rating +
    review.integrity_rating +
    review.inclusive_education_rating;
  return Math.round((sum / 10) * 10) / 10;
};

export interface TeacherWithAverage {
  teacher_id: string;
  teacher: {
    id: string;
    name: string;
    email: string;
    photo_url: string | null;
  };
  school?: {
    id: string;
    name: string;
  };
  average_rating: number;
  review_count: number;
  // Individual averages
  academic_expertise_avg: number;
  communication_avg: number;
  empathy_avg: number;
  collaboration_avg: number;
  dedication_avg: number;
  flexibility_avg: number;
  classroom_management_avg: number;
  creativity_avg: number;
  integrity_avg: number;
  inclusive_education_avg: number;
}

export const schoolTeacherReviewsService = {
  // Get all reviews (for admin)
  async getAll() {
    const { data, error } = await supabase
      .from('school_teacher_reviews')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email, photo_url),
        school:locations!school_id(id, name),
        reviewer:profiles!reviewer_id(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SchoolTeacherReview[];
  },

  // Get reviews by school
  async getBySchool(schoolId: string) {
    const { data, error } = await supabase
      .from('school_teacher_reviews')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email, photo_url),
        reviewer:profiles!reviewer_id(id, name)
      `)
      .eq('school_id', schoolId)
      .order('review_month', { ascending: false });

    if (error) throw error;
    return data as SchoolTeacherReview[];
  },

  // Get reviews by teacher
  async getByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('school_teacher_reviews')
      .select(`
        *,
        school:locations!school_id(id, name),
        reviewer:profiles!reviewer_id(id, name)
      `)
      .eq('teacher_id', teacherId)
      .order('review_month', { ascending: false });

    if (error) throw error;
    return data as SchoolTeacherReview[];
  },

  // Get reviews by month
  async getByMonth(reviewMonth: string) {
    const { data, error } = await supabase
      .from('school_teacher_reviews')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email, photo_url),
        school:locations!school_id(id, name)
      `)
      .eq('review_month', reviewMonth)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SchoolTeacherReview[];
  },

  // Get existing review (to check if already reviewed)
  async getExistingReview(reviewerId: string, teacherId: string, schoolId: string, reviewMonth: string) {
    const { data, error } = await supabase
      .from('school_teacher_reviews')
      .select('*')
      .eq('reviewer_id', reviewerId)
      .eq('teacher_id', teacherId)
      .eq('school_id', schoolId)
      .eq('review_month', reviewMonth)
      .maybeSingle();

    if (error) throw error;
    return data as SchoolTeacherReview | null;
  },

  // Get teachers with average ratings for a school in a specific month
  async getTeachersWithAverages(schoolId: string, reviewMonth?: string): Promise<TeacherWithAverage[]> {
    const month = reviewMonth || getCurrentReviewMonth();

    const { data, error } = await supabase
      .from('school_teacher_reviews')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email, photo_url)
      `)
      .eq('school_id', schoolId)
      .eq('review_month', month);

    if (error) throw error;

    // Group by teacher and calculate averages
    const teacherMap = new Map<string, SchoolTeacherReview[]>();
    (data as SchoolTeacherReview[]).forEach((review) => {
      const teacherId = review.teacher_id;
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, []);
      }
      teacherMap.get(teacherId)!.push(review);
    });

    const result: TeacherWithAverage[] = [];
    teacherMap.forEach((reviews, teacherId) => {
      const count = reviews.length;
      const teacher = reviews[0].teacher!;

      const sumRatings = {
        academic_expertise: 0,
        communication: 0,
        empathy: 0,
        collaboration: 0,
        dedication: 0,
        flexibility: 0,
        classroom_management: 0,
        creativity: 0,
        integrity: 0,
        inclusive_education: 0,
      };

      reviews.forEach((r) => {
        sumRatings.academic_expertise += r.academic_expertise_rating;
        sumRatings.communication += r.communication_rating;
        sumRatings.empathy += r.empathy_rating;
        sumRatings.collaboration += r.collaboration_rating;
        sumRatings.dedication += r.dedication_rating;
        sumRatings.flexibility += r.flexibility_rating;
        sumRatings.classroom_management += r.classroom_management_rating;
        sumRatings.creativity += r.creativity_rating;
        sumRatings.integrity += r.integrity_rating;
        sumRatings.inclusive_education += r.inclusive_education_rating;
      });

      const avgRatings = {
        academic_expertise_avg: Math.round((sumRatings.academic_expertise / count) * 10) / 10,
        communication_avg: Math.round((sumRatings.communication / count) * 10) / 10,
        empathy_avg: Math.round((sumRatings.empathy / count) * 10) / 10,
        collaboration_avg: Math.round((sumRatings.collaboration / count) * 10) / 10,
        dedication_avg: Math.round((sumRatings.dedication / count) * 10) / 10,
        flexibility_avg: Math.round((sumRatings.flexibility / count) * 10) / 10,
        classroom_management_avg: Math.round((sumRatings.classroom_management / count) * 10) / 10,
        creativity_avg: Math.round((sumRatings.creativity / count) * 10) / 10,
        integrity_avg: Math.round((sumRatings.integrity / count) * 10) / 10,
        inclusive_education_avg: Math.round((sumRatings.inclusive_education / count) * 10) / 10,
      };

      const overallAvg =
        (avgRatings.academic_expertise_avg +
          avgRatings.communication_avg +
          avgRatings.empathy_avg +
          avgRatings.collaboration_avg +
          avgRatings.dedication_avg +
          avgRatings.flexibility_avg +
          avgRatings.classroom_management_avg +
          avgRatings.creativity_avg +
          avgRatings.integrity_avg +
          avgRatings.inclusive_education_avg) /
        10;

      result.push({
        teacher_id: teacherId,
        teacher,
        average_rating: Math.round(overallAvg * 10) / 10,
        review_count: count,
        ...avgRatings,
      });
    });

    // Sort by average rating descending
    result.sort((a, b) => b.average_rating - a.average_rating);
    return result;
  },

  // Get teacher of the month for all schools (for homepage)
  async getTeachersOfTheMonth(reviewMonth?: string): Promise<TeacherWithAverage[]> {
    const month = reviewMonth || getCurrentReviewMonth();

    const { data, error } = await supabase
      .from('school_teacher_reviews')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email, photo_url),
        school:locations!school_id(id, name)
      `)
      .eq('review_month', month);

    if (error) throw error;

    // Group by teacher and calculate averages, include school info
    const teacherMap = new Map<string, { reviews: SchoolTeacherReview[]; school: any }>();
    (data as SchoolTeacherReview[]).forEach((review) => {
      const teacherId = review.teacher_id;
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, { reviews: [], school: review.school });
      }
      teacherMap.get(teacherId)!.reviews.push(review);
    });

    const result: TeacherWithAverage[] = [];
    teacherMap.forEach(({ reviews, school }, teacherId) => {
      const count = reviews.length;
      const teacher = reviews[0].teacher!;

      const sumRatings = {
        academic_expertise: 0,
        communication: 0,
        empathy: 0,
        collaboration: 0,
        dedication: 0,
        flexibility: 0,
        classroom_management: 0,
        creativity: 0,
        integrity: 0,
        inclusive_education: 0,
      };

      reviews.forEach((r) => {
        sumRatings.academic_expertise += r.academic_expertise_rating;
        sumRatings.communication += r.communication_rating;
        sumRatings.empathy += r.empathy_rating;
        sumRatings.collaboration += r.collaboration_rating;
        sumRatings.dedication += r.dedication_rating;
        sumRatings.flexibility += r.flexibility_rating;
        sumRatings.classroom_management += r.classroom_management_rating;
        sumRatings.creativity += r.creativity_rating;
        sumRatings.integrity += r.integrity_rating;
        sumRatings.inclusive_education += r.inclusive_education_rating;
      });

      const avgRatings = {
        academic_expertise_avg: Math.round((sumRatings.academic_expertise / count) * 10) / 10,
        communication_avg: Math.round((sumRatings.communication / count) * 10) / 10,
        empathy_avg: Math.round((sumRatings.empathy / count) * 10) / 10,
        collaboration_avg: Math.round((sumRatings.collaboration / count) * 10) / 10,
        dedication_avg: Math.round((sumRatings.dedication / count) * 10) / 10,
        flexibility_avg: Math.round((sumRatings.flexibility / count) * 10) / 10,
        classroom_management_avg: Math.round((sumRatings.classroom_management / count) * 10) / 10,
        creativity_avg: Math.round((sumRatings.creativity / count) * 10) / 10,
        integrity_avg: Math.round((sumRatings.integrity / count) * 10) / 10,
        inclusive_education_avg: Math.round((sumRatings.inclusive_education / count) * 10) / 10,
      };

      const overallAvg =
        (avgRatings.academic_expertise_avg +
          avgRatings.communication_avg +
          avgRatings.empathy_avg +
          avgRatings.collaboration_avg +
          avgRatings.dedication_avg +
          avgRatings.flexibility_avg +
          avgRatings.classroom_management_avg +
          avgRatings.creativity_avg +
          avgRatings.integrity_avg +
          avgRatings.inclusive_education_avg) /
        10;

      result.push({
        teacher_id: teacherId,
        teacher,
        school,
        average_rating: Math.round(overallAvg * 10) / 10,
        review_count: count,
        ...avgRatings,
      });
    });

    // Sort by average rating descending and take top teachers
    result.sort((a, b) => b.average_rating - a.average_rating);
    return result;
  },

  // Create a new review
  async create(review: SchoolTeacherReviewInsert) {
    const { data, error } = await supabaseAdmin
      .from('school_teacher_reviews')
      .insert(review)
      .select()
      .single();

    if (error) throw error;
    return data as SchoolTeacherReview;
  },

  // Update a review
  async update(id: string, updates: SchoolTeacherReviewUpdate) {
    const { data, error } = await supabaseAdmin
      .from('school_teacher_reviews')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SchoolTeacherReview;
  },

  // Delete a review
  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('school_teacher_reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get teachers who teach at a specific school (for review form)
  async getTeachersAtSchool(schoolId: string) {
    // Get teachers who have sessions at this school
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('name')
      .eq('id', schoolId)
      .single();

    if (locError) throw locError;

    const schoolName = locations?.name;
    if (!schoolName) return [];

    // Find teachers with sessions at this school
    const { data: sessions, error: sessError } = await supabase
      .from('class_sessions')
      .select('teacher_id')
      .ilike('location', `${schoolName}%`);

    if (sessError) throw sessError;

    const teacherIds = [...new Set(sessions?.map((s) => s.teacher_id) || [])];
    if (teacherIds.length === 0) return [];

    // Get teacher profiles
    const { data: teachers, error: teachErr } = await supabase
      .from('profiles')
      .select('id, name, email, photo_url')
      .in('id', teacherIds)
      .eq('role', 'TEACHER')
      .eq('status', 'ACTIVE');

    if (teachErr) throw teachErr;
    return teachers || [];
  },
};

export default schoolTeacherReviewsService;

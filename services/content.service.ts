import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type News = Database['public']['Tables']['news']['Row'];
type NewsInsert = Database['public']['Tables']['news']['Insert'];
type NewsUpdate = Database['public']['Tables']['news']['Update'];
type StudentOfTheMonth = Database['public']['Tables']['student_of_the_month']['Row'];
type StudentOfTheMonthInsert = Database['public']['Tables']['student_of_the_month']['Insert'];
type FeaturedTeacher = Database['public']['Tables']['featured_teachers']['Row'];
type FeaturedTeacherInsert = Database['public']['Tables']['featured_teachers']['Insert'];
type FeaturedTeacherUpdate = Database['public']['Tables']['featured_teachers']['Update'];
type TeacherApplication = Database['public']['Tables']['teacher_applications']['Row'];
type TeacherApplicationInsert = Database['public']['Tables']['teacher_applications']['Insert'];
type TeacherApplicationUpdate = Database['public']['Tables']['teacher_applications']['Update'];
type Feedback = Database['public']['Tables']['feedback']['Row'];
type FeedbackInsert = Database['public']['Tables']['feedback']['Insert'];

export const contentService = {
  // ==================== NEWS ====================

  // Get all news
  async getNews() {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get published news
  async getPublishedNews() {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .order('published_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get news by ID
  async getNewsById(id: string) {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create news (uses admin client to bypass RLS)
  async createNews(news: NewsInsert) {
    const { data, error } = await supabaseAdmin
      .from('news')
      .insert(news as any)
      .select()
      .single();

    if (error) throw error;
    return data as News;
  },

  // Update news (uses admin client to bypass RLS)
  async updateNews(id: string, updates: NewsUpdate) {
    const { data, error } = await supabaseAdmin
      .from('news')
      .update(updates as any)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0] as News || null;
  },

  // Delete news (uses admin client to bypass RLS)
  async deleteNews(id: string) {
    const { error } = await supabaseAdmin
      .from('news')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Publish/Unpublish news
  async toggleNewsPublish(id: string, isPublished: boolean) {
    return this.updateNews(id, { is_published: isPublished });
  },

  // ==================== STUDENT OF THE MONTH ====================

  // Get all students of the month
  async getStudentsOfMonth() {
    const { data, error } = await supabase
      .from('student_of_the_month')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get current student of the month
  async getCurrentStudentOfMonth() {
    const currentDate = new Date();
    const currentMonthYear = `${currentDate.toLocaleString('en-US', { month: 'long' })} ${currentDate.getFullYear()}`;

    const { data, error } = await supabase
      .from('student_of_the_month')
      .select('*')
      .eq('month_year', currentMonthYear)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create student of the month (uses admin client to bypass RLS)
  async createStudentOfMonth(student: StudentOfTheMonthInsert) {
    const { data, error } = await supabaseAdmin
      .from('student_of_the_month')
      .insert(student as any)
      .select()
      .single();

    if (error) throw error;
    return data as StudentOfTheMonth;
  },

  // Delete student of the month (uses admin client to bypass RLS)
  async deleteStudentOfMonth(id: string) {
    const { error } = await supabaseAdmin
      .from('student_of_the_month')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== FEATURED TEACHERS ====================

  // Get all featured teachers
  async getFeaturedTeachers() {
    const { data, error } = await supabase
      .from('featured_teachers')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get active featured teachers
  async getActiveFeaturedTeachers() {
    const { data, error } = await supabase
      .from('featured_teachers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get featured teacher by ID
  async getFeaturedTeacherById(id: string) {
    const { data, error } = await supabase
      .from('featured_teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create featured teacher (uses admin client to bypass RLS)
  async createFeaturedTeacher(teacher: FeaturedTeacherInsert) {
    const { data, error } = await supabaseAdmin
      .from('featured_teachers')
      .insert(teacher as any)
      .select()
      .single();

    if (error) throw error;
    return data as FeaturedTeacher;
  },

  // Update featured teacher (uses admin client to bypass RLS)
  async updateFeaturedTeacher(id: string, updates: FeaturedTeacherUpdate) {
    const { data, error } = await supabaseAdmin
      .from('featured_teachers')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FeaturedTeacher;
  },

  // Delete featured teacher (uses admin client to bypass RLS)
  async deleteFeaturedTeacher(id: string) {
    const { error } = await supabaseAdmin
      .from('featured_teachers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Toggle featured teacher active
  async toggleFeaturedTeacherActive(id: string, isActive: boolean) {
    return this.updateFeaturedTeacher(id, { is_active: isActive });
  },

  // Get teacher profile by user ID
  async getTeacherProfileByUserId(userId: string) {
    const { data, error } = await supabase
      .from('featured_teachers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  },

  // Create or update teacher profile (upsert by user_id)
  async upsertTeacherProfile(userId: string, profile: FeaturedTeacherInsert) {
    // Check if profile exists
    const existing = await this.getTeacherProfileByUserId(userId);

    if (existing) {
      // Update existing profile by ID (more reliable than user_id)
      const { data, error } = await supabaseAdmin
        .from('featured_teachers')
        .update({ ...profile, user_id: userId, updated_at: new Date().toISOString() } as any)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as FeaturedTeacher;
    } else {
      // Create new profile
      const { data, error } = await supabaseAdmin
        .from('featured_teachers')
        .insert({ ...profile, user_id: userId } as any)
        .select()
        .single();

      if (error) throw error;
      return data as FeaturedTeacher;
    }
  },

  // ==================== TEACHER APPLICATIONS ====================

  // Get all applications
  async getTeacherApplications() {
    const { data, error } = await supabase
      .from('teacher_applications')
      .select('*')
      .order('applied_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get applications by status
  async getApplicationsByStatus(status: 'PENDING' | 'REVIEWED' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED') {
    const { data, error } = await supabase
      .from('teacher_applications')
      .select('*')
      .eq('status', status)
      .order('applied_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get applications by type
  async getApplicationsByType(type: 'local' | 'native') {
    const { data, error } = await supabase
      .from('teacher_applications')
      .select('*')
      .eq('type', type)
      .order('applied_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get application by ID
  async getApplicationById(id: string) {
    const { data, error } = await supabase
      .from('teacher_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create application (uses admin client to bypass RLS)
  async createApplication(application: TeacherApplicationInsert) {
    const { data, error } = await supabaseAdmin
      .from('teacher_applications')
      .insert(application as any)
      .select()
      .single();

    if (error) throw error;
    return data as TeacherApplication;
  },

  // Update application (uses admin client to bypass RLS)
  async updateApplication(id: string, updates: TeacherApplicationUpdate) {
    const { data, error } = await supabaseAdmin
      .from('teacher_applications')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TeacherApplication;
  },

  // Update application status
  async updateApplicationStatus(id: string, status: 'PENDING' | 'REVIEWED' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED') {
    return this.updateApplication(id, { status });
  },

  // Mark application as converted (to teacher account)
  async markAsConverted(id: string) {
    return this.updateApplication(id, { is_converted: true });
  },

  // Delete application (uses admin client to bypass RLS)
  async deleteApplication(id: string) {
    const { error } = await supabaseAdmin
      .from('teacher_applications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== FEEDBACK ====================

  // Get all feedback
  async getFeedback() {
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        user:profiles!user_id(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get feedback by user
  async getFeedbackByUser(userId: string) {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create feedback (uses admin client to bypass RLS)
  async createFeedback(feedback: FeedbackInsert) {
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert(feedback as any)
      .select()
      .single();

    if (error) throw error;
    return data as Feedback;
  },

  // Delete feedback (uses admin client to bypass RLS)
  async deleteFeedback(id: string) {
    const { error } = await supabaseAdmin
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export default contentService;

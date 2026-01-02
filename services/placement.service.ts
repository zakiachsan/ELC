import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type PlacementSubmission = Database['public']['Tables']['placement_submissions']['Row'];
type PlacementSubmissionInsert = Database['public']['Tables']['placement_submissions']['Insert'];
type PlacementSubmissionUpdate = Database['public']['Tables']['placement_submissions']['Update'];
type PlacementQuestion = Database['public']['Tables']['placement_questions']['Row'];
type PlacementQuestionInsert = Database['public']['Tables']['placement_questions']['Insert'];
type PlacementQuestionUpdate = Database['public']['Tables']['placement_questions']['Update'];
type OralTestSlot = Database['public']['Tables']['oral_test_slots']['Row'];
type OralTestSlotInsert = Database['public']['Tables']['oral_test_slots']['Insert'];
type OralTestSlotUpdate = Database['public']['Tables']['oral_test_slots']['Update'];

export const placementService = {
  // ==================== SUBMISSIONS ====================

  // Get all submissions (uses admin client to bypass RLS)
  async getSubmissions() {
    const { data, error } = await supabaseAdmin
      .from('placement_submissions')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get submission by ID (uses admin client to bypass RLS)
  async getSubmissionById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('placement_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get submissions by oral test status (uses admin client to bypass RLS)
  async getSubmissionsByOralStatus(status: 'none' | 'booked' | 'completed') {
    const { data, error } = await supabaseAdmin
      .from('placement_submissions')
      .select('*')
      .eq('oral_test_status', status)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get submissions needing oral test (uses admin client to bypass RLS)
  async getSubmissionsNeedingOralTest() {
    const { data, error } = await supabaseAdmin
      .from('placement_submissions')
      .select('*')
      .in('oral_test_status', ['none', 'booked'])
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create submission (uses regular client for public insert - RLS allows INSERT for anon)
  async createSubmission(submission: PlacementSubmissionInsert) {
    // Generate UUID client-side since we can't use SELECT after INSERT (no SELECT policy for anon)
    const id = crypto.randomUUID();
    const submissionWithId = { ...submission, id };

    // RLS allows public insert, but NOT select - so we insert without returning data
    const { error: insertError } = await supabase
      .from('placement_submissions')
      .insert(submissionWithId as any);

    if (insertError) {
      // If insert fails (e.g., RLS issue), throw the error
      throw insertError;
    }

    // Return a minimal submission object with the generated ID
    // Admin can later fetch full details using getSubmissions()
    return {
      id,
      ...submission,
      timestamp: new Date().toISOString(),
      oral_test_status: submission.oral_test_status || 'none',
      oral_test_date: null,
      oral_test_time: null,
      oral_test_score: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as PlacementSubmission;
  },

  // Update submission (uses admin client to bypass RLS)
  async updateSubmission(id: string, updates: PlacementSubmissionUpdate) {
    const { data, error } = await supabaseAdmin
      .from('placement_submissions')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PlacementSubmission;
  },

  // Book oral test
  async bookOralTest(id: string, date: string, time: string, slotId?: string) {
    // Update submission
    const submission = await this.updateSubmission(id, {
      oral_test_status: 'booked',
      oral_test_date: date,
      oral_test_time: time,
    });

    // Mark slot as booked if provided (uses admin client)
    if (slotId) {
      await supabaseAdmin
        .from('oral_test_slots')
        .update({ is_booked: true, booked_by: id })
        .eq('id', slotId);
    }

    return submission;
  },

  // Complete oral test
  async completeOralTest(id: string, score: string) {
    return this.updateSubmission(id, {
      oral_test_status: 'completed',
      oral_test_score: score,
    });
  },

  // Delete submission (uses admin client to bypass RLS)
  async deleteSubmission(id: string) {
    const { error } = await supabaseAdmin
      .from('placement_submissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== QUESTIONS ====================

  // Get all questions (uses admin client to bypass RLS)
  async getQuestions() {
    const { data, error } = await supabaseAdmin
      .from('placement_questions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get active questions (uses admin client to bypass RLS)
  async getActiveQuestions() {
    const { data, error } = await supabaseAdmin
      .from('placement_questions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get question by ID (uses admin client to bypass RLS)
  async getQuestionById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('placement_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create question (uses admin client to bypass RLS)
  async createQuestion(question: PlacementQuestionInsert) {
    const { data, error } = await supabaseAdmin
      .from('placement_questions')
      .insert(question as any)
      .select()
      .single();

    if (error) throw error;
    return data as PlacementQuestion;
  },

  // Update question (uses admin client to bypass RLS)
  async updateQuestion(id: string, updates: PlacementQuestionUpdate) {
    const { data, error } = await supabaseAdmin
      .from('placement_questions')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PlacementQuestion;
  },

  // Toggle question active
  async toggleQuestionActive(id: string, isActive: boolean) {
    return this.updateQuestion(id, { is_active: isActive });
  },

  // Delete question (uses admin client to bypass RLS)
  async deleteQuestion(id: string) {
    const { error } = await supabaseAdmin
      .from('placement_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== ORAL TEST SLOTS ====================

  // Get all slots (uses admin client to bypass RLS)
  async getOralTestSlots() {
    const { data, error } = await supabaseAdmin
      .from('oral_test_slots')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get available slots (uses admin client to bypass RLS)
  async getAvailableSlots() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('oral_test_slots')
      .select('*')
      .eq('is_booked', false)
      .gte('date', today)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get slots by date (uses admin client to bypass RLS)
  async getSlotsByDate(date: string) {
    const { data, error } = await supabaseAdmin
      .from('oral_test_slots')
      .select('*')
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Create slot (uses admin client to bypass RLS)
  async createSlot(slot: OralTestSlotInsert) {
    const { data, error } = await supabaseAdmin
      .from('oral_test_slots')
      .insert(slot as any)
      .select()
      .single();

    if (error) throw error;
    return data as OralTestSlot;
  },

  // Create multiple slots (uses admin client to bypass RLS)
  async createSlots(slots: OralTestSlotInsert[]) {
    const { data, error } = await supabaseAdmin
      .from('oral_test_slots')
      .insert(slots as any)
      .select();

    if (error) throw error;
    return data as OralTestSlot[];
  },

  // Update slot (uses admin client to bypass RLS)
  async updateSlot(id: string, updates: OralTestSlotUpdate) {
    const { data, error } = await supabaseAdmin
      .from('oral_test_slots')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as OralTestSlot;
  },

  // Book slot
  async bookSlot(id: string, submissionId: string) {
    return this.updateSlot(id, {
      is_booked: true,
      booked_by: submissionId,
    });
  },

  // Release slot
  async releaseSlot(id: string) {
    return this.updateSlot(id, {
      is_booked: false,
      booked_by: null,
    });
  },

  // Delete slot (uses admin client to bypass RLS)
  async deleteSlot(id: string) {
    const { error } = await supabaseAdmin
      .from('oral_test_slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== CEFR CALCULATION ====================

  // Calculate CEFR level based on score
  calculateCEFRLevel(score: number, totalQuestions: number): string {
    const percentage = (score / totalQuestions) * 100;

    if (percentage >= 90) return 'C2 - Proficient';
    if (percentage >= 80) return 'C1 - Advanced';
    if (percentage >= 70) return 'B2 - Upper Intermediate';
    if (percentage >= 55) return 'B1 - Intermediate';
    if (percentage >= 40) return 'A2 - Elementary';
    return 'A1 - Beginner';
  },
};

export default placementService;

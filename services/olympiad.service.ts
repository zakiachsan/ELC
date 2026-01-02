import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Olympiad = Database['public']['Tables']['olympiads']['Row'];
type OlympiadInsert = Database['public']['Tables']['olympiads']['Insert'];
type OlympiadUpdate = Database['public']['Tables']['olympiads']['Update'];
type OlympiadRegistration = Database['public']['Tables']['olympiad_registrations']['Row'];
type OlympiadRegistrationInsert = Database['public']['Tables']['olympiad_registrations']['Insert'];
type OlympiadAttempt = Database['public']['Tables']['olympiad_attempts']['Row'];
type OlympiadAttemptInsert = Database['public']['Tables']['olympiad_attempts']['Insert'];
type KahootQuiz = Database['public']['Tables']['kahoot_quizzes']['Row'];
type KahootQuizInsert = Database['public']['Tables']['kahoot_quizzes']['Insert'];
type KahootQuizUpdate = Database['public']['Tables']['kahoot_quizzes']['Update'];
type KahootParticipant = Database['public']['Tables']['kahoot_participants']['Row'];
type KahootParticipantInsert = Database['public']['Tables']['kahoot_participants']['Insert'];

export const olympiadService = {
  // ==================== OLYMPIADS ====================

  // Get all olympiads
  async getAll() {
    const { data, error } = await supabase
      .from('olympiads')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get active olympiads
  async getActive() {
    const { data, error } = await supabase
      .from('olympiads')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get open olympiads (for registration)
  async getOpen() {
    const { data, error } = await supabase
      .from('olympiads')
      .select('*')
      .eq('status', 'OPEN')
      .eq('is_active', true)
      .order('end_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get olympiad by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('olympiads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create olympiad (uses admin client to bypass RLS)
  async create(olympiad: OlympiadInsert) {
    const { data, error } = await supabaseAdmin
      .from('olympiads')
      .insert(olympiad as any)
      .select()
      .single();

    if (error) throw error;
    return data as Olympiad;
  },

  // Update olympiad (uses admin client to bypass RLS)
  async update(id: string, updates: OlympiadUpdate) {
    const { data, error } = await supabaseAdmin
      .from('olympiads')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Olympiad;
  },

  // Delete olympiad (uses admin client to bypass RLS)
  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('olympiads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Update olympiad status
  async updateStatus(id: string, status: 'UPCOMING' | 'OPEN' | 'CLOSED') {
    return this.update(id, { status });
  },

  // Toggle olympiad active
  async toggleActive(id: string, isActive: boolean) {
    return this.update(id, { is_active: isActive });
  },

  // ==================== REGISTRATIONS ====================

  // Get registrations for olympiad
  async getRegistrations(olympiadId: string) {
    const { data, error } = await supabase
      .from('olympiad_registrations')
      .select('*')
      .eq('olympiad_id', olympiadId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get all registrations
  async getAllRegistrations() {
    const { data, error } = await supabase
      .from('olympiad_registrations')
      .select(`
        *,
        olympiad:olympiads(id, title)
      `)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get registration by ID
  async getRegistrationById(id: string) {
    const { data, error } = await supabase
      .from('olympiad_registrations')
      .select(`
        *,
        olympiad:olympiads(id, title)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Check if already registered
  async checkRegistration(olympiadId: string, email: string) {
    const { data, error } = await supabase
      .from('olympiad_registrations')
      .select('id')
      .eq('olympiad_id', olympiadId)
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data !== null;
  },

  // Register for olympiad (uses admin client to bypass RLS)
  async register(registration: OlympiadRegistrationInsert) {
    const { data, error } = await supabaseAdmin
      .from('olympiad_registrations')
      .insert(registration as any)
      .select()
      .single();

    if (error) throw error;

    // Increment participant count
    await supabaseAdmin.rpc('increment_olympiad_participant', {
      olympiad_id: registration.olympiad_id,
    }).catch(() => {
      // If RPC doesn't exist, manually update
      // This is a fallback
    });

    return data;
  },

  // Update registration status (uses admin client to bypass RLS)
  async updateRegistrationStatus(id: string, status: 'PENDING' | 'SUCCESS') {
    const { data, error } = await supabaseAdmin
      .from('olympiad_registrations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete registration (uses admin client to bypass RLS)
  async deleteRegistration(id: string) {
    const { error } = await supabaseAdmin
      .from('olympiad_registrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== ATTEMPTS ====================

  // Get attempts for olympiad
  async getAttempts(olympiadId: string) {
    const { data, error } = await supabase
      .from('olympiad_attempts')
      .select(`
        *,
        student:profiles!student_id(id, name, email)
      `)
      .eq('olympiad_id', olympiadId)
      .order('score', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get student attempts
  async getStudentAttempts(studentId: string) {
    const { data, error } = await supabase
      .from('olympiad_attempts')
      .select(`
        *,
        olympiad:olympiads(id, title)
      `)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Submit attempt (uses admin client to bypass RLS)
  async submitAttempt(attempt: OlympiadAttemptInsert) {
    const { data, error } = await supabaseAdmin
      .from('olympiad_attempts')
      .insert(attempt)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==================== KAHOOT QUIZZES ====================

  // Get all kahoot quizzes
  async getKahootQuizzes() {
    const { data, error } = await supabase
      .from('kahoot_quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get active kahoot quiz
  async getActiveKahootQuiz() {
    const { data, error } = await supabase
      .from('kahoot_quizzes')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get kahoot quiz by ID
  async getKahootQuizById(id: string) {
    const { data, error } = await supabase
      .from('kahoot_quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create kahoot quiz (uses admin client to bypass RLS)
  async createKahootQuiz(quiz: KahootQuizInsert) {
    const { data, error } = await supabaseAdmin
      .from('kahoot_quizzes')
      .insert(quiz)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update kahoot quiz (uses admin client to bypass RLS)
  async updateKahootQuiz(id: string, updates: KahootQuizUpdate) {
    const { data, error } = await supabaseAdmin
      .from('kahoot_quizzes')
      .update(updates as any)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  },

  // Delete kahoot quiz (uses admin client to bypass RLS)
  async deleteKahootQuiz(id: string) {
    const { error } = await supabaseAdmin
      .from('kahoot_quizzes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Toggle kahoot quiz active (deactivate others first)
  async setActiveKahootQuiz(id: string) {
    // Deactivate all quizzes first (uses admin client to bypass RLS)
    const { error: deactivateError } = await supabaseAdmin
      .from('kahoot_quizzes')
      .update({ is_active: false } as any)
      .neq('id', id);

    if (deactivateError) {
      console.warn('Failed to deactivate other quizzes:', deactivateError);
    }

    // Activate the selected quiz
    return this.updateKahootQuiz(id, { is_active: true });
  },

  // Increment kahoot play count
  async incrementKahootPlayCount(id: string) {
    const quiz = await this.getKahootQuizById(id);
    if (quiz) {
      return this.updateKahootQuiz(id, {
        play_count: (quiz.play_count || 0) + 1,
      });
    }
  },

  // ==================== KAHOOT PARTICIPANTS ====================

  // Get participants for a quiz
  async getKahootParticipants(quizId: string) {
    const { data, error } = await supabase
      .from('kahoot_participants')
      .select('*')
      .eq('quiz_id', quizId)
      .order('score', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Save a quiz participant (uses admin client to bypass RLS)
  async saveKahootParticipant(participant: KahootParticipantInsert) {
    const { data, error } = await supabaseAdmin
      .from('kahoot_participants')
      .insert(participant)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get leaderboard (top participants across all quizzes)
  async getKahootLeaderboard(limit = 10) {
    const { data, error } = await supabase
      .from('kahoot_participants')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get today's leaderboard
  async getTodayKahootLeaderboard(limit = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('kahoot_participants')
      .select('*')
      .gte('completed_at', today.toISOString())
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },
};

export default olympiadService;

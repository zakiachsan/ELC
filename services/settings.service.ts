import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type SiteSettings = Database['public']['Tables']['site_settings']['Row'];
type SiteSettingsUpdate = Database['public']['Tables']['site_settings']['Update'];
type LevelHistory = Database['public']['Tables']['level_history']['Row'];
type LevelHistoryInsert = Database['public']['Tables']['level_history']['Insert'];
type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];
type QuizAttemptInsert = Database['public']['Tables']['quiz_attempts']['Insert'];

export const settingsService = {
  // ==================== SITE SETTINGS ====================

  // Get site settings
  async getSettings() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Update site settings (uses admin client to bypass RLS)
  async updateSettings(updates: SiteSettingsUpdate, userId?: string) {
    // Get existing settings first
    const existing = await this.getSettings();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new settings if none exist
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .insert({
          primary_color: updates.primary_color || '#2563eb',
          accent_color: updates.accent_color || '#facc15',
          video_url: updates.video_url || null,
          video_title: updates.video_title || 'Learning Tip of the Week',
          video_description: updates.video_description || 'Discover how our adaptive logic helps you master English faster.',
          video_orientation: updates.video_orientation || 'landscape',
          updated_by: userId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Update colors
  async updateColors(primaryColor: string, accentColor: string, userId?: string) {
    return this.updateSettings({
      primary_color: primaryColor,
      accent_color: accentColor,
    }, userId);
  },

  // Update video settings
  async updateVideoSettings(
    videoUrl: string,
    videoTitle: string,
    videoDescription: string,
    videoOrientation: 'landscape' | 'portrait',
    userId?: string
  ) {
    return this.updateSettings({
      video_url: videoUrl,
      video_title: videoTitle,
      video_description: videoDescription,
      video_orientation: videoOrientation,
    }, userId);
  },

  // Reset to defaults
  async resetToDefaults(userId?: string) {
    return this.updateSettings({
      primary_color: '#2563eb',
      accent_color: '#facc15',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      video_title: 'Learning Tip of the Week',
      video_description: 'Discover how our adaptive logic helps you master English faster than traditional methods.',
      video_orientation: 'landscape',
    }, userId);
  },

  // ==================== LEVEL HISTORY ====================

  // Get level history for student
  async getLevelHistory(studentId: string) {
    const { data, error } = await supabase
      .from('level_history')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get level history by skill category
  async getLevelHistoryBySkill(studentId: string, skillCategory: string) {
    const { data, error } = await supabase
      .from('level_history')
      .select('*')
      .eq('student_id', studentId)
      .eq('skill_category', skillCategory)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create level history entry (uses admin client to bypass RLS)
  async createLevelHistory(history: LevelHistoryInsert) {
    const { data, error } = await supabaseAdmin
      .from('level_history')
      .insert(history)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Record level change
  async recordLevelChange(
    studentId: string,
    skillCategory: string,
    fromLevel: string | null,
    toLevel: string,
    reason?: string
  ) {
    return this.createLevelHistory({
      student_id: studentId,
      skill_category: skillCategory as any,
      from_level: fromLevel,
      to_level: toLevel,
      reason: reason || null,
    });
  },

  // ==================== QUIZ ATTEMPTS ====================

  // Get quiz attempts for student
  async getQuizAttempts(studentId: string) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get quiz attempts by skill category
  async getQuizAttemptsBySkill(studentId: string, skillCategory: string) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('student_id', studentId)
      .eq('skill_category', skillCategory)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get latest attempt for each skill
  async getLatestAttempts(studentId: string) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Group by skill category and get latest
    const latestBySkill = new Map<string, QuizAttempt>();
    for (const attempt of data || []) {
      if (!latestBySkill.has(attempt.skill_category)) {
        latestBySkill.set(attempt.skill_category, attempt);
      }
    }

    return Array.from(latestBySkill.values());
  },

  // Create quiz attempt (uses admin client to bypass RLS)
  async createQuizAttempt(attempt: QuizAttemptInsert) {
    const { data, error } = await supabaseAdmin
      .from('quiz_attempts')
      .insert(attempt)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Record quiz result
  async recordQuizResult(
    studentId: string,
    skillCategory: string,
    attemptedDifficulty: string,
    score: number,
    passed: boolean,
    finalPlacement: string,
    feedback?: string
  ) {
    return this.createQuizAttempt({
      student_id: studentId,
      skill_category: skillCategory,
      attempted_difficulty: attemptedDifficulty,
      score,
      passed,
      final_placement: finalPlacement,
      feedback: feedback || null,
    });
  },
};

export default settingsService;

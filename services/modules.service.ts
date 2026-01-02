import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type OnlineModule = Database['public']['Tables']['online_modules']['Row'];
type OnlineModuleInsert = Database['public']['Tables']['online_modules']['Insert'];
type OnlineModuleUpdate = Database['public']['Tables']['online_modules']['Update'];
type StudentModuleProgress = Database['public']['Tables']['student_module_progress']['Row'];
type StudentModuleProgressInsert = Database['public']['Tables']['student_module_progress']['Insert'];
type StudentModuleProgressUpdate = Database['public']['Tables']['student_module_progress']['Update'];

export const modulesService = {
  // ==================== MODULES ====================

  // Get all modules
  async getAll() {
    const { data, error } = await supabase
      .from('online_modules')
      .select(`
        *,
        creator:profiles!created_by(id, name)
      `)
      .order('posted_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get published modules
  async getPublished() {
    const { data, error } = await supabase
      .from('online_modules')
      .select('*')
      .eq('status', 'PUBLISHED')
      .order('posted_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get module by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('online_modules')
      .select(`
        *,
        creator:profiles!created_by(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get modules by skill category
  async getBySkillCategory(skillCategory: string) {
    const { data, error } = await supabase
      .from('online_modules')
      .select('*')
      .eq('skill_category', skillCategory)
      .eq('status', 'PUBLISHED')
      .order('posted_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get modules by difficulty level
  async getByDifficultyLevel(difficultyLevel: string) {
    const { data, error } = await supabase
      .from('online_modules')
      .select('*')
      .eq('difficulty_level', difficultyLevel)
      .eq('status', 'PUBLISHED')
      .order('posted_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create module
  async create(module: OnlineModuleInsert) {
    const { data, error } = await supabase
      .from('online_modules')
      .insert(module as any)
      .select()
      .single();

    if (error) throw error;
    return data as OnlineModule;
  },

  // Update module
  async update(id: string, updates: OnlineModuleUpdate) {
    const { data, error } = await supabase
      .from('online_modules')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as OnlineModule;
  },

  // Delete module
  async delete(id: string) {
    const { error } = await supabase
      .from('online_modules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Publish module
  async publish(id: string) {
    return this.update(id, { status: 'PUBLISHED' });
  },

  // Unpublish module (set to draft)
  async unpublish(id: string) {
    return this.update(id, { status: 'DRAFT' });
  },

  // ==================== STUDENT PROGRESS ====================

  // Get student progress for all modules
  async getStudentProgress(studentId: string) {
    const { data, error } = await supabase
      .from('student_module_progress')
      .select(`
        *,
        module:online_modules(id, title, skill_category, difficulty_level)
      `)
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get student progress for a specific module
  async getStudentModuleProgress(studentId: string, moduleId: string) {
    const { data, error } = await supabase
      .from('student_module_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('module_id', moduleId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  // Get completed modules for student
  async getCompletedModules(studentId: string) {
    const { data, error } = await supabase
      .from('student_module_progress')
      .select(`
        *,
        module:online_modules(id, title, skill_category, difficulty_level)
      `)
      .eq('student_id', studentId)
      .eq('status', 'COMPLETED')
      .order('completed_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create or update student progress
  async upsertProgress(progress: StudentModuleProgressInsert) {
    const { data, error } = await supabase
      .from('student_module_progress')
      .upsert(progress as any, { onConflict: 'student_id,module_id' })
      .select()
      .single();

    if (error) throw error;
    return data as StudentModuleProgress;
  },

  // Start module (set to in progress)
  async startModule(studentId: string, moduleId: string) {
    return this.upsertProgress({
      student_id: studentId,
      module_id: moduleId,
      status: 'IN_PROGRESS',
    });
  },

  // Complete module
  async completeModule(studentId: string, moduleId: string, quizScore?: number) {
    return this.upsertProgress({
      student_id: studentId,
      module_id: moduleId,
      status: 'COMPLETED',
      completed_date: new Date().toISOString(),
      quiz_score: quizScore || null,
    });
  },

  // Update quiz score
  async updateQuizScore(studentId: string, moduleId: string, score: number) {
    const { data, error } = await supabase
      .from('student_module_progress')
      .update({ quiz_score: score } as any)
      .eq('student_id', studentId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) throw error;
    return data as StudentModuleProgress;
  },

  // Get module statistics (for teacher/admin)
  async getModuleStats(moduleId: string) {
    const { data, error } = await supabase
      .from('student_module_progress')
      .select('status, quiz_score')
      .eq('module_id', moduleId);

    if (error) throw error;

    const progressData = (data || []) as Pick<StudentModuleProgress, 'status' | 'quiz_score'>[];
    const total = progressData.length;
    const completed = progressData.filter(p => p.status === 'COMPLETED').length;
    const inProgress = progressData.filter(p => p.status === 'IN_PROGRESS').length;
    const scores = progressData.filter(p => p.quiz_score !== null).map(p => p.quiz_score!);
    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted: total - completed - inProgress,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      averageScore,
    };
  },
};

export default modulesService;

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Homework = Database['public']['Tables']['homeworks']['Row'];
type HomeworkInsert = Database['public']['Tables']['homeworks']['Insert'];
type HomeworkUpdate = Database['public']['Tables']['homeworks']['Update'];

export const homeworksService = {
  // Get all homeworks
  async getAll() {
    const { data, error } = await supabase
      .from('homeworks')
      .select(`
        *,
        session:class_sessions(id, topic, date_time),
        student:profiles!student_id(id, name, email)
      `)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get homework by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('homeworks')
      .select(`
        *,
        session:class_sessions(id, topic, date_time),
        student:profiles!student_id(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get homeworks by session
  async getBySession(sessionId: string) {
    const { data, error } = await supabase
      .from('homeworks')
      .select(`
        *,
        student:profiles!student_id(id, name, email)
      `)
      .eq('session_id', sessionId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get homeworks by student
  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('homeworks')
      .select(`
        *,
        session:class_sessions(id, topic, date_time, skill_category)
      `)
      .eq('student_id', studentId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get pending homeworks by student
  async getPendingByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('homeworks')
      .select(`
        *,
        session:class_sessions(id, topic, date_time, skill_category)
      `)
      .eq('student_id', studentId)
      .eq('status', 'PENDING')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get overdue homeworks by student
  async getOverdueByStudent(studentId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('homeworks')
      .select(`
        *,
        session:class_sessions(id, topic, date_time, skill_category)
      `)
      .eq('student_id', studentId)
      .eq('status', 'PENDING')
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get graded homeworks by student
  async getGradedByStudent(studentId: string, limit?: number) {
    let query = supabase
      .from('homeworks')
      .select(`
        *,
        session:class_sessions(id, topic, date_time, skill_category)
      `)
      .eq('student_id', studentId)
      .eq('status', 'GRADED')
      .order('due_date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Create homework
  async create(homework: HomeworkInsert) {
    const { data, error } = await supabase
      .from('homeworks')
      .insert(homework as any)
      .select()
      .single();

    if (error) throw error;
    return data as Homework;
  },

  // Create multiple homeworks (for assigning to multiple students)
  async createMany(homeworks: HomeworkInsert[]) {
    const { data, error } = await supabase
      .from('homeworks')
      .insert(homeworks as any)
      .select();

    if (error) throw error;
    return data as Homework[];
  },

  // Assign homework to all students in a session
  async assignToSession(sessionId: string, homework: {
    title: string;
    description?: string;
    dueDate: string;
  }, studentIds: string[]) {
    const homeworks: HomeworkInsert[] = studentIds.map(studentId => ({
      session_id: sessionId,
      student_id: studentId,
      title: homework.title,
      description: homework.description || null,
      due_date: homework.dueDate,
      status: 'PENDING',
    }));

    return this.createMany(homeworks);
  },

  // Update homework
  async update(id: string, updates: HomeworkUpdate) {
    const { data, error } = await supabase
      .from('homeworks')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Homework;
  },

  // Delete homework
  async delete(id: string) {
    const { error } = await supabase
      .from('homeworks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Submit homework (student action)
  async submit(id: string, submissionUrl: string) {
    return this.update(id, {
      status: 'SUBMITTED',
      submission_url: submissionUrl,
    });
  },

  // Grade homework (teacher action)
  async grade(id: string, score: number, feedback?: string) {
    return this.update(id, {
      status: 'GRADED',
      score,
      feedback: feedback || null,
    });
  },
};

export default homeworksService;

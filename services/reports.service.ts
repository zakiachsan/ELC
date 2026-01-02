import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type SessionReport = Database['public']['Tables']['session_reports']['Row'];
type SessionReportInsert = Database['public']['Tables']['session_reports']['Insert'];
type SessionReportUpdate = Database['public']['Tables']['session_reports']['Update'];

export const reportsService = {
  // Get all reports
  async getAll() {
    const { data, error } = await supabase
      .from('session_reports')
      .select(`
        *,
        session:class_sessions(id, topic, date_time, skill_category, difficulty_level),
        student:profiles!student_id(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get report by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('session_reports')
      .select(`
        *,
        session:class_sessions(id, topic, date_time, skill_category, difficulty_level),
        student:profiles!student_id(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get reports by session
  async getBySession(sessionId: string) {
    const { data, error } = await supabase
      .from('session_reports')
      .select(`
        *,
        student:profiles!student_id(id, name, email, photo_url)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get reports by student
  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('session_reports')
      .select(`
        *,
        session:class_sessions(id, topic, date_time, skill_category, difficulty_level, teacher_id)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get student grades history (for parent/student view)
  async getStudentGradesHistory(studentId: string, limit?: number) {
    let query = supabase
      .from('session_reports')
      .select(`
        *,
        session:class_sessions(id, topic, date_time, skill_category, difficulty_level)
      `)
      .eq('student_id', studentId)
      .not('written_score', 'is', null)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get attendance statistics for student
  async getAttendanceStats(studentId: string) {
    const { data, error } = await supabase
      .from('session_reports')
      .select('attendance_status')
      .eq('student_id', studentId);

    if (error) throw error;

    const total = data.length;
    const present = data.filter(r => r.attendance_status === 'PRESENT').length;
    const late = data.filter(r => r.attendance_status === 'LATE').length;
    const absent = data.filter(r => r.attendance_status === 'ABSENT').length;

    return {
      total,
      present,
      late,
      absent,
      attendanceRate: total > 0 ? ((present + late) / total) * 100 : 0,
    };
  },

  // Get average scores for student
  async getAverageScores(studentId: string) {
    const { data, error } = await supabase
      .from('session_reports')
      .select('written_score, oral_score')
      .eq('student_id', studentId)
      .not('written_score', 'is', null);

    if (error) throw error;

    const writtenScores = data.filter(r => r.written_score !== null).map(r => r.written_score!);
    const oralScores = data.filter(r => r.oral_score !== null).map(r => r.oral_score!);

    return {
      averageWritten: writtenScores.length > 0
        ? writtenScores.reduce((a, b) => a + b, 0) / writtenScores.length
        : 0,
      averageOral: oralScores.length > 0
        ? oralScores.reduce((a, b) => a + b, 0) / oralScores.length
        : 0,
      totalGraded: data.length,
    };
  },

  // Create report
  async create(report: SessionReportInsert) {
    const { data, error } = await supabase
      .from('session_reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create multiple reports (for batch grading)
  async createMany(reports: SessionReportInsert[]) {
    const { data, error } = await supabase
      .from('session_reports')
      .insert(reports)
      .select();

    if (error) throw error;
    return data;
  },

  // Update report
  async update(id: string, updates: SessionReportUpdate) {
    const { data, error } = await supabase
      .from('session_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Upsert report (create or update)
  async upsert(report: SessionReportInsert) {
    const { data, error } = await supabase
      .from('session_reports')
      .upsert(report, { onConflict: 'session_id,student_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete report
  async delete(id: string) {
    const { error } = await supabase
      .from('session_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Update grades
  async updateGrades(id: string, grades: {
    writtenScore?: number;
    oralScore?: number;
    cefrLevel?: string;
    teacherNotes?: string;
  }) {
    return this.update(id, {
      written_score: grades.writtenScore,
      oral_score: grades.oralScore,
      cefr_level: grades.cefrLevel,
      teacher_notes: grades.teacherNotes,
    });
  },

  // Update attendance
  async updateAttendance(id: string, status: 'PRESENT' | 'ABSENT' | 'LATE') {
    return this.update(id, { attendance_status: status });
  },
};

export default reportsService;

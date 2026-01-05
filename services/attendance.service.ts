import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TeacherAttendance = Database['public']['Tables']['teacher_attendance']['Row'];
type TeacherAttendanceInsert = Database['public']['Tables']['teacher_attendance']['Insert'];
type TeacherAttendanceUpdate = Database['public']['Tables']['teacher_attendance']['Update'];

// Helper function to get timezone offset string (e.g., "+07:00" for WIB)
const getTimezoneOffset = (): string => {
  const offset = new Date().getTimezoneOffset();
  const sign = offset <= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
};

export const attendanceService = {
  // Get all attendance records
  async getAll() {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email, photo_url),
        location:locations!location_id(id, name, address)
      `)
      .order('check_in_time', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get attendance by teacher
  async getByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .select(`
        *,
        location:locations!location_id(id, name, address)
      `)
      .eq('teacher_id', teacherId)
      .order('check_in_time', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get today's attendance for a teacher
  async getTodayByTeacher(teacherId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data, error } = await supabase
      .from('teacher_attendance')
      .select(`
        *,
        location:locations!location_id(id, name, address)
      `)
      .eq('teacher_id', teacherId)
      .gte('check_in_time', startOfDay)
      .lte('check_in_time', endOfDay)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get attendance by date range
  async getByDateRange(startDate: string, endDate: string, teacherId?: string) {
    let query = supabase
      .from('teacher_attendance')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email, photo_url),
        location:locations!location_id(id, name, address)
      `)
      .gte('check_in_time', startDate)
      .lte('check_in_time', endDate)
      .order('check_in_time', { ascending: false });

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Check in (uses admin client to bypass RLS)
  async checkIn(attendance: TeacherAttendanceInsert) {
    // Add timezone offset to check_in_time
    const checkInTime = attendance.check_in_time || new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('teacher_attendance')
      .insert({
        ...attendance,
        check_in_time: checkInTime,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check out (uses admin client to bypass RLS)
  async checkOut(id: string) {
    const checkOutTime = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('teacher_attendance')
      .update({ check_out_time: checkOutTime })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update attendance (uses admin client to bypass RLS)
  async update(id: string, updates: TeacherAttendanceUpdate) {
    const { data, error } = await supabaseAdmin
      .from('teacher_attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete attendance (uses admin client to bypass RLS)
  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('teacher_attendance')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get attendance statistics for a teacher in a month
  async getMonthlyStats(teacherId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const { data, error } = await supabase
      .from('teacher_attendance')
      .select('*')
      .eq('teacher_id', teacherId)
      .gte('check_in_time', startDate)
      .lte('check_in_time', endDate);

    if (error) throw error;

    const stats = {
      totalDays: data?.length || 0,
      present: data?.filter(a => a.status === 'PRESENT').length || 0,
      late: data?.filter(a => a.status === 'LATE').length || 0,
      earlyLeave: data?.filter(a => a.status === 'EARLY_LEAVE').length || 0,
    };

    return stats;
  },
};

export default attendanceService;

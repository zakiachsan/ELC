import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ClassSession = Database['public']['Tables']['class_sessions']['Row'];
type ClassSessionInsert = Database['public']['Tables']['class_sessions']['Insert'];
type ClassSessionUpdate = Database['public']['Tables']['class_sessions']['Update'];

export const sessionsService = {
  // Get all sessions
  async getAll() {
    const { data, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email),
        location_data:locations!location_id(id, name, address)
      `)
      .order('date_time', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get session by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email),
        location_data:locations!location_id(id, name, address)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get sessions by teacher
  async getByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        location_data:locations!location_id(id, name, address)
      `)
      .eq('teacher_id', teacherId)
      .order('date_time', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get sessions by location
  async getByLocation(location: string) {
    const { data, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email)
      `)
      .eq('location', location)
      .order('date_time', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get upcoming sessions
  async getUpcoming(limit?: number) {
    let query = supabase
      .from('class_sessions')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email),
        location_data:locations!location_id(id, name, address)
      `)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get past sessions
  async getPast(limit?: number) {
    let query = supabase
      .from('class_sessions')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email),
        location_data:locations!location_id(id, name, address)
      `)
      .lt('date_time', new Date().toISOString())
      .order('date_time', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get today's sessions
  async getToday() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email),
        location_data:locations!location_id(id, name, address)
      `)
      .gte('date_time', startOfDay)
      .lte('date_time', endOfDay)
      .order('date_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get sessions by date range
  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email),
        location_data:locations!location_id(id, name, address)
      `)
      .gte('date_time', startDate)
      .lte('date_time', endDate)
      .order('date_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Create session (uses admin client to bypass RLS)
  async create(session: ClassSessionInsert) {
    const { data, error } = await supabaseAdmin
      .from('class_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update session (uses admin client to bypass RLS)
  async update(id: string, updates: ClassSessionUpdate) {
    const { data, error } = await supabaseAdmin
      .from('class_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete session (uses admin client to bypass RLS)
  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('class_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Add materials to session
  async addMaterials(id: string, materials: string[]) {
    const session = await this.getById(id);
    const currentMaterials = session?.materials || [];
    const newMaterials = [...currentMaterials, ...materials];

    return this.update(id, { materials: newMaterials });
  },

  // Remove material from session
  async removeMaterial(id: string, materialUrl: string) {
    const session = await this.getById(id);
    const currentMaterials = session?.materials || [];
    const newMaterials = currentMaterials.filter(m => m !== materialUrl);

    return this.update(id, { materials: newMaterials });
  },
};

export default sessionsService;

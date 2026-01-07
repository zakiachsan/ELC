import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type Location = Database['public']['Tables']['locations']['Row'];
type LocationInsert = Database['public']['Tables']['locations']['Insert'];
type LocationUpdate = Database['public']['Tables']['locations']['Update'];

export const profilesService = {
  // ==================== PROFILES ====================

  // Get all profiles
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get profile by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get profiles by role (fetches all records, up to 10000)
  async getByRole(role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT') {
    // Supabase default limit is 1000, so we need to explicitly set a higher limit
    // For large datasets, we fetch in batches
    const batchSize = 1000;
    let allData: Profile[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', role)
        .order('name')
        .range(from, from + batchSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    return allData;
  },

  // Get students with pagination and filters
  async getStudentsPaginated(options: {
    page: number;
    pageSize: number;
    search?: string;
    locationId?: string;
  }) {
    const { page, pageSize, search, locationId } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'STUDENT')
      .order('name')
      .range(from, to);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (locationId) {
      query = query.eq('assigned_location_id', locationId);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  // Get total student count
  async getStudentCount() {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'STUDENT');

    if (error) throw error;
    return count || 0;
  },

  // Get students
  async getStudents() {
    return this.getByRole('STUDENT');
  },

  // Get teachers
  async getTeachers() {
    return this.getByRole('TEACHER');
  },

  // Get parents
  async getParents() {
    return this.getByRole('PARENT');
  },

  // Get students by location
  async getStudentsByLocation(locationId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'STUDENT')
      .eq('assigned_location_id', locationId)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get students needing attention
  async getStudentsNeedingAttention() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'STUDENT')
      .eq('needs_attention', true)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get linked student for parent
  async getLinkedStudent(parentId: string) {
    const parent = await this.getById(parentId);
    if (parent?.linked_student_id) {
      return this.getById(parent.linked_student_id);
    }
    return null;
  },

  // Create profile (uses admin client to bypass RLS)
  async create(profile: ProfileInsert) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update profile (uses admin client to bypass RLS)
  async update(id: string, updates: ProfileUpdate) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete profile (uses admin client to bypass RLS)
  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Update skill levels
  async updateSkillLevels(id: string, skillLevels: Record<string, string>) {
    return this.update(id, { skill_levels: skillLevels });
  },

  // Toggle needs attention
  async toggleNeedsAttention(id: string, needsAttention: boolean) {
    return this.update(id, { needs_attention: needsAttention });
  },

  // Update learning hub subscription
  async updateSubscription(id: string, subscription: { isActive: boolean; expiresAt?: string }) {
    return this.update(id, { learning_hub_subscription: subscription });
  },

  // ==================== LOCATIONS ====================

  // Get all locations
  async getLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get location by ID
  async getLocationById(id: string) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create location (uses admin client to bypass RLS)
  async createLocation(location: LocationInsert) {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert(location)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update location (uses admin client to bypass RLS)
  async updateLocation(id: string, updates: LocationUpdate) {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete location (uses admin client to bypass RLS)
  async deleteLocation(id: string) {
    const { error } = await supabaseAdmin
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== CLASSES ====================

  // Get classes by location
  async getClassesByLocation(locationId: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('location_id', locationId)
      .order('name');

    if (error) {
      // Table might not exist yet, return empty array
      console.warn('Classes table query error:', error.message);
      return [];
    }
    return data || [];
  },

  // Get all classes
  async getAllClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select('*, locations(name)')
      .order('name');

    if (error) {
      console.warn('Classes table query error:', error.message);
      return [];
    }
    return data || [];
  },

  // Create class (uses admin client to bypass RLS)
  async createClass(classData: { location_id: string; name: string; class_type?: string }) {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .insert(classData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create multiple classes at once
  async createClasses(classesData: { location_id: string; name: string; class_type?: string }[]) {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .upsert(classesData, { onConflict: 'location_id,name', ignoreDuplicates: true })
      .select();

    if (error) throw error;
    return data || [];
  },

  // Delete class
  async deleteClass(id: string) {
    const { error } = await supabaseAdmin
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export default profilesService;

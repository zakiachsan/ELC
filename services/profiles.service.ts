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

  // Get profiles by role
  async getByRole(role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT') {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('name');

    if (error) throw error;
    return data;
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
};

export default profilesService;

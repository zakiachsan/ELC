import { supabase } from '../lib/supabase';
import { Announcement } from '../types';

// Type definitions for the announcements table
interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'teachers' | 'students' | 'parents';
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience?: 'all' | 'teachers' | 'students' | 'parents';
  startsAt?: string | null;
  expiresAt?: string | null;
}

export interface UpdateAnnouncementInput extends Partial<CreateAnnouncementInput> {
  isActive?: boolean;
}

// Fetch all announcements (for admin)
export async function fetchAllAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data || []) as unknown as AnnouncementRow[]).map(mapToAnnouncement);
}

// Fetch active announcements for a target audience
export async function fetchActiveAnnouncements(
  audience: 'all' | 'teachers' | 'students' | 'parents'
): Promise<Announcement[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .or(`target_audience.eq.all,target_audience.eq.${audience}`)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data || []) as unknown as AnnouncementRow[]).map(mapToAnnouncement);
}

// Create a new announcement
export async function createAnnouncement(
  input: CreateAnnouncementInput,
  createdBy: string
): Promise<Announcement> {
  const insertData = {
    title: input.title,
    content: input.content,
    priority: input.priority || 'normal',
    target_audience: input.targetAudience || 'teachers',
    starts_at: input.startsAt || null,
    expires_at: input.expiresAt || null,
    created_by: createdBy,
  };

  const { data, error } = await supabase
    .from('announcements')
    .insert(insertData as never)
    .select()
    .single();

  if (error) throw error;

  return mapToAnnouncement(data as unknown as AnnouncementRow);
}

// Update an announcement
export async function updateAnnouncement(
  id: string,
  input: UpdateAnnouncementInput
): Promise<Announcement> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.targetAudience !== undefined) updateData.target_audience = input.targetAudience;
  if (input.startsAt !== undefined) updateData.starts_at = input.startsAt;
  if (input.expiresAt !== undefined) updateData.expires_at = input.expiresAt;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  const { data, error } = await supabase
    .from('announcements')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return mapToAnnouncement(data as unknown as AnnouncementRow);
}

// Delete an announcement
export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Toggle announcement active status
export async function toggleAnnouncementActive(
  id: string,
  isActive: boolean
): Promise<Announcement> {
  return updateAnnouncement(id, { isActive });
}

// Helper function to map database row to Announcement interface
function mapToAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    priority: row.priority,
    targetAudience: row.target_audience,
    isActive: row.is_active,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

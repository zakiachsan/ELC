-- Add assigned_location_ids column to profiles table for teachers with multiple schools
-- This allows teachers to be assigned to multiple locations

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS assigned_location_ids text[] DEFAULT '{}';

-- Comment on column
COMMENT ON COLUMN profiles.assigned_location_ids IS 'Array of location IDs for teachers assigned to multiple schools';

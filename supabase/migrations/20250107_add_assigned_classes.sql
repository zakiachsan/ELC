-- Add assigned_classes column to profiles table for teachers
-- This stores the list of classes that a teacher is assigned to teach

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS assigned_classes TEXT[] DEFAULT '{}';

-- Comment on column
COMMENT ON COLUMN profiles.assigned_classes IS 'Array of class names that the teacher is assigned to teach';

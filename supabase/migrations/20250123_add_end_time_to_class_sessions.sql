-- Add end_time column to class_sessions table
-- This column stores the end time of a session (optional, defaults to null)

ALTER TABLE class_sessions
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ NULL;

-- Add comment for documentation
COMMENT ON COLUMN class_sessions.end_time IS 'End time of the class session';

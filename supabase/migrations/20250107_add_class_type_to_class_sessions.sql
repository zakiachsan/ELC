-- Fix: Add class_type to class_sessions table (previous migration used wrong table name 'sessions')

-- Add class_type column to class_sessions table
ALTER TABLE class_sessions
ADD COLUMN IF NOT EXISTS class_type VARCHAR(20) DEFAULT 'REGULAR' CHECK (class_type IN ('BILINGUAL', 'REGULAR'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_type ON class_sessions(class_type);

-- Comment on column for documentation
COMMENT ON COLUMN class_sessions.class_type IS 'The class type this session is for (BILINGUAL or REGULAR)';

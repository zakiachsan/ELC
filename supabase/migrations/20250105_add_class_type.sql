-- Add class_type fields for Bilingual/Regular class distinction

-- Add class_types array for teachers (can teach both Bilingual and Regular)
-- Add class_type for students (either Bilingual or Regular)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS class_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS class_type VARCHAR(20) DEFAULT NULL CHECK (class_type IS NULL OR class_type IN ('BILINGUAL', 'REGULAR'));

-- Add class_type to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS class_type VARCHAR(20) DEFAULT 'REGULAR' CHECK (class_type IN ('BILINGUAL', 'REGULAR'));

-- Add class_type to test_schedules table
ALTER TABLE test_schedules
ADD COLUMN IF NOT EXISTS class_type VARCHAR(20) DEFAULT 'REGULAR' CHECK (class_type IN ('BILINGUAL', 'REGULAR'));

-- Add class_type to student_grades table
ALTER TABLE student_grades
ADD COLUMN IF NOT EXISTS class_type VARCHAR(20) DEFAULT 'REGULAR' CHECK (class_type IN ('BILINGUAL', 'REGULAR'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_class_type ON profiles(class_type);
CREATE INDEX IF NOT EXISTS idx_sessions_class_type ON sessions(class_type);
CREATE INDEX IF NOT EXISTS idx_test_schedules_class_type ON test_schedules(class_type);
CREATE INDEX IF NOT EXISTS idx_student_grades_class_type ON student_grades(class_type);

-- Comment on columns for documentation
COMMENT ON COLUMN profiles.class_types IS 'For teachers: array of class types they can teach (BILINGUAL, REGULAR, or both)';
COMMENT ON COLUMN profiles.class_type IS 'For students: the class type they belong to (BILINGUAL or REGULAR)';
COMMENT ON COLUMN sessions.class_type IS 'The class type this session is for (BILINGUAL or REGULAR)';
COMMENT ON COLUMN test_schedules.class_type IS 'The class type this test is for (BILINGUAL or REGULAR)';
COMMENT ON COLUMN student_grades.class_type IS 'The class type for this grade record (BILINGUAL or REGULAR)';

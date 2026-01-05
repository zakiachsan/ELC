-- Create test_schedules table for Quiz, Mid Semester, and Final Semester tests
CREATE TABLE IF NOT EXISTS test_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('QUIZ', 'MID_SEMESTER', 'FINAL_SEMESTER')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location VARCHAR(255) NOT NULL, -- School name
  class_name VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(1) NOT NULL CHECK (semester IN ('1', '2')),
  materials JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_test_schedules_date ON test_schedules(date_time);
CREATE INDEX IF NOT EXISTS idx_test_schedules_location ON test_schedules(location);
CREATE INDEX IF NOT EXISTS idx_test_schedules_teacher ON test_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_test_schedules_academic_year ON test_schedules(academic_year, semester);

-- Enable RLS
ALTER TABLE test_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Test schedules are viewable by everyone" ON test_schedules
  FOR SELECT USING (true);

CREATE POLICY "Teachers can create test schedules" ON test_schedules
  FOR INSERT WITH CHECK (
    auth.uid() = teacher_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Teachers can update their own test schedules" ON test_schedules
  FOR UPDATE USING (
    auth.uid() = teacher_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Teachers can delete their own test schedules" ON test_schedules
  FOR DELETE USING (
    auth.uid() = teacher_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

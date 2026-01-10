-- Create announcements table for admin to send messages to teachers
-- Announcements will be displayed on teacher dashboard

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience VARCHAR(20) DEFAULT 'teachers' CHECK (target_audience IN ('all', 'teachers', 'students', 'parents')),
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target_audience);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(starts_at, expires_at);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone authenticated can view active announcements
CREATE POLICY "View active announcements" ON announcements
  FOR SELECT USING (
    is_active = TRUE AND
    (starts_at IS NULL OR starts_at <= NOW()) AND
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Only admins can create announcements
CREATE POLICY "Admins can create announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Only admins can update announcements
CREATE POLICY "Admins can update announcements" ON announcements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Only admins can delete announcements
CREATE POLICY "Admins can delete announcements" ON announcements
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Add comments for documentation
COMMENT ON TABLE announcements IS 'Admin announcements for teachers, students, and parents';
COMMENT ON COLUMN announcements.title IS 'Title of the announcement';
COMMENT ON COLUMN announcements.content IS 'Full content of the announcement (supports markdown)';
COMMENT ON COLUMN announcements.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN announcements.target_audience IS 'Who should see this: all, teachers, students, parents';
COMMENT ON COLUMN announcements.is_active IS 'Whether the announcement is currently active';
COMMENT ON COLUMN announcements.starts_at IS 'When the announcement becomes visible';
COMMENT ON COLUMN announcements.expires_at IS 'When the announcement expires (null = never)';

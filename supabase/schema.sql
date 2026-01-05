-- =====================================================
-- ELC Management System - Database Schema
-- Supabase Project: prmjdngeuczatlspinql
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE 1: profiles (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')),
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  photo_url TEXT,
  branch TEXT,
  teacher_notes TEXT,
  needs_attention BOOLEAN DEFAULT FALSE,
  school_origin TEXT,
  linked_student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_location_id UUID,
  assigned_subjects TEXT[] DEFAULT '{}',
  skill_levels JSONB DEFAULT '{}',
  learning_hub_subscription JSONB DEFAULT '{"isActive": false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_student ON profiles(linked_student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- TABLE 2: locations
-- =====================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  capacity INTEGER DEFAULT 30,
  level TEXT, -- 'SD', 'SMP', 'SMA'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 3: class_sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  video_url TEXT,
  description TEXT,
  materials TEXT[] DEFAULT '{}',
  skill_category TEXT NOT NULL CHECK (skill_category IN ('Listening', 'Reading', 'Writing', 'Speaking', 'Grammar', 'Vocabulary')),
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('Starter', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced')),
  has_exam BOOLEAN DEFAULT FALSE,
  exam_materials TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON class_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_datetime ON class_sessions(date_time);
CREATE INDEX IF NOT EXISTS idx_sessions_location ON class_sessions(location_id);

-- =====================================================
-- TABLE 4: session_reports
-- =====================================================
CREATE TABLE IF NOT EXISTS session_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendance_status TEXT CHECK (attendance_status IN ('PRESENT', 'ABSENT', 'LATE')),
  exam_score INTEGER CHECK (exam_score >= 0 AND exam_score <= 100),
  placement_result TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  written_score INTEGER CHECK (written_score >= 0 AND written_score <= 100),
  oral_score INTEGER CHECK (oral_score >= 0 AND oral_score <= 100),
  cefr_level TEXT,
  teacher_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_session ON session_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_student ON session_reports(student_id);

-- =====================================================
-- TABLE 5: homeworks
-- =====================================================
CREATE TABLE IF NOT EXISTS homeworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  assigned_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUBMITTED', 'GRADED')),
  submission_url TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homeworks_student ON homeworks(student_id);
CREATE INDEX IF NOT EXISTS idx_homeworks_session ON homeworks(session_id);
CREATE INDEX IF NOT EXISTS idx_homeworks_status ON homeworks(status);
CREATE INDEX IF NOT EXISTS idx_homeworks_due_date ON homeworks(due_date);

-- =====================================================
-- TABLE 6: online_modules
-- =====================================================
CREATE TABLE IF NOT EXISTS online_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  materials TEXT[] DEFAULT '{}',
  posted_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
  skill_category TEXT NOT NULL CHECK (skill_category IN ('Listening', 'Reading', 'Writing', 'Speaking', 'Grammar', 'Vocabulary')),
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('Starter', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced')),
  exams JSONB DEFAULT '[]',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_status ON online_modules(status);
CREATE INDEX IF NOT EXISTS idx_modules_skill ON online_modules(skill_category);
CREATE INDEX IF NOT EXISTS idx_modules_level ON online_modules(difficulty_level);

-- =====================================================
-- TABLE 7: student_module_progress
-- =====================================================
CREATE TABLE IF NOT EXISTS student_module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES online_modules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  completed_date TIMESTAMPTZ,
  quiz_score INTEGER CHECK (quiz_score >= 0 AND quiz_score <= 100),
  placement_result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_student ON student_module_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_module ON student_module_progress(module_id);

-- =====================================================
-- TABLE 8: level_history
-- =====================================================
CREATE TABLE IF NOT EXISTS level_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  skill_category TEXT NOT NULL CHECK (skill_category IN ('Listening', 'Reading', 'Writing', 'Speaking', 'Grammar', 'Vocabulary')),
  from_level TEXT,
  to_level TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_level_history_student ON level_history(student_id);

-- =====================================================
-- TABLE 9: olympiads
-- =====================================================
CREATE TABLE IF NOT EXISTS olympiads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'OPEN', 'CLOSED')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_date DATE,
  event_time TIME,
  event_location TEXT,
  questions JSONB DEFAULT '[]',
  reward TEXT,
  participant_count INTEGER DEFAULT 0,
  price INTEGER DEFAULT 0,
  terms TEXT,
  benefits JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_olympiads_status ON olympiads(status);
CREATE INDEX IF NOT EXISTS idx_olympiads_active ON olympiads(is_active);

-- =====================================================
-- TABLE 10: olympiad_registrations
-- =====================================================
CREATE TABLE IF NOT EXISTS olympiad_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  olympiad_id UUID NOT NULL REFERENCES olympiads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  wa TEXT NOT NULL,
  personal_wa TEXT,
  school TEXT NOT NULL,
  grade TEXT NOT NULL,
  school_origin TEXT,
  dob DATE,
  address TEXT,
  parent_name TEXT,
  parent_wa TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registrations_olympiad ON olympiad_registrations(olympiad_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON olympiad_registrations(status);

-- =====================================================
-- TABLE 11: olympiad_attempts
-- =====================================================
CREATE TABLE IF NOT EXISTS olympiad_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  olympiad_id UUID NOT NULL REFERENCES olympiads(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(olympiad_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_olympiad ON olympiad_attempts(olympiad_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON olympiad_attempts(student_id);

-- =====================================================
-- TABLE 12: placement_submissions
-- =====================================================
CREATE TABLE IF NOT EXISTS placement_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  grade TEXT NOT NULL,
  wa TEXT NOT NULL,
  personal_wa TEXT,
  score INTEGER NOT NULL,
  cefr_result TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  dob DATE,
  parent_name TEXT,
  parent_wa TEXT,
  address TEXT,
  school_origin TEXT,
  oral_test_status TEXT DEFAULT 'none' CHECK (oral_test_status IN ('none', 'booked', 'completed')),
  oral_test_date DATE,
  oral_test_time TIME,
  oral_test_score TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_email ON placement_submissions(email);
CREATE INDEX IF NOT EXISTS idx_placement_oral_status ON placement_submissions(oral_test_status);

-- =====================================================
-- TABLE 13: transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('LEARNING_HUB', 'OLYMPIAD')),
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('SUCCESS', 'PENDING', 'FAILED')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_student ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- =====================================================
-- TABLE 14: tuition_invoices
-- =====================================================
CREATE TABLE IF NOT EXISTS tuition_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  month TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'UNPAID' CHECK (status IN ('PAID', 'UNPAID')),
  due_date DATE NOT NULL,
  reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_student ON tuition_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON tuition_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_month ON tuition_invoices(month);

-- =====================================================
-- TABLE 15: news
-- =====================================================
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  featured_image TEXT NOT NULL,
  video_url TEXT,
  display_media TEXT DEFAULT 'image' CHECK (display_media IN ('image', 'video')),
  content TEXT NOT NULL,
  published_date DATE DEFAULT CURRENT_DATE,
  summary TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published);
CREATE INDEX IF NOT EXISTS idx_news_date ON news(published_date DESC);

-- =====================================================
-- TABLE 16: student_of_the_month
-- =====================================================
CREATE TABLE IF NOT EXISTS student_of_the_month (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  achievement TEXT NOT NULL,
  month_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sotm_month ON student_of_the_month(month_year);

-- =====================================================
-- TABLE 17: featured_teachers
-- =====================================================
CREATE TABLE IF NOT EXISTS featured_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_flag TEXT,
  type TEXT CHECK (type IN ('native', 'local')),
  photo_url TEXT NOT NULL,
  certifications TEXT[] DEFAULT '{}',
  experience INTEGER,
  specialty TEXT,
  quote TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_teachers_active ON featured_teachers(is_active);

-- =====================================================
-- TABLE 18: teacher_applications
-- =====================================================
CREATE TABLE IF NOT EXISTS teacher_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  experience INTEGER NOT NULL,
  has_degree BOOLEAN DEFAULT FALSE,
  country TEXT NOT NULL,
  motivation TEXT,
  salary INTEGER,
  type TEXT CHECK (type IN ('local', 'native')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'INTERVIEWING', 'ACCEPTED', 'REJECTED')),
  photo_url TEXT,
  police_check_url TEXT,
  applied_date DATE DEFAULT CURRENT_DATE,
  is_converted BOOLEAN DEFAULT FALSE,
  days_per_week INTEGER,
  hours_per_week INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON teacher_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_type ON teacher_applications(type);

-- =====================================================
-- TABLE 19: site_settings (single row)
-- =====================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_color TEXT DEFAULT '#2563eb',
  accent_color TEXT DEFAULT '#facc15',
  video_url TEXT,
  video_title TEXT DEFAULT 'Learning Tip of the Week',
  video_description TEXT DEFAULT 'Discover how our adaptive logic helps you master English faster.',
  video_orientation TEXT DEFAULT 'landscape' CHECK (video_orientation IN ('landscape', 'portrait')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 20: feedback
-- =====================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);

-- =====================================================
-- TABLE 21: quiz_questions (for Kahoot/Adaptive Quiz)
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('MULTIPLE_CHOICE', 'ESSAY')),
  options TEXT[] DEFAULT '{}',
  correct_answer TEXT,
  correct_answer_index INTEGER,
  time_limit INTEGER DEFAULT 30,
  skill_category TEXT CHECK (skill_category IN ('Listening', 'Reading', 'Writing', 'Speaking', 'Grammar', 'Vocabulary')),
  difficulty_level TEXT CHECK (difficulty_level IN ('Starter', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 22: kahoot_quizzes
-- =====================================================
CREATE TABLE IF NOT EXISTS kahoot_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  questions JSONB DEFAULT '[]',
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kahoot_active ON kahoot_quizzes(is_active);

-- =====================================================
-- TABLE 23: quiz_attempts
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id UUID,
  skill_category TEXT NOT NULL,
  attempted_difficulty TEXT NOT NULL,
  final_placement TEXT NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);

-- =====================================================
-- TABLE 24: placement_questions
-- =====================================================
CREATE TABLE IF NOT EXISTS placement_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer_index INTEGER NOT NULL,
  weight INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 25: oral_test_slots
-- =====================================================
CREATE TABLE IF NOT EXISTS oral_test_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  booked_by UUID REFERENCES placement_submissions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oral_slots_date ON oral_test_slots(date);
CREATE INDEX IF NOT EXISTS idx_oral_slots_booked ON oral_test_slots(is_booked);

-- =====================================================
-- TABLE: teacher_attendance
-- =====================================================
CREATE TABLE IF NOT EXISTS teacher_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'LATE', 'EARLY_LEAVE')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_teacher ON teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON teacher_attendance(check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_location ON teacher_attendance(location_id);

-- =====================================================
-- FUNCTIONS: Auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON class_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON session_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_homeworks_updated_at BEFORE UPDATE ON homeworks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON online_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON student_module_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_olympiads_updated_at BEFORE UPDATE ON olympiads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_placement_updated_at BEFORE UPDATE ON placement_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON tuition_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON featured_teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON teacher_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kahoot_updated_at BEFORE UPDATE ON kahoot_quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON teacher_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA: Site Settings
-- =====================================================
INSERT INTO site_settings (id, video_title, video_description)
VALUES (uuid_generate_v4(), 'Learning Tip of the Week', 'Discover how our adaptive logic helps you master English faster.')
ON CONFLICT DO NOTHING;

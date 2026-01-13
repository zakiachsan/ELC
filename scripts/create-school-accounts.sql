-- =====================================================
-- SCHOOL CMS - Complete Setup SQL
-- Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: Update role constraint to include SCHOOL
-- =====================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SCHOOL'));

-- STEP 2: Create school_teacher_reviews table
-- =====================================================
CREATE TABLE IF NOT EXISTS school_teacher_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_month DATE NOT NULL,

  -- 10 criteria (scale 1-10)
  academic_expertise_rating INTEGER NOT NULL CHECK (academic_expertise_rating BETWEEN 1 AND 10),
  communication_rating INTEGER NOT NULL CHECK (communication_rating BETWEEN 1 AND 10),
  empathy_rating INTEGER NOT NULL CHECK (empathy_rating BETWEEN 1 AND 10),
  collaboration_rating INTEGER NOT NULL CHECK (collaboration_rating BETWEEN 1 AND 10),
  dedication_rating INTEGER NOT NULL CHECK (dedication_rating BETWEEN 1 AND 10),
  flexibility_rating INTEGER NOT NULL CHECK (flexibility_rating BETWEEN 1 AND 10),
  classroom_management_rating INTEGER NOT NULL CHECK (classroom_management_rating BETWEEN 1 AND 10),
  creativity_rating INTEGER NOT NULL CHECK (creativity_rating BETWEEN 1 AND 10),
  integrity_rating INTEGER NOT NULL CHECK (integrity_rating BETWEEN 1 AND 10),
  inclusive_education_rating INTEGER NOT NULL CHECK (inclusive_education_rating BETWEEN 1 AND 10),

  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(teacher_id, school_id, review_month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_school_teacher_reviews_teacher ON school_teacher_reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_school_teacher_reviews_school ON school_teacher_reviews(school_id);
CREATE INDEX IF NOT EXISTS idx_school_teacher_reviews_month ON school_teacher_reviews(review_month);

-- STEP 3: Enable RLS
-- =====================================================
ALTER TABLE school_teacher_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "School can view own reviews" ON school_teacher_reviews;
DROP POLICY IF EXISTS "School can create reviews" ON school_teacher_reviews;
DROP POLICY IF EXISTS "Admin can view all" ON school_teacher_reviews;
DROP POLICY IF EXISTS "Teacher can view own reviews" ON school_teacher_reviews;

-- Create policies
CREATE POLICY "School can view own reviews" ON school_teacher_reviews
  FOR SELECT USING (
    school_id IN (SELECT assigned_location_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "School can create reviews" ON school_teacher_reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    school_id IN (SELECT assigned_location_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "School can update own reviews" ON school_teacher_reviews
  FOR UPDATE USING (
    reviewer_id = auth.uid() AND
    school_id IN (SELECT assigned_location_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admin can do all" ON school_teacher_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Teacher can view own reviews" ON school_teacher_reviews
  FOR SELECT USING (
    teacher_id = auth.uid()
  );

-- STEP 4: Add show_teacher_of_month setting
-- =====================================================
INSERT INTO site_settings (setting_key, setting_value, updated_at)
VALUES ('teacher_of_month', '{"showOnHomepage": true}'::jsonb, NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- DONE! Schema is ready.
-- =====================================================
-- Now run the script below to create school accounts
-- Or create them manually in Supabase Auth Dashboard

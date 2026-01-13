-- =====================================================
-- Migration: Add School CMS Feature
-- Description: Add SCHOOL role, school_teacher_reviews table, and show_teacher_of_month setting
-- =====================================================

-- 1. Add SCHOOL role to profiles constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SCHOOL'));

-- 2. Add show_teacher_of_month to site_settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS show_teacher_of_month BOOLEAN DEFAULT true;

-- 3. Create school_teacher_reviews table
CREATE TABLE IF NOT EXISTS school_teacher_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_month DATE NOT NULL, -- First day of month (e.g., 2025-01-01)

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

  -- One review per teacher per school per month
  UNIQUE(teacher_id, school_id, review_month)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_school_teacher_reviews_teacher ON school_teacher_reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_school_teacher_reviews_school ON school_teacher_reviews(school_id);
CREATE INDEX IF NOT EXISTS idx_school_teacher_reviews_month ON school_teacher_reviews(review_month);
CREATE INDEX IF NOT EXISTS idx_school_teacher_reviews_reviewer ON school_teacher_reviews(reviewer_id);

-- 5. Enable RLS
ALTER TABLE school_teacher_reviews ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Schools can view reviews for their own school
CREATE POLICY "school_view_own_reviews" ON school_teacher_reviews
  FOR SELECT USING (
    school_id IN (
      SELECT assigned_location_id::uuid FROM profiles WHERE id = auth.uid() AND role = 'SCHOOL'
    )
  );

-- Schools can create reviews for their own school
CREATE POLICY "school_create_reviews" ON school_teacher_reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    school_id IN (
      SELECT assigned_location_id::uuid FROM profiles WHERE id = auth.uid() AND role = 'SCHOOL'
    )
  );

-- Schools can update their own reviews
CREATE POLICY "school_update_own_reviews" ON school_teacher_reviews
  FOR UPDATE USING (
    reviewer_id = auth.uid()
  );

-- Admin can do everything
CREATE POLICY "admin_full_access_school_reviews" ON school_teacher_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Teachers can view their own reviews (read-only)
CREATE POLICY "teacher_view_own_reviews" ON school_teacher_reviews
  FOR SELECT USING (
    teacher_id = auth.uid()
  );

-- 7. Create trigger for updated_at
CREATE TRIGGER update_school_teacher_reviews_updated_at
  BEFORE UPDATE ON school_teacher_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Update existing site_settings row if exists
UPDATE site_settings SET show_teacher_of_month = true WHERE show_teacher_of_month IS NULL;

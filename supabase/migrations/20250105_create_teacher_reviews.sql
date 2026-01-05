-- Create teacher_reviews table for monthly teacher reviews from students and parents
CREATE TABLE IF NOT EXISTS teacher_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_role VARCHAR(20) NOT NULL CHECK (reviewer_role IN ('STUDENT', 'PARENT')),

  -- Review month (stored as first day of the month)
  review_month DATE NOT NULL,

  -- Rating parameters (1-5 scale)
  technology_rating INTEGER NOT NULL CHECK (technology_rating >= 1 AND technology_rating <= 5),
  punctuality_rating INTEGER NOT NULL CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  material_quality_rating INTEGER NOT NULL CHECK (material_quality_rating >= 1 AND material_quality_rating <= 5),
  english_encouragement_rating INTEGER NOT NULL CHECK (english_encouragement_rating >= 1 AND english_encouragement_rating <= 5),
  teaching_topics_rating INTEGER NOT NULL CHECK (teaching_topics_rating >= 1 AND teaching_topics_rating <= 5),
  pedagogic_rating INTEGER NOT NULL CHECK (pedagogic_rating >= 1 AND pedagogic_rating <= 5),

  -- Additional feedback
  comments TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one review per reviewer per teacher per month
  UNIQUE(teacher_id, reviewer_id, review_month)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_teacher ON teacher_reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_reviewer ON teacher_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_month ON teacher_reviews(review_month);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_role ON teacher_reviews(reviewer_role);

-- Enable RLS
ALTER TABLE teacher_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view reviews (admins need to see all)
CREATE POLICY "Reviews are viewable by everyone" ON teacher_reviews
  FOR SELECT USING (true);

-- Students and Parents can create their own reviews
CREATE POLICY "Users can create their own reviews" ON teacher_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
  );

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON teacher_reviews
  FOR UPDATE USING (
    auth.uid() = reviewer_id
  );

-- Users can delete their own reviews, or admins can delete any
CREATE POLICY "Users can delete their own reviews" ON teacher_reviews
  FOR DELETE USING (
    auth.uid() = reviewer_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

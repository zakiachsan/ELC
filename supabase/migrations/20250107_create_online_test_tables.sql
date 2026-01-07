-- Create tables for Online Test System
-- Supports: Multiple Choice & Essay questions, Auto-scoring for MC

-- ============================================
-- 1. TEST QUESTIONS TABLE
-- Questions linked to test_schedules
-- ============================================
CREATE TABLE IF NOT EXISTS test_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_schedule_id UUID NOT NULL REFERENCES test_schedules(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL DEFAULT 1,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('MULTIPLE_CHOICE', 'ESSAY')),
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb, -- For MC: ["Option A", "Option B", "Option C", "Option D"]
  correct_answer_index INTEGER, -- For MC: 0-based index (0, 1, 2, 3)
  answer_key TEXT, -- For Essay: expected answer or rubric
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TEST SUBMISSIONS TABLE
-- Tracks student test-taking session
-- ============================================
CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_schedule_id UUID NOT NULL REFERENCES test_schedules(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'GRADED')),
  total_score DECIMAL(5,2),
  max_score INTEGER,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_schedule_id, student_id) -- One submission per student per test
);

-- ============================================
-- 3. TEST ANSWERS TABLE
-- Individual answers for each question
-- ============================================
CREATE TABLE IF NOT EXISTS test_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES test_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  selected_option INTEGER, -- For MC: 0-based index of selected option
  answer_text TEXT, -- For Essay: student's written answer
  is_correct BOOLEAN, -- Auto-calculated for MC
  score DECIMAL(5,2) DEFAULT 0, -- Points earned for this answer
  teacher_feedback TEXT, -- Optional feedback from teacher
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, question_id) -- One answer per question per submission
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_test_questions_test_schedule ON test_questions(test_schedule_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_order ON test_questions(test_schedule_id, question_order);
CREATE INDEX IF NOT EXISTS idx_test_submissions_test_schedule ON test_submissions(test_schedule_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_student ON test_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_status ON test_submissions(status);
CREATE INDEX IF NOT EXISTS idx_test_answers_submission ON test_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_question ON test_answers(question_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_answers ENABLE ROW LEVEL SECURITY;

-- Test Questions Policies
CREATE POLICY "Test questions viewable by authenticated users" ON test_questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers/Admins can create test questions" ON test_questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'ADMIN'))
  );

CREATE POLICY "Teachers/Admins can update test questions" ON test_questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'ADMIN'))
  );

CREATE POLICY "Teachers/Admins can delete test questions" ON test_questions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'ADMIN'))
  );

-- Test Submissions Policies
CREATE POLICY "Students can view their own submissions" ON test_submissions
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'ADMIN', 'PARENT'))
  );

CREATE POLICY "Students can create their own submissions" ON test_submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own in-progress submissions" ON test_submissions
  FOR UPDATE USING (
    (student_id = auth.uid() AND status = 'IN_PROGRESS') OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'ADMIN'))
  );

-- Test Answers Policies
CREATE POLICY "Users can view related test answers" ON test_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_submissions ts
      WHERE ts.id = submission_id AND (
        ts.student_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'ADMIN', 'PARENT'))
      )
    )
  );

CREATE POLICY "Students can create answers for their submissions" ON test_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_submissions ts
      WHERE ts.id = submission_id AND ts.student_id = auth.uid() AND ts.status = 'IN_PROGRESS'
    )
  );

CREATE POLICY "Students/Teachers can update answers" ON test_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM test_submissions ts
      WHERE ts.id = submission_id AND (
        (ts.student_id = auth.uid() AND ts.status = 'IN_PROGRESS') OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'ADMIN'))
      )
    )
  );

-- ============================================
-- HELPER FUNCTION: Auto-score MC answers
-- ============================================
CREATE OR REPLACE FUNCTION auto_score_mc_answer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-score if it's a multiple choice question
  IF NEW.selected_option IS NOT NULL THEN
    SELECT
      CASE WHEN tq.correct_answer_index = NEW.selected_option THEN TRUE ELSE FALSE END,
      CASE WHEN tq.correct_answer_index = NEW.selected_option THEN tq.points ELSE 0 END
    INTO NEW.is_correct, NEW.score
    FROM test_questions tq
    WHERE tq.id = NEW.question_id AND tq.question_type = 'MULTIPLE_CHOICE';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_score_mc
  BEFORE INSERT OR UPDATE ON test_answers
  FOR EACH ROW
  EXECUTE FUNCTION auto_score_mc_answer();

-- ============================================
-- HELPER FUNCTION: Update submission total score
-- ============================================
CREATE OR REPLACE FUNCTION update_submission_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE test_submissions
  SET
    total_score = (
      SELECT COALESCE(SUM(score), 0)
      FROM test_answers
      WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id)
    ),
    max_score = (
      SELECT COALESCE(SUM(tq.points), 0)
      FROM test_questions tq
      JOIN test_submissions ts ON ts.test_schedule_id = tq.test_schedule_id
      WHERE ts.id = COALESCE(NEW.submission_id, OLD.submission_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.submission_id, OLD.submission_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_submission_score
  AFTER INSERT OR UPDATE OR DELETE ON test_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_submission_score();

-- ============================================
-- Add columns to test_schedules
-- ============================================
ALTER TABLE test_schedules
ADD COLUMN IF NOT EXISTS has_online_test BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quiz_number INTEGER CHECK (quiz_number IN (1, 2, 3));

COMMENT ON COLUMN test_schedules.has_online_test IS 'Whether this test has online questions (vs just info/schedule)';
COMMENT ON COLUMN test_schedules.is_published IS 'Whether the test is published and visible to students';
COMMENT ON COLUMN test_schedules.quiz_number IS 'For Quiz type: 1, 2, or 3 - maps to student_grades quiz1/quiz2/quiz3 fields';

-- ============================================
-- HELPER FUNCTION: Sync test score to student_grades
-- When a test submission is graded, update the corresponding
-- field in student_grades (quiz1/quiz2/quiz3/mid/final)
-- ============================================
CREATE OR REPLACE FUNCTION sync_test_score_to_student_grades()
RETURNS TRIGGER AS $$
DECLARE
  v_test_schedule test_schedules%ROWTYPE;
  v_student profiles%ROWTYPE;
  v_grade_record_id UUID;
  v_score_percentage DECIMAL(5,2);
BEGIN
  -- Only trigger when status changes to GRADED
  IF NEW.status = 'GRADED' AND (OLD.status IS NULL OR OLD.status != 'GRADED') THEN
    -- Get test schedule info
    SELECT * INTO v_test_schedule FROM test_schedules WHERE id = NEW.test_schedule_id;

    -- Get student info
    SELECT * INTO v_student FROM profiles WHERE id = NEW.student_id;

    -- Calculate score percentage (0-100)
    IF NEW.max_score IS NOT NULL AND NEW.max_score > 0 THEN
      v_score_percentage := (COALESCE(NEW.total_score, 0) / NEW.max_score::DECIMAL) * 100;
    ELSE
      v_score_percentage := COALESCE(NEW.total_score, 0);
    END IF;

    -- Find or create student_grades record
    SELECT id INTO v_grade_record_id
    FROM student_grades
    WHERE student_id = NEW.student_id
      AND academic_year = v_test_schedule.academic_year
      AND semester = v_test_schedule.semester
      AND school_name = v_test_schedule.location
      AND class_name = v_test_schedule.class_name;

    IF v_grade_record_id IS NULL THEN
      -- Create new grade record
      INSERT INTO student_grades (
        student_id, academic_year, semester, school_name, class_name
      ) VALUES (
        NEW.student_id, v_test_schedule.academic_year, v_test_schedule.semester,
        v_test_schedule.location, v_test_schedule.class_name
      ) RETURNING id INTO v_grade_record_id;
    END IF;

    -- Update the appropriate score field based on test type
    IF v_test_schedule.test_type = 'QUIZ' THEN
      -- Update quiz1, quiz2, or quiz3 based on quiz_number
      IF v_test_schedule.quiz_number = 1 THEN
        UPDATE student_grades SET quiz1 = v_score_percentage, updated_at = NOW() WHERE id = v_grade_record_id;
      ELSIF v_test_schedule.quiz_number = 2 THEN
        UPDATE student_grades SET quiz2 = v_score_percentage, updated_at = NOW() WHERE id = v_grade_record_id;
      ELSIF v_test_schedule.quiz_number = 3 THEN
        UPDATE student_grades SET quiz3 = v_score_percentage, updated_at = NOW() WHERE id = v_grade_record_id;
      END IF;
    ELSIF v_test_schedule.test_type = 'MID_SEMESTER' THEN
      UPDATE student_grades SET mid = v_score_percentage, updated_at = NOW() WHERE id = v_grade_record_id;
    ELSIF v_test_schedule.test_type = 'FINAL_SEMESTER' THEN
      UPDATE student_grades SET final = v_score_percentage, updated_at = NOW() WHERE id = v_grade_record_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_test_score_to_grades ON test_submissions;
CREATE TRIGGER trigger_sync_test_score_to_grades
  AFTER UPDATE ON test_submissions
  FOR EACH ROW
  EXECUTE FUNCTION sync_test_score_to_student_grades();

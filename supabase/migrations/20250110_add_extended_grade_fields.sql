-- Add extended grade fields for Regular and Bilingual classes
-- Regular classes: speaking, listening (2 additional fields)
-- Bilingual classes: speaking, listening, reading, writing, maths, science (6 additional fields)

-- Add new columns to student_grades table
ALTER TABLE student_grades
ADD COLUMN IF NOT EXISTS speaking INTEGER CHECK (speaking >= 0 AND speaking <= 100),
ADD COLUMN IF NOT EXISTS listening INTEGER CHECK (listening >= 0 AND listening <= 100),
ADD COLUMN IF NOT EXISTS reading INTEGER CHECK (reading >= 0 AND reading <= 100),
ADD COLUMN IF NOT EXISTS writing INTEGER CHECK (writing >= 0 AND writing <= 100),
ADD COLUMN IF NOT EXISTS maths INTEGER CHECK (maths >= 0 AND maths <= 100),
ADD COLUMN IF NOT EXISTS science INTEGER CHECK (science >= 0 AND science <= 100);

-- Add comments for documentation
COMMENT ON COLUMN student_grades.speaking IS 'Speaking score (0-100) - used for both Regular and Bilingual classes';
COMMENT ON COLUMN student_grades.listening IS 'Listening score (0-100) - used for both Regular and Bilingual classes';
COMMENT ON COLUMN student_grades.reading IS 'Reading score (0-100) - used for Bilingual classes only';
COMMENT ON COLUMN student_grades.writing IS 'Writing score (0-100) - used for Bilingual classes only';
COMMENT ON COLUMN student_grades.maths IS 'Maths score (0-100) - used for Bilingual classes only';
COMMENT ON COLUMN student_grades.science IS 'Science score (0-100) - used for Bilingual classes only';

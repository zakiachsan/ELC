-- Add lesson plan fields to class_sessions table
-- These fields transform schedules into proper lesson plans

-- CEFR Level for the lesson (A1, A2, B1, B2, C1, C2)
ALTER TABLE class_sessions
ADD COLUMN IF NOT EXISTS cefr_level VARCHAR(10);

-- Materials needed (separate from uploaded materials array)
ALTER TABLE class_sessions
ADD COLUMN IF NOT EXISTS materials_needed TEXT;

-- Learning objectives for the lesson
ALTER TABLE class_sessions
ADD COLUMN IF NOT EXISTS learning_objectives TEXT;

-- Vocabulary section - 3 sub-fields
ALTER TABLE class_sessions
ADD COLUMN IF NOT EXISTS vocabulary_verb TEXT;

ALTER TABLE class_sessions
ADD COLUMN IF NOT EXISTS vocabulary_noun TEXT;

ALTER TABLE class_sessions
ADD COLUMN IF NOT EXISTS vocabulary_adjective TEXT;

-- Add comments for documentation
COMMENT ON COLUMN class_sessions.cefr_level IS 'CEFR level for the lesson (A1, A2, B1, B2, C1, C2)';
COMMENT ON COLUMN class_sessions.materials_needed IS 'Text description of materials needed for the lesson';
COMMENT ON COLUMN class_sessions.learning_objectives IS 'Learning objectives for the lesson';
COMMENT ON COLUMN class_sessions.vocabulary_verb IS 'Vocabulary verbs to teach in the lesson';
COMMENT ON COLUMN class_sessions.vocabulary_noun IS 'Vocabulary nouns to teach in the lesson';
COMMENT ON COLUMN class_sessions.vocabulary_adjective IS 'Vocabulary adjectives to teach in the lesson';

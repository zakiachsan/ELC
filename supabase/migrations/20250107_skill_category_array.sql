-- Migration: Change skill_category from TEXT to TEXT[] (array)
-- This allows sessions to have multiple skill categories

-- Step 1: Drop the CHECK constraint
ALTER TABLE class_sessions DROP CONSTRAINT IF EXISTS class_sessions_skill_category_check;

-- Step 2: Rename old column temporarily
ALTER TABLE class_sessions RENAME COLUMN skill_category TO skill_category_old;

-- Step 3: Add new array column
ALTER TABLE class_sessions ADD COLUMN skill_category TEXT[] DEFAULT '{}';

-- Step 4: Migrate existing data (convert single value to array)
UPDATE class_sessions
SET skill_category = ARRAY[skill_category_old]
WHERE skill_category_old IS NOT NULL;

-- Step 5: Drop old column
ALTER TABLE class_sessions DROP COLUMN skill_category_old;

-- Step 6: Add NOT NULL constraint
ALTER TABLE class_sessions ALTER COLUMN skill_category SET NOT NULL;

-- Step 7: Add CHECK constraint for valid values in array
-- Each element must be one of the valid skill categories
ALTER TABLE class_sessions ADD CONSTRAINT class_sessions_skill_category_check
CHECK (skill_category <@ ARRAY['Listening', 'Reading', 'Writing', 'Speaking', 'Grammar', 'Vocabulary']::TEXT[]);

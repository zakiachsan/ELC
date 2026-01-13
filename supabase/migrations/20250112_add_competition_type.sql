-- Add competition_type field to olympiads table
-- This supports the ELC's Competition feature with sub-types:
-- OLYMPIAD, SPELLING_BEE, SPEED_COMPETITION, STORY_TELLING

ALTER TABLE olympiads
ADD COLUMN IF NOT EXISTS competition_type TEXT DEFAULT 'OLYMPIAD'
CHECK (competition_type IN ('OLYMPIAD', 'SPELLING_BEE', 'SPEED_COMPETITION', 'STORY_TELLING'));

-- Update existing records to have OLYMPIAD type
UPDATE olympiads SET competition_type = 'OLYMPIAD' WHERE competition_type IS NULL;

-- Create index for competition type
CREATE INDEX IF NOT EXISTS idx_olympiads_competition_type ON olympiads(competition_type);

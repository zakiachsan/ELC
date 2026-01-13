-- Add new fields to kahoot_participants table for collecting more participant information
-- Fields: phone (nomor WA), position (jabatan), school (asal sekolah)

ALTER TABLE kahoot_participants
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS school TEXT;

-- Add comment for documentation
COMMENT ON COLUMN kahoot_participants.phone IS 'WhatsApp number of the participant';
COMMENT ON COLUMN kahoot_participants.position IS 'Position/role of the participant (e.g., Guru, Kepala Sekolah, Siswa)';
COMMENT ON COLUMN kahoot_participants.school IS 'School origin of the participant';

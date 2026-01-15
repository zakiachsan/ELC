-- Fix Mr Gavin - CORRECT class names (matching classes table)
-- Class names in DB don't include "(BILINGUAL)" - that's in class_type column

BEGIN;

UPDATE profiles
SET assigned_classes = ARRAY[
    -- TK ABDI SISWA BINTARO (Bilingual TK)
    'TK BILINGUAL',
    -- SD TARAKANITA (Regular kelas 1, 6)
    'KELAS 1 A', 'KELAS 1B', 'KELAS 1 C', 'KELAS 1 D',
    'KELAS 6A', 'KELAS 6B', 'KELAS 6C', 'KELAS 6D',
    -- SD ABDI SISWA BINTARO (Bilingual kelas 1, 2, 3, 4)
    -- NOTE: Class names are just "1D", "2D" etc - NOT "1D (BILINGUAL)"
    '1D', '2D', '3D', '4D'
],
    updated_at = NOW()
WHERE id = 'a918df6b-12e8-4e03-84f5-3b94fa565b42';

-- Verify
SELECT name, assigned_classes
FROM profiles
WHERE id = 'a918df6b-12e8-4e03-84f5-3b94fa565b42';

COMMIT;

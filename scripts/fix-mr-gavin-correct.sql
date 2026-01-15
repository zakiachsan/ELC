-- Fix Mr Gavin - Correct class assignments based on CSV
-- CSV says:
-- TK Abdi Siswa Bintaro - bilingual TK
-- SD Tarakanita Citra Raya - Regular kelas 1, 6
-- SD Abdi Siswa Bintaro - bilingual kelas 1, 2, 3, 4

BEGIN;

UPDATE profiles
SET assigned_classes = ARRAY[
    -- TK ABDI SISWA BINTARO (Bilingual TK)
    'TK BILINGUAL',
    -- SD TARAKANITA (Regular kelas 1, 6)
    'KELAS 1 A', 'KELAS 1B', 'KELAS 1 C', 'KELAS 1 D',
    'KELAS 6A', 'KELAS 6B', 'KELAS 6C', 'KELAS 6D',
    -- SD ABDI SISWA BINTARO (Bilingual kelas 1, 2, 3, 4)
    '1D (BILINGUAL)', '2D (BILINGUAL)', '3D (BILINGUAL)', '4D (BILINGUAL)'
],
    updated_at = NOW()
WHERE id = 'a918df6b-12e8-4e03-84f5-3b94fa565b42';

-- Verify
SELECT name, array_length(assigned_classes, 1) as class_count, assigned_classes
FROM profiles
WHERE id = 'a918df6b-12e8-4e03-84f5-3b94fa565b42';

COMMIT;

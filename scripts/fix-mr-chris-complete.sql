-- Fix SD BHAKTI Teachers - Add ALL class sections (A,B,C,D)

BEGIN;

-- Mr Chris (SD BHAKTI) - kelas 2,3,4,5,6 (SEMUA section)
UPDATE profiles
SET assigned_classes = ARRAY[
    -- Kelas 2
    'KELAS 2 B', 'KELAS 2A', 'KELAS 2C', 'KELAS 2D',
    -- Kelas 3
    'KELAS 3 C', 'KELAS 3A', 'KELAS 3B', 'KELAS 3D',
    -- Kelas 4
    'KELAS 4 A', 'KELAS 4B', 'KELAS 4C', 'KELAS 4D',
    -- Kelas 5
    'KELAS 5A', 'KELAS 5B', 'KELAS 5C',
    -- Kelas 6
    'KELAS 6A', 'KELAS 6B', 'KELAS 6C', 'KELAS 6D'
],
    updated_at = NOW()
WHERE id = 'c4bd34b6-1f9a-4c4f-8721-056f85054144';

-- Ms Divine (SD BHAKTI) - kelas 1,4,5,6 (SEMUA section)
UPDATE profiles
SET assigned_classes = ARRAY[
    -- Kelas 1
    'KELAS 1 A', 'KELAS 1 B', 'KELAS 1 C', 'KELAS 1 D',
    -- Kelas 4
    'KELAS 4 A', 'KELAS 4B', 'KELAS 4C', 'KELAS 4D',
    -- Kelas 5
    'KELAS 5A', 'KELAS 5B', 'KELAS 5C',
    -- Kelas 6
    'KELAS 6A', 'KELAS 6B', 'KELAS 6C', 'KELAS 6D'
],
    updated_at = NOW()
WHERE id = 'f57820c3-4620-48d2-86be-7e7e632ca99b';

-- Ms Jeni (SD BHAKTI) - kelas 1,4,5,6 (SEMUA section)
UPDATE profiles
SET assigned_classes = ARRAY[
    -- Kelas 1
    'KELAS 1 A', 'KELAS 1 B', 'KELAS 1 C', 'KELAS 1 D',
    -- Kelas 4
    'KELAS 4 A', 'KELAS 4B', 'KELAS 4C', 'KELAS 4D',
    -- Kelas 5
    'KELAS 5A', 'KELAS 5B', 'KELAS 5C',
    -- Kelas 6
    'KELAS 6A', 'KELAS 6B', 'KELAS 6C', 'KELAS 6D'
],
    updated_at = NOW()
WHERE id = '629be629-3785-4c05-88dc-a44a80d8a9a7';

-- Verify
SELECT name, array_length(assigned_classes, 1) as class_count, assigned_classes
FROM profiles
WHERE id IN (
    'c4bd34b6-1f9a-4c4f-8721-056f85054144',  -- Mr Chris
    'f57820c3-4620-48d2-86be-7e7e632ca99b',  -- Ms Divine
    '629be629-3785-4c05-88dc-a44a80d8a9a7'   -- Ms Jeni
)
ORDER BY name;

COMMIT;

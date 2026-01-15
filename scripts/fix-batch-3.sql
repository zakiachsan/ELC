-- =====================================================
-- FIX BATCH 3 - Remaining Teachers
-- =====================================================

BEGIN;

-- =====================================================
-- Mr. Babur (SMP BHK, SMA BHK)
-- CSV: kelas 7,8,9 di SMP, kelas 10,11 di SMA
-- Format: KELAS 7A, KELAS 10-1, etc.
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SMP BHK (7, 8, 9)
    'KELAS 7A', 'KELAS 7B', 'KELAS 7C', 'KELAS 7D',
    'KELAS 8A', 'KELAS 8B', 'KELAS 8C', 'KELAS 8D',
    'KELAS 9A', 'KELAS 9B', 'KELAS 9C', 'KELAS 9D',
    -- SMA BHK (10, 11)
    'KELAS 10-1', 'KELAS 10-2', 'KELAS 10-3',
    'KELAS 11-1', 'KELAS 11-2', 'KELAS 11-3', 'KELAS 11-4'
],
    updated_at = NOW()
WHERE id = 'eb4f7da4-c6b1-47a4-8c74-4cd1688df7b2';

-- =====================================================
-- Mr Asib (SMP ABDI SISWA PATRA, SMA ABDI SISWA PATRA, SMP SANTA MARIA)
-- CSV: kelas 7,8,9 di semua SMP, kelas 10,11,12 di SMA
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SMP ABDI SISWA PATRA (7, 8, 9)
    '7A', '7B', '7C', '7D',
    '8A', '8B', '8C', '8D',
    '9A', '9B', '9C', '9D',
    -- SMA ABDI SISWA PATRA (10, 11, 12) - format KELAS 10-1
    'KELAS 10-1', 'KELAS 10-2',
    'KELAS 11-1', 'KELAS 11-2',
    'KELAS 12-1', 'KELAS 12-2',
    -- SMP SANTA MARIA (7, 8, 9) - format kelas 7 A
    'kelas 7 A', 'kelas 7 B',
    'kelas 8A', 'KELAS 8B',
    'KELAS 9A', 'KELAS 9B'
],
    updated_at = NOW()
WHERE id = '644c2ff7-ea2d-4e1a-8d06-a1bb4ee1bef1';

-- =====================================================
-- Mr Mat (TK/SD/SMP ST VINCENTIUS)
-- CSV: TK, kelas 1-6 di SD, kelas 7-9 di SMP
-- Format: KELAS 1 A, KELAS 7-1, TK A-1
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- TK ST VINCENTIUS
    'TK A-1', 'TK A-2', 'TK B-1', 'TK B-2',
    -- SD ST VINCENTIUS (1-6)
    'KELAS 1 A', 'KELAS 1 B', 'KELAS 1 C',
    'KELAS 2A', 'KELAS 2B', 'KELAS 2C',
    'KELAS 3A', 'KELAS 3B',
    'KELAS 4A', 'KELAS 4B',
    'KELAS 5A', 'KELAS 5B',
    'KELAS 6A', 'KELAS 6B', 'KELAS 6C',
    -- SMP ST VINCENTIUS (7-9) - format KELAS 7-1
    'KELAS 7-1', 'KELAS 7-2', 'KELAS 7-3',
    'KELAS 8-1', 'KELAS 8-2', 'KELAS 8-3',
    'KELAS 9-1', 'KELAS 9-2', 'KELAS 9-3'
],
    updated_at = NOW()
WHERE id = 'e65d4391-b76f-4f19-9a5c-7902480f93bd';

-- =====================================================
-- Mr Mo (SD ABDI SISWA BINTARO, SD TARAKANITA, SMP TARAKANITA)
-- CSV: kelas 5 di SD Abdi Siswa, kelas 2-5 di SD Tarakanita, kelas 7-9 di SMP Tarakanita
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD ABDI SISWA BINTARO (kelas 5)
    '5A', '5B', '5C', '5D',
    -- SD TARAKANITA (kelas 2, 3, 4, 5)
    'KELAS 2A', 'KELAS 2B', 'KELAS 2C', 'KELAS 2D',
    'KELAS 3A', 'KELAS 3B', 'KELAS 3C', 'KELAS 3D',
    'KELAS 4A', 'KELAS 4B', 'KELAS 4C', 'KELAS 4D',
    'KELAS 5A', 'KELAS 5B', 'KELAS 5C', 'KELAS 5D',
    -- SMP TARAKANITA (kelas 7, 8, 9)
    'KELAS 7A', 'KELAS 7B', 'KELAS 7C', 'KELAS 7D', 'KELAS 7E',
    'KELAS 8A', 'KELAS 8B', 'KELAS 8C', 'KELAS 8D',
    'KELAS 9A', 'KELAS 9B', 'KELAS 9C', 'KELAS 9D'
],
    updated_at = NOW()
WHERE id = '0091b3a4-bd6d-4d7f-8814-5960fe3769ec';

-- =====================================================
-- Mr Aloysha (SMP CHARITAS JKT, SMK SANTA MARIA)
-- CSV: kelas 7,8,9 di SMP Charitas, kelas 10,11 di SMK Santa Maria
-- Note: SMK Santa Maria uses vocational classes (X CULINARY, etc.)
-- Simplified to SMP only for now since SMK classes are vocational-specific
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SMP CHARITAS JKT (7, 8, 9)
    'kelas 7A', 'kelas 7B', 'KELAS 7C',
    'KELAS 8A', 'KELAS 8B',
    'KELAS 9A', 'KELAS 9B'
],
    updated_at = NOW()
WHERE id = '98add192-534a-4bf3-b66b-c09bfdd3298d';

-- =====================================================
-- Ms Glarace (SMP MARSUDIRINI)
-- CSV: kelas 7,8,9
-- SMP MARSUDIRINI has many classes (7A-7I, 8A-8I, 9A-9H)
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    '7A', '7B', '7C', '7D', '7E', '7F', '7G', '7H', '7I',
    '8A', '8B', '8C', '8D', '8E', '8F', '8G', '8H', '8I',
    '9A', '9B', '9C', '9D', '9E', '9F', '9G', '9H'
],
    updated_at = NOW()
WHERE id = '0e12a455-22b4-429d-a6f1-0475c7ea6d9f';

-- =====================================================
-- Verify changes
-- =====================================================
SELECT name,
       array_length(assigned_classes, 1) as class_count,
       assigned_classes
FROM profiles
WHERE id IN (
    'eb4f7da4-c6b1-47a4-8c74-4cd1688df7b2',  -- Mr. Babur
    '644c2ff7-ea2d-4e1a-8d06-a1bb4ee1bef1',  -- Mr Asib
    'e65d4391-b76f-4f19-9a5c-7902480f93bd',  -- Mr Mat
    '0091b3a4-bd6d-4d7f-8814-5960fe3769ec',  -- Mr Mo
    '98add192-534a-4bf3-b66b-c09bfdd3298d',  -- Mr Aloysha
    '0e12a455-22b4-429d-a6f1-0475c7ea6d9f'   -- Ms Glarace
)
ORDER BY name;

COMMIT;

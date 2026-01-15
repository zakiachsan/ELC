-- =====================================================
-- FIX BATCH 4 - FINAL (Remaining Teachers)
-- =====================================================

BEGIN;

-- =====================================================
-- Ms Fercy (SD CHARITAS BATAM, TK CHARITAS BATAM, SMP CHARITAS BATAM)
-- CSV: SD bilingual 1, SD bilingual 2-3 (science), SD regular 1-6, TK regular, SMP regular 7-9
-- Note: SD Charitas Batam doesn't have bilingual classes in DB
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- TK CHARITAS BATAM
    'TK A', 'TK B',
    -- SD CHARITAS BATAM (1-6) - format KELAS 1A
    'KELAS 1A',
    'KELAS 2A', 'KELAS 2B',
    'KELAS 3A', 'KELAS 3B',
    'KELAS 4A',
    'KELAS 5A',
    'KELAS 6A', 'KELAS 6B',
    -- SMP CHARITAS BATAM (7-9)
    'KELAS 7A',
    'KELAS 8A', 'KELAS 8B',
    'KELAS 9A', 'KELAS 9B'
],
    updated_at = NOW()
WHERE id = 'f2684a45-7b1f-4e64-b08e-6729cfdc4c8d';

-- =====================================================
-- Ms Hila (SDK SANG TIMUR KARANG TENGAH, SD SANG TIMUR CAKUNG, TK SANTA MARIA, SD SANTA MARIA)
-- CSV: SDK bilingual 1, SD Cakung bilingual 1, TK Santa Maria regular, SD Santa Maria regular 1-6
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SDK SANG TIMUR KARANG TENGAH (bilingual kelas 1)
    '1 BILINGUAL',
    -- TK SANTA MARIA
    'TK',
    -- SD SANTA MARIA (1-6)
    '1A', '1B', '1C',
    '2A', '2B',
    '3A', '3B', '3C',
    '4A', '4B', '4C',
    '5A', '5B', '5C',
    '6A', '6B', '6C', '6D'
],
    updated_at = NOW()
WHERE id = 'ed93e8be-edf9-4579-9864-3efb7d4de15c';

-- =====================================================
-- Ms Lyn (TK KRISTOFORUS 1, TK KRISTOFORUS 2, SD ABDI SISWA ARIES, SMP ABDI SISWA ARIES)
-- CSV: TK 1&2 regular, SD bilingual 1-2, SD regular 1-6, SMP regular 8-9
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- TK KRISTOFORUS 1
    'TK A-1', 'TK A-2', 'TK A2',
    'TK B-1', 'TK B-2', 'TK B-3', 'TK B1', 'TK B2', 'TK B3', 'TK B4',
    'TK-A1', 'KB-1', 'KB-2',
    -- TK KRISTOFORUS 2 (similar format)
    -- SD ABDI SISWA ARIES (bilingual 1-2)
    '1 BILINGUAL (Bilingual)', '2 BILINGUAL (Bilingual)',
    -- SD ABDI SISWA ARIES (regular 1,2,3,5,6)
    '1A', '1B', '2A', '2B', '3A', '3B', '5A', '5B', '6A', '6B', '6C',
    -- SMP ABDI SISWA ARIES (8-9)
    'KELAS 8A', 'KELAS 8B', 'KELAS 9A'
],
    updated_at = NOW()
WHERE id = '2a5dd696-5fd7-46f7-bce9-8661cad050a8';

-- =====================================================
-- Ms Suma (SD KRISTOFORUS 1)
-- CSV: kelas 1-6 regular
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    '1A', '1B', '1C', '1D',
    '2A', '2B', '2C',
    '3A', '3B', '3C',
    '4A', '4B', '4C',
    '5A', '5B', '5C',
    '6A', '6B', '6C'
],
    updated_at = NOW()
WHERE id = '4bc8b495-7141-4943-b974-cf0857025b79';

-- =====================================================
-- Ms. Isabella (SD ABDI SISWA ARIES)
-- CSV: bilingual 1-2 (writing, reading), regular 2 (listening, speaking)
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD ABDI SISWA ARIES (bilingual 1-2)
    '1 BILINGUAL (Bilingual)', '2 BILINGUAL (Bilingual)',
    -- SD ABDI SISWA ARIES (regular 2)
    '2A', '2B'
],
    updated_at = NOW()
WHERE id = 'ad8068d9-cbdf-4f3d-9e34-8c7ddf1a4f9f';

-- =====================================================
-- Ms Julie (SD KRISTOFORUS 2)
-- Already seems correct but verifying format
-- CSV: kelas 1-6 regular
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    '1A', '1B', '1C',
    '2A', '2B', '2C',
    '3A', '3B', '3C',
    '4A', '4B', '4C',
    '5A', '5B', '5C',
    '6A', '6B', '6C'
],
    updated_at = NOW()
WHERE id = '30836141-698f-4c40-bfdc-018cb63bfef8';

-- =====================================================
-- Verify changes
-- =====================================================
SELECT name,
       array_length(assigned_classes, 1) as class_count,
       assigned_classes
FROM profiles
WHERE id IN (
    'f2684a45-7b1f-4e64-b08e-6729cfdc4c8d',  -- Ms Fercy
    'ed93e8be-edf9-4579-9864-3efb7d4de15c',  -- Ms Hila
    '2a5dd696-5fd7-46f7-bce9-8661cad050a8',  -- Ms Lyn
    '4bc8b495-7141-4943-b974-cf0857025b79',  -- Ms Suma
    'ad8068d9-cbdf-4f3d-9e34-8c7ddf1a4f9f',  -- Ms. Isabella
    '30836141-698f-4c40-bfdc-018cb63bfef8'   -- Ms Julie
)
ORDER BY name;

COMMIT;

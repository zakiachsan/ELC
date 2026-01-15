-- =====================================================
-- FIX REMAINING TEACHERS
-- =====================================================

BEGIN;

-- =====================================================
-- Mr. Zed (SMP ABDI SISWA BINTARO, SMA ABDI SISWA BINTARO)
-- CSV: kelas 7,8,9 di SMP, kelas 10,11,12 di SMA
-- SMA uses Roman numerals: X1, X2, XI 1, XII 1, etc.
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SMP classes (7, 8, 9)
    '7A', '7B', '7C', '7D',
    '8A', '8B', '8C', '8D',
    '9A', '9B', '9C',
    -- SMA classes (Roman numerals)
    'X1', 'X2', 'X3',
    'XI 1', 'XI2', 'XI 3',
    'XII 1', 'XII 2', 'XII 3'
],
    updated_at = NOW()
WHERE id = '38da49d5-2d10-4b14-9524-0a14474c908c';

-- =====================================================
-- Mr Gavin (TK ABDI SISWA BINTARO, SD TARAKANITA, SD ABDI SISWA BINTARO)
-- CSV: TK bilingual, SD Tarakanita 1&6 Regular, SD Abdi Siswa 1-4 bilingual
-- SD ABDI SISWA BINTARO bilingual = 1D, 2D, 3D, 4D (BILINGUAL)
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- TK ABDI SISWA BINTARO (bilingual)
    'TK BILINGUAL',
    -- SD TARAKANITA (Regular) - kelas 1, 6
    'KELAS 1 A', 'KELAS 1B', 'KELAS 1 C', 'KELAS 1 D',
    'KELAS 6A', 'KELAS 6B', 'KELAS 6C', 'KELAS 6D',
    -- SD ABDI SISWA BINTARO (Bilingual) - kelas 1-4
    '1D (BILINGUAL)', '2D (BILINGUAL)', '3D (BILINGUAL)', '4D (BILINGUAL)'
],
    updated_at = NOW()
WHERE id = 'a918df6b-12e8-4e03-84f5-3b94fa565b42';

-- =====================================================
-- Ms Smitha (TK ABDI SISWA BINTARO, SD ABDI SISWA BINTARO)
-- CSV: TK bilingual (TK A, TK B), SD Regular (1,2,4,6), SD Bilingual (1,3)
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- TK ABDI SISWA BINTARO (bilingual)
    'TK BILINGUAL',
    -- SD ABDI SISWA BINTARO (Regular) - kelas 1,2,4,6
    '1 A', '1 B', '1C',
    '2 B', '2 C', '2A',
    '4A', '4B', '4C',
    '6A', '6B', '6C',
    -- SD ABDI SISWA BINTARO (Bilingual) - kelas 1,3
    '1D (BILINGUAL)', '3D (BILINGUAL)'
],
    updated_at = NOW()
WHERE id = '291e38ed-4de7-4b4f-a8c6-d2507e409e14';

-- =====================================================
-- Ms Maria (SD ABDI SISWA BINTARO)
-- CSV: Bilingual 1,2,3,4 (science), Regular 3
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD ABDI SISWA BINTARO (Bilingual) - kelas 1,2,3,4
    '1D (BILINGUAL)', '2D (BILINGUAL)', '3D (BILINGUAL)', '4D (BILINGUAL)',
    -- SD ABDI SISWA BINTARO (Regular) - kelas 3
    '3A', '3B', '3C'
],
    updated_at = NOW()
WHERE id = '5baaa8d6-d604-4e2c-a706-42aea9caaac2';

-- =====================================================
-- Mr Ron (SD CHARITAS JKT, SMP SANG TIMUR KARANG TENGAH, SD ABDI SISWA BINTARO)
-- CSV: SD Charitas bilingual 4,6 / SMP Sang Timur bilingual 7, regular 7,8,9 / SD Abdi Siswa bilingual 1-4
-- Note: SD Charitas hanya punya bilingual sampai 5C, jadi pakai 4C saja
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD CHARITAS JKT (Bilingual) - kelas 4 (kelas 6 bilingual tidak ada)
    'KELAS 4C BILINGUAL',
    -- SMP SANG TIMUR KARANG TENGAH (Bilingual) - kelas 7
    '7A Bilingual',
    -- SMP SANG TIMUR KARANG TENGAH (Regular) - kelas 7,8,9
    '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C', '9D',
    -- SD ABDI SISWA BINTARO (Bilingual) - kelas 1-4
    '1D (BILINGUAL)', '2D (BILINGUAL)', '3D (BILINGUAL)', '4D (BILINGUAL)'
],
    updated_at = NOW()
WHERE id = '9b9187ca-b00d-4950-90b7-c2f27ee72ec1';

-- =====================================================
-- Verify changes
-- =====================================================
SELECT name,
       array_length(assigned_classes, 1) as class_count,
       assigned_classes
FROM profiles
WHERE id IN (
    '38da49d5-2d10-4b14-9524-0a14474c908c',  -- Mr. Zed
    'a918df6b-12e8-4e03-84f5-3b94fa565b42',  -- Mr Gavin
    '291e38ed-4de7-4b4f-a8c6-d2507e409e14',  -- Ms Smitha
    '5baaa8d6-d604-4e2c-a706-42aea9caaac2',  -- Ms Maria
    '9b9187ca-b00d-4950-90b7-c2f27ee72ec1'   -- Mr Ron
)
ORDER BY name;

COMMIT;

-- =====================================================
-- COMPREHENSIVE TEACHER FIX - Based on CSV & Actual DB Class Names
-- =====================================================

BEGIN;

-- =====================================================
-- Ms. Isabella (SD ABDI SISWA ARIES)
-- CSV: bilingual 1,2 (writing, reading), regular 2 (listening, speaking)
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD ABDI SISWA ARIES bilingual kelas 1, 2
    '1 BILINGUAL', '1 BILINGUAL (Bilingual)',
    '2 BILINGUAL', '2 BILINGUAL (Bilingual)',
    -- SD ABDI SISWA ARIES regular kelas 2
    '2A', '2B'
],
    updated_at = NOW()
WHERE id = 'ad8068d9-cbdf-4f3d-9e34-8c7ddf1a4f9f';

-- =====================================================
-- Mr. Babur (SMP BHK, SMA BHK)
-- CSV: SMP regular 7,8,9 / SMA regular 10,11
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SMP BHK regular 7, 8, 9
    'KELAS 7A', 'KELAS 7B', 'KELAS 7C', 'KELAS 7D',
    'KELAS 8A', 'KELAS 8B', 'KELAS 8C', 'KELAS 8D',
    'KELAS 9A', 'KELAS 9B', 'KELAS 9C', 'KELAS 9D',
    -- SMA BHK regular 10, 11
    'KELAS 10-1', 'KELAS 10-2', 'KELAS 10-3',
    'KELAS 11-1', 'KELAS 11-2', 'KELAS 11-3', 'KELAS 11-4'
],
    updated_at = NOW()
WHERE id = 'eb4f7da4-c6b1-47a4-8c74-4cd1688df7b2';

-- =====================================================
-- Ms Rose (SD ABDI SISWA ARIES, SMP ABDI SISWA ARIES, SD ALBERTUS)
-- CSV: SD Aries regular 4, bilingual 1,2 / SMP Aries regular 7,8 / SD Albertus bilingual 1
-- Note: SD ALBERTUS doesn't have bilingual classes in DB
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD ABDI SISWA ARIES regular kelas 4
    '4A', '4B',
    -- SD ABDI SISWA ARIES bilingual kelas 1, 2
    '1 BILINGUAL', '1 BILINGUAL (Bilingual)',
    '2 BILINGUAL', '2 BILINGUAL (Bilingual)',
    -- SMP ABDI SISWA ARIES regular kelas 7, 8
    'kelas 7 A', 'KELAS 7B', 'KELAS 8A', 'KELAS 8B'
],
    updated_at = NOW()
WHERE id = 'ca4841d8-06b3-4a1e-81b7-9ec56fae7d95';

-- =====================================================
-- Ms Hila (SDK Sang Timur KT, SD Sang Timur Cakung, TK Santa Maria, SD Santa Maria)
-- CSV: SDK KT bilingual 1 (no classes), SD Cakung bilingual 1, TK Santa Maria regular, SD Santa Maria regular 1-6
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD SANG TIMUR CAKUNG bilingual kelas 1
    '1 BILINGUAL',
    -- TK SANTA MARIA regular
    'TK',
    -- SD SANTA MARIA regular kelas 1-6
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
-- Mr. Zed (SMP ABDI SISWA BINTARO, SMA ABDI SISWA BINTARO)
-- CSV: SMP regular 7,8,9 / SMA regular 10,11,12
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SMP ABDI SISWA BINTARO regular 7, 8, 9
    '7A', '7B', '7C', '7D',
    '8A', '8B', '8C', '8D',
    '9A', '9B', '9C',
    -- SMA ABDI SISWA BINTARO regular 10, 11, 12
    'X1', 'X2', 'X3',
    'XI 1', 'XI 3', 'XI2',
    'XII 1', 'XII 2', 'XII 3'
],
    updated_at = NOW()
WHERE id = '38da49d5-2d10-4b14-9524-0a14474c908c';

-- =====================================================
-- Mr Mo (SD ABDI SISWA BINTARO, SD TARAKANITA, SMP TARAKANITA)
-- CSV: SD Bintaro regular 5 / SD Tarakanita regular 2,3,4,5 / SMP Tarakanita regular 7,8,9
-- Note: SMP TARAKANITA classes are in SD TARAKANITA location (7-9)
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD ABDI SISWA BINTARO regular kelas 5
    '5A', '5B', '5C',
    -- SD TARAKANITA regular kelas 2, 3, 4, 5
    'KELAS 2A', 'KELAS 2B', 'KELAS 2C', 'KELAS 2D',
    'KELAS 3A', 'KELAS 3B', 'KELAS 3C', 'KELAS 3D',
    'KELAS 4A', 'KELAS 4B', 'KELAS 4C', 'KELAS 4D',
    'KELAS 5A', 'KELAS 5B', 'KELAS 5C', 'KELAS 5D',
    -- SMP TARAKANITA regular kelas 7, 8, 9 (from SD TARAKANITA location)
    'KELAS 7A', 'KELAS 7B', 'KELAS 7C', 'KELAS 7D', 'KELAS 7E',
    'KELAS 8A', 'KELAS 8B', 'KELAS 8C', 'KELAS 8D',
    'KELAS 9A', 'KELAS 9B', 'KELAS 9C', 'KELAS 9D'
],
    updated_at = NOW()
WHERE id = '0091b3a4-bd6d-4d7f-8814-5960fe3769ec';

-- =====================================================
-- Ms Smitha (TK ABDI SISWA BINTARO, SD ABDI SISWA BINTARO)
-- CSV: TK bilingual / SD regular 1,2,4,6 / SD bilingual 1,3
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- TK ABDI SISWA BINTARO bilingual
    'TK BILINGUAL',
    -- SD ABDI SISWA BINTARO regular kelas 1, 2, 4, 6
    '1 A', '1 B', '1C',
    '2 B', '2 C', '2A',
    '4A', '4B', '4C',
    '6A', '6B', '6C', '6D',
    -- SD ABDI SISWA BINTARO bilingual kelas 1, 3
    '1D', '3D'
],
    updated_at = NOW()
WHERE id = '291e38ed-4de7-4b4f-a8c6-d2507e409e14';

-- =====================================================
-- Ms Maria (SD ABDI SISWA BINTARO)
-- CSV: bilingual 1,2,3,4 (science) / regular 3 (listening, speaking)
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD ABDI SISWA BINTARO bilingual kelas 1, 2, 3, 4
    '1D', '2D', '3D', '4D',
    -- SD ABDI SISWA BINTARO regular kelas 3
    '3A', '3B', '3C'
],
    updated_at = NOW()
WHERE id = '5baaa8d6-d604-4e2c-a706-42aea9caaac2';

-- =====================================================
-- Ms Fercy (SD CHARITAS BATAM, TK CHARITAS BATAM, SMP CHARITAS BATAM)
-- CSV: SD bilingual 1, SD bilingual 2-3 science, SD regular 1-6, TK regular, SMP regular 7-9
-- Note: SD Charitas Batam doesn't have bilingual classes
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD CHARITAS BATAM regular kelas 1-6
    'KELAS 1A',
    'KELAS 2A', 'KELAS 2B',
    'KELAS 3A', 'KELAS 3B',
    'KELAS 4A',
    'KELAS 5A',
    'KELAS 6A', 'KELAS 6B',
    -- TK CHARITAS BATAM regular
    'KB', 'TK A', 'TK B',
    -- SMP CHARITAS BATAM regular 7, 8, 9
    'KELAS 7A',
    'KELAS 8A', 'KELAS 8B',
    'KELAS 9A', 'KELAS 9B'
],
    updated_at = NOW()
WHERE id = 'f2684a45-7b1f-4e64-b08e-6729cfdc4c8d';

-- =====================================================
-- Mr Asib (SMP ABDI SISWA PATRA, SMA ABDI SISWA PATRA, SMP SANTA MARIA)
-- CSV: SMP Patra regular 7,8,9 / SMA Patra regular 10,11,12 / SMP Santa Maria regular 7,8,9
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SMP ABDI SISWA PATRA regular 7, 8, 9
    'kelas 7 A', 'kelas 7 B',
    'kelas 8A', 'KELAS 8B',
    'KELAS 9A', 'KELAS 9B',
    -- SMA ABDI SISWA PATRA regular 10, 11, 12
    'KELAS 10-1', 'KELAS 10-2',
    'KELAS 11-1', 'KELAS 11-2',
    'KELAS 12-1', 'KELAS 12-2',
    -- SMP SANTA MARIA regular 7, 8, 9
    '7A', '7B', '7C', '7D',
    '8A', '8B', '8C', '8D',
    '9A', '9B', '9C', '9D'
],
    updated_at = NOW()
WHERE id = '644c2ff7-ea2d-4e1a-8d06-a1bb4ee1bef1';

-- =====================================================
-- Mr Ron (SD CHARITAS JKT, SMP SANG TIMUR KT, SD ABDI SISWA BINTARO)
-- CSV: SD Charitas bilingual 4,6 / SMP Sang Timur bilingual 7, regular 7,8,9 / SD Bintaro bilingual 1-4
-- Note: SD Charitas has no bilingual 6
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD CHARITAS JKT bilingual kelas 4 (no 6 bilingual exists)
    'KELAS 4C BILINGUAL',
    -- SMP SANG TIMUR KARANG TENGAH bilingual kelas 7
    '7A Bilingual',
    -- SMP SANG TIMUR KARANG TENGAH regular kelas 7, 8, 9
    '7B', '7C',
    '8A', '8B', '8C',
    '9A', '9B', '9C', '9D',
    -- SD ABDI SISWA BINTARO bilingual kelas 1, 2, 3, 4
    '1D', '2D', '3D', '4D'
],
    updated_at = NOW()
WHERE id = '9b9187ca-b00d-4950-90b7-c2f27ee72ec1';

-- =====================================================
-- Mr Jim (SD CHARITAS JKT)
-- CSV: regular 1, 2, 3, 5
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD CHARITAS JKT regular kelas 1, 2, 3, 5
    '1A', '1B', '1C',
    '2A', '2B', '2C',
    '3A', '3B', '3C',
    '5A', '5B', '5C'
],
    updated_at = NOW()
WHERE id = 'b6fec186-0eb5-48b4-b211-59952418e0b5';

-- =====================================================
-- Mr Ren (SDK Sang Timur KT, SD Sang Timur Cakung, SMP Sang Timur Cakung)
-- CSV: SDK KT bilingual 1, SDK Cakung bilingual 1, SMP Cakung bilingual 7
-- Note: SDK KT and SMP Cakung have no classes in DB
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SD SANG TIMUR CAKUNG bilingual kelas 1
    '1 BILINGUAL'
],
    updated_at = NOW()
WHERE id = '42bb8138-2cc1-4630-bf95-8713c996711b';

-- =====================================================
-- Mr Mat (TK/SD/SMP ST VINCENTIUS)
-- CSV: TK regular, SD regular 1-6, SMP regular 7-9
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- TK ST VINCENTIUS regular
    'TK A-1', 'TK A-2', 'TK B-1', 'TK B-2',
    -- SD ST VINCENTIUS regular kelas 1-6
    'KELAS 1 A', 'KELAS 1 B', 'KELAS 1 C',
    'KELAS 2A', 'KELAS 2B', 'KELAS 2C',
    'KELAS 3A', 'KELAS 3B',
    'KELAS 4A', 'KELAS 4B',
    'KELAS 5A', 'KELAS 5B',
    'KELAS 6A', 'KELAS 6B', 'KELAS 6C',
    -- SMP ST VINCENTIUS regular kelas 7-9
    'KELAS 7-1', 'KELAS 7-2', 'KELAS 7-3',
    'KELAS 8-1', 'KELAS 8-2', 'KELAS 8-3',
    'KELAS 9-1', 'KELAS 9-2', 'KELAS 9-3'
],
    updated_at = NOW()
WHERE id = 'e65d4391-b76f-4f19-9a5c-7902480f93bd';

-- =====================================================
-- Mr Aloysha (SMP CHARITAS JKT, SMK SANTA MARIA)
-- CSV: SMP Charitas regular 7,8,9 / SMK Santa Maria regular 10,11
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SMP CHARITAS JKT regular kelas 7, 8, 9
    'kelas 7A', 'kelas 7B', 'KELAS 7C',
    'KELAS 8A', 'KELAS 8B',
    'KELAS 9A', 'KELAS 9B',
    -- SMK SANTA MARIA regular kelas 10, 11 (vocational classes)
    'X CULINARY 1', 'X CULINARY 2', 'X DKV 1', 'X DKV 2', 'X FASHION',
    'XI CULINARY 1', 'XI CULINARY 2', 'XI DKV 1', 'XI DKV 2', 'XI FASHION'
],
    updated_at = NOW()
WHERE id = '98add192-534a-4bf3-b66b-c09bfdd3298d';

-- =====================================================
-- Ms Glarace (SMP MARSUDIRINI)
-- CSV: regular 7, 8, 9
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- SMP MARSUDIRINI regular kelas 7, 8, 9 (all sections)
    '7A', '7B', '7C', '7D', '7E', '7F', '7G', '7H', '7I',
    '8A', '8B', '8C', '8D', '8E', '8F', '8G', '8H', '8I',
    '9A', '9B', '9C', '9D', '9E', '9F', '9G', '9H'
],
    updated_at = NOW()
WHERE id = '0e12a455-22b4-429d-a6f1-0475c7ea6d9f';

-- =====================================================
-- Ms Lyn (TK KRISTOFORUS 1 & 2, SD ABDI SISWA ARIES, SMP ABDI SISWA ARIES)
-- CSV: TK 1&2 regular, SD Aries regular 1,2,3,5,6, bilingual 1,2, SMP Aries regular 8,9
-- =====================================================
UPDATE profiles
SET assigned_classes = ARRAY[
    -- TK KRISTOFORUS 1 regular TK
    'KB-1', 'KB-2', 'TK A-1', 'TK A-2', 'TK B1', 'TK B2', 'TK B3', 'TK B4',
    -- TK KRISTOFORUS 2 regular TK
    'KB', 'TK A2', 'TK B-1', 'TK B-2', 'TK B-3', 'TK-A1',
    -- SD ABDI SISWA ARIES regular kelas 1, 2, 3, 5, 6
    '1A', '1B', '2A', '2B', '3A', '3B', '5A', '5B', '6A', '6B', '6C',
    -- SD ABDI SISWA ARIES bilingual kelas 1, 2
    '1 BILINGUAL', '1 BILINGUAL (Bilingual)', '2 BILINGUAL', '2 BILINGUAL (Bilingual)',
    -- SMP ABDI SISWA ARIES regular kelas 8, 9
    'KELAS 8A', 'KELAS 8B', 'KELAS 9A'
],
    updated_at = NOW()
WHERE id = '2a5dd696-5fd7-46f7-bce9-8661cad050a8';

-- =====================================================
-- Verification Query
-- =====================================================
SELECT name, array_length(assigned_classes, 1) as class_count
FROM profiles
WHERE id IN (
    'ad8068d9-cbdf-4f3d-9e34-8c7ddf1a4f9f',  -- Ms. Isabella
    'eb4f7da4-c6b1-47a4-8c74-4cd1688df7b2',  -- Mr. Babur
    'ca4841d8-06b3-4a1e-81b7-9ec56fae7d95',  -- Ms Rose
    'ed93e8be-edf9-4579-9864-3efb7d4de15c',  -- Ms Hila
    '38da49d5-2d10-4b14-9524-0a14474c908c',  -- Mr. Zed
    '0091b3a4-bd6d-4d7f-8814-5960fe3769ec',  -- Mr Mo
    '291e38ed-4de7-4b4f-a8c6-d2507e409e14',  -- Ms Smitha
    '5baaa8d6-d604-4e2c-a706-42aea9caaac2',  -- Ms Maria
    'f2684a45-7b1f-4e64-b08e-6729cfdc4c8d',  -- Ms Fercy
    '644c2ff7-ea2d-4e1a-8d06-a1bb4ee1bef1',  -- Mr Asib
    '9b9187ca-b00d-4950-90b7-c2f27ee72ec1',  -- Mr Ron
    'b6fec186-0eb5-48b4-b211-59952418e0b5',  -- Mr Jim
    '42bb8138-2cc1-4630-bf95-8713c996711b',  -- Mr Ren
    'e65d4391-b76f-4f19-9a5c-7902480f93bd',  -- Mr Mat
    '98add192-534a-4bf3-b66b-c09bfdd3298d',  -- Mr Aloysha
    '0e12a455-22b4-429d-a6f1-0475c7ea6d9f',  -- Ms Glarace
    '2a5dd696-5fd7-46f7-bce9-8661cad050a8'   -- Ms Lyn
)
ORDER BY name;

COMMIT;

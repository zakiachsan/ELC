-- =====================================================
-- SAFE FIX: Teacher assigned_classes format
-- Only fixing teachers with EXACT class count match
-- =====================================================

-- ⚠️ BACKUP FIRST!
-- SELECT id, name, assigned_classes FROM profiles WHERE role = 'TEACHER';

BEGIN;

-- =====================================================
-- SD BHAKTI Teachers (Simple format fix: "2A" → "KELAS 2A")
-- =====================================================

-- Mr Chris (SD BHAKTI) - kelas 2,3,4,5,6
-- Current: 2A, 2B, 3A, 3B, 4A, 4B, 5A, 5B, 6A, 6B (10 classes)
-- Fixed: KELAS 2A, KELAS 2 B, etc. (10 classes - same count)
UPDATE profiles
SET assigned_classes = ARRAY['KELAS 2 B','KELAS 2A','KELAS 3A','KELAS 3B','KELAS 4 A','KELAS 4B','KELAS 5A','KELAS 5B','KELAS 6A','KELAS 6B'],
    updated_at = NOW()
WHERE id = 'c4bd34b6-1f9a-4c4f-8721-056f85054144';

-- Ms Divine (SD BHAKTI) - kelas 1,4,5,6
-- Current: 1A, 1B, 4A, 4B, 5A, 5B, 6A, 6B (8 classes)
-- Fixed: KELAS 1 A, KELAS 1 B, etc. (8 classes - same count)
UPDATE profiles
SET assigned_classes = ARRAY['KELAS 1 A','KELAS 1 B','KELAS 4 A','KELAS 4B','KELAS 5A','KELAS 5B','KELAS 6A','KELAS 6B'],
    updated_at = NOW()
WHERE id = 'f57820c3-4620-48d2-86be-7e7e632ca99b';

-- Ms Jeni (SD BHAKTI) - kelas 1,4,5,6
-- Current: 1A, 1B, 4A, 4B, 5A, 5B, 6A, 6B (8 classes)
-- Fixed: KELAS 1 A, KELAS 1 B, etc. (8 classes - same count)
UPDATE profiles
SET assigned_classes = ARRAY['KELAS 1 A','KELAS 1 B','KELAS 4 A','KELAS 4B','KELAS 5A','KELAS 5B','KELAS 6A','KELAS 6B'],
    updated_at = NOW()
WHERE id = '629be629-3785-4c05-88dc-a44a80d8a9a7';

-- =====================================================
-- Other Safe Fixes
-- =====================================================

-- Mr Ren (Bilingual teacher - format fix only)
-- Current: 1 BILINGUAL (Bilingual), 7 BILINGUAL (Bilingual) (2 classes)
-- Fixed: 1 BILINGUAL, 7A Bilingual (2 classes - matches classes table)
UPDATE profiles
SET assigned_classes = ARRAY['1 BILINGUAL','7A Bilingual'],
    updated_at = NOW()
WHERE id = '42bb8138-2cc1-4630-bf95-8713c996711b';

-- Ms Rose (SD ABDI SISWA ARIES, SMP ABDI SISWA ARIES, SD ALBERTUS)
-- Current: 1 BILINGUAL (Bilingual), 2 BILINGUAL (Bilingual), 4A, 4B, 7A, 7B, 8A, 8B (8 classes)
-- Fixed: matches classes table format (8 classes)
UPDATE profiles
SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)','2 BILINGUAL (Bilingual)','4A','4B','KELAS 7B','KELAS 8A','KELAS 8B','kelas 7 A'],
    updated_at = NOW()
WHERE id = 'ca4841d8-06b3-4a1e-81b7-9ec56fae7d95';

-- =====================================================
-- Verify the changes
-- =====================================================
SELECT name,
       array_length(assigned_classes, 1) as class_count,
       assigned_classes
FROM profiles
WHERE id IN (
    'c4bd34b6-1f9a-4c4f-8721-056f85054144',  -- Mr Chris
    'f57820c3-4620-48d2-86be-7e7e632ca99b',  -- Ms Divine
    '629be629-3785-4c05-88dc-a44a80d8a9a7',  -- Ms Jeni
    '42bb8138-2cc1-4630-bf95-8713c996711b',  -- Mr Ren
    'ca4841d8-06b3-4a1e-81b7-9ec56fae7d95'   -- Ms Rose
)
ORDER BY name;

COMMIT;
-- If something looks wrong, use: ROLLBACK;

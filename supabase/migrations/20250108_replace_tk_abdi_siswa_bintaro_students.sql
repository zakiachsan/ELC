-- Migration: Replace TK ABDI SISWA BINTARO Students
-- Date: 2025-01-08
-- Description:
--   1. Delete existing TK ABDI SISWA BINTARO student accounts (profiles only)
--   2. New students should be imported via the import-students edge function
--      which creates both auth users and profiles

-- Step 1: Delete existing TK ABDI SISWA BINTARO student profiles
-- Note: This only deletes from profiles table. Auth users need to be deleted separately
-- via Supabase Dashboard or the admin API

DELETE FROM profiles
WHERE role = 'STUDENT'
  AND school_origin LIKE '%TK ABDI SISWA BINTARO%';

-- After running this migration:
-- 1. Deploy the updated import-students edge function:
--    supabase functions deploy import-students
--
-- 2. Call the edge function with the JSON payload from:
--    Daftar Student/TK_ABDI_SISWA_BINTARO_import.json
--
-- 3. Or use curl:
--    curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/import-students' \
--      -H 'Authorization: Bearer YOUR_ADMIN_JWT_TOKEN' \
--      -H 'Content-Type: application/json' \
--      -d @"Daftar Student/TK_ABDI_SISWA_BINTARO_import.json"

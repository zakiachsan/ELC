-- =====================================================
-- CLEANUP CORRUPTED AUTH USERS AND REIMPORT
-- Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: First, check what's in auth.users
-- This will show if there are corrupted records
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email LIKE '%@enormous1.com'
LIMIT 20;

-- STEP 2: Count total student users
SELECT COUNT(*) as total_student_users
FROM auth.users
WHERE email LIKE '%@enormous1.com';

-- STEP 3: Check auth.identities for these users
SELECT
  id,
  user_id,
  provider,
  created_at
FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@enormous1.com'
)
LIMIT 20;

-- =====================================================
-- IF YOU SEE CORRUPTED DATA, RUN THESE CLEANUP QUERIES:
-- =====================================================

-- CLEANUP STEP A: Delete identities first (due to foreign key)
DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@enormous1.com'
);

-- CLEANUP STEP B: Delete refresh tokens
DELETE FROM auth.refresh_tokens
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@enormous1.com'
);

-- CLEANUP STEP C: Delete sessions
DELETE FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@enormous1.com'
);

-- CLEANUP STEP D: Delete MFA factors if any
DELETE FROM auth.mfa_factors
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@enormous1.com'
);

-- CLEANUP STEP E: Finally delete the users
DELETE FROM auth.users
WHERE email LIKE '%@enormous1.com';

-- CLEANUP STEP F: Also delete orphaned profiles
DELETE FROM public.profiles
WHERE email LIKE '%@enormous1.com';

-- =====================================================
-- VERIFY CLEANUP
-- =====================================================

-- Check auth.users is clean
SELECT COUNT(*) as remaining_auth_users
FROM auth.users
WHERE email LIKE '%@enormous1.com';

-- Check profiles is clean
SELECT COUNT(*) as remaining_profiles
FROM public.profiles
WHERE email LIKE '%@enormous1.com';

-- =====================================================
-- After cleanup is complete, run:
-- node scripts/import-students-direct.js
-- to reimport all students
-- =====================================================

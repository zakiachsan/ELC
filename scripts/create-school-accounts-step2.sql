-- =====================================================
-- STEP 2: Create School Accounts
-- Run AFTER create-school-accounts.sql
-- =====================================================

-- This creates auth users and profiles for each school
-- Password for all: SchoolELC2025!

-- Helper function to create school account
CREATE OR REPLACE FUNCTION create_school_account(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_location_id UUID
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if email already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'User already exists: %', p_email;
    RETURN v_user_id;
  END IF;

  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO v_user_id;

  -- Create profile
  INSERT INTO profiles (id, email, name, role, assigned_location_id, status, created_at, updated_at)
  VALUES (v_user_id, p_email, p_name, 'SCHOOL', p_location_id, 'ACTIVE', NOW(), NOW());

  RAISE NOTICE 'Created account: % -> %', p_email, v_user_id;
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create accounts for all schools
DO $$
DECLARE
  loc RECORD;
  v_slug TEXT;
  v_email TEXT;
  v_name TEXT;
BEGIN
  FOR loc IN
    SELECT id, name FROM locations
    WHERE name NOT ILIKE '%online%'
    AND name NOT ILIKE '%virtual%'
    ORDER BY name
  LOOP
    -- Create slug from name
    v_slug := lower(regexp_replace(loc.name, '[^a-zA-Z0-9\s]', '', 'g'));
    v_slug := regexp_replace(v_slug, '\s+', '_', 'g');
    v_slug := regexp_replace(v_slug, '_+', '_', 'g');
    v_slug := trim(both '_' from v_slug);

    v_email := 'school_' || v_slug || '@elcenormous1.com';
    v_name := loc.name || ' (School Admin)';

    -- Check if profile already exists for this location
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE assigned_location_id = loc.id AND role = 'SCHOOL'
    ) THEN
      PERFORM create_school_account(v_email, 'SchoolELC2025!', v_name, loc.id);
    ELSE
      RAISE NOTICE 'Skipped (already exists): %', loc.name;
    END IF;
  END LOOP;
END $$;

-- Show all created school accounts
SELECT
  p.email,
  p.name,
  l.name as school_name,
  p.created_at
FROM profiles p
JOIN locations l ON l.id = p.assigned_location_id
WHERE p.role = 'SCHOOL'
ORDER BY l.name;

-- Cleanup function (optional - you can keep it for future use)
-- DROP FUNCTION IF EXISTS create_school_account;

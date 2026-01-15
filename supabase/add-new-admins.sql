-- =====================================================
-- Add 2 New Admin Accounts
-- Feature: User Admin (5bb7639f-71a7-4642-9435-91e1a84774d4)
-- =====================================================
-- This script adds 2 new admin accounts to the system
-- Following the existing pattern from seed data

-- NOTE: This script should be run in Supabase SQL Editor
-- It will create the auth users and corresponding profiles

-- Admin 2: Admin User 2
INSERT INTO auth.users (
    instance_id,
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'e3000002-0000-0000-0000-000000000001',
    'admin2@elc.co.id',
    -- Password: Admin123! (bcrypt hashed)
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Admin 3: Admin User 3  
INSERT INTO auth.users (
    instance_id,
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'e3000003-0000-0000-0000-000000000001',
    'admin3@elc.co.id',
    -- Password: Admin123! (bcrypt hashed)
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create profiles for the new admin accounts
INSERT INTO profiles (id, name, email, phone, role, status, branch, address) VALUES
('e3000002-0000-0000-0000-000000000001', 'Admin User 2', 'admin2@elc.co.id', '081000000002', 'ADMIN', 'ACTIVE', 'Surabaya', 'ELC Head Office'),
('e3000003-0000-0000-0000-000000000001', 'Admin User 3', 'admin3@elc.co.id', '081000000003', 'ADMIN', 'ACTIVE', 'Surabaya', 'ELC Head Office');

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the admin accounts were created successfully
SELECT id, name, email, phone, role, status, created_at 
FROM profiles 
WHERE role = 'ADMIN' 
ORDER BY created_at;
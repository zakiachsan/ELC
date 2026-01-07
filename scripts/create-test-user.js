/**
 * Create Test User to verify auth works
 * Usage: node scripts/create-test-user.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzAyMTMsImV4cCI6MjA4MjQwNjIxM30.AvTJR6wF206M2Iz3raZCEOE6aAnhokjCR9W7PRrve2E';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_EMAIL = 'testuser123@test.com';
const TEST_PASSWORD = 'testuser123';

async function createTestUser() {
  console.log('===========================================');
  console.log('CREATE TEST USER');
  console.log('===========================================\n');

  // First check if test user exists
  console.log('1. Creating test user...');
  console.log('   Email:', TEST_EMAIL);
  console.log('   Password:', TEST_PASSWORD);

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    console.log('   ❌ Create error:', authError.message);

    // Maybe user already exists, try to get by email
    console.log('\n2. User might exist, trying to find...');
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (users) {
      const existing = users.users.find(u => u.email === TEST_EMAIL);
      if (existing) {
        console.log('   Found existing user:', existing.id);
      }
    }
    return;
  }

  console.log('   ✅ User created successfully!');
  console.log('   User ID:', authData.user.id);

  // Create profile
  console.log('\n2. Creating profile...');
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: TEST_EMAIL,
      name: 'Test User',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

  if (profileError) {
    console.log('   ❌ Profile error:', profileError.message);
  } else {
    console.log('   ✅ Profile created');
  }

  // Try login
  console.log('\n3. Trying login...');
  const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (loginError) {
    console.log('   ❌ Login error:', loginError.message);
  } else {
    console.log('   ✅ Login SUCCESS!');
    console.log('   User ID:', loginData.user?.id);
  }

  // Cleanup - delete test user
  console.log('\n4. Cleaning up test user...');
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
  if (deleteError) {
    console.log('   ❌ Delete error:', deleteError.message);
  } else {
    console.log('   ✅ Test user deleted');
  }

  console.log('\n===========================================');
}

createTestUser().catch(console.error);

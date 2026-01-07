/**
 * Test Login Script - Debug 500 error
 * Usage: node scripts/test-login.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzAyMTMsImV4cCI6MjA4MjQwNjIxM30.AvTJR6wF206M2Iz3raZCEOE6aAnhokjCR9W7PRrve2E';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

// Test credentials
const TEST_EMAIL = 'edward.chandyka@enormous1.com';
const TEST_PASSWORD = 'edward123';

// Create client (anon key - same as browser)
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testLogin() {
  console.log('===========================================');
  console.log('TEST LOGIN DEBUG');
  console.log('===========================================\n');

  // Step 1: Check if user exists in auth
  console.log('Step 1: Checking if user exists in auth.users...');
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const testUser = users.users.find(u => u.email === TEST_EMAIL);
  if (testUser) {
    console.log('✅ User found in auth.users');
    console.log('   ID:', testUser.id);
    console.log('   Email:', testUser.email);
    console.log('   Created:', testUser.created_at);
    console.log('   Email Confirmed:', testUser.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Last Sign In:', testUser.last_sign_in_at || 'Never');
  } else {
    console.log('❌ User NOT found in auth.users');
    return;
  }

  // Step 2: Check if profile exists
  console.log('\nStep 2: Checking if profile exists...');
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', TEST_EMAIL)
    .single();

  if (profileError) {
    console.log('❌ Profile error:', profileError.message);
  } else if (profile) {
    console.log('✅ Profile found');
    console.log('   Name:', profile.name);
    console.log('   Role:', profile.role);
    console.log('   Status:', profile.status);
  }

  // Step 3: Try to update password (in case it wasn't set correctly)
  console.log('\nStep 3: Resetting password to ensure it is correct...');
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    testUser.id,
    { password: TEST_PASSWORD }
  );

  if (updateError) {
    console.log('❌ Failed to update password:', updateError.message);
  } else {
    console.log('✅ Password updated successfully');
  }

  // Step 4: Try login with anon client (same as browser)
  console.log('\nStep 4: Attempting login with anon client...');
  const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (loginError) {
    console.log('❌ Login failed:', loginError.message);
    console.log('   Status:', loginError.status);
    console.log('   Full error:', JSON.stringify(loginError, null, 2));
  } else {
    console.log('✅ Login successful!');
    console.log('   User ID:', loginData.user?.id);
    console.log('   Session:', loginData.session ? 'Created' : 'None');
  }

  // Step 5: Check for database triggers
  console.log('\nStep 5: Checking for triggers on auth schema...');
  const { data: triggers, error: triggerError } = await supabaseAdmin.rpc('get_auth_triggers');

  if (triggerError) {
    console.log('   (Could not check triggers - RPC not available)');
  } else {
    console.log('   Triggers:', triggers);
  }

  console.log('\n===========================================');
  console.log('TEST COMPLETE');
  console.log('===========================================');
}

testLogin().catch(console.error);

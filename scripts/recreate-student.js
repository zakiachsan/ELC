/**
 * Delete and Recreate a Student User
 * Usage: node scripts/recreate-student.js
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

// Test student
const STUDENT_EMAIL = 'edward.chandyka@enormous1.com';
const STUDENT_PASSWORD = 'edward123';

async function recreateStudent() {
  console.log('===========================================');
  console.log('RECREATE STUDENT USER');
  console.log('===========================================\n');

  // Get existing profile data
  console.log('1. Getting existing profile data...');
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', STUDENT_EMAIL)
    .single();

  if (profileError) {
    console.log('   ❌ Profile not found:', profileError.message);
    return;
  }

  console.log('   ✅ Profile found:');
  console.log('      Old ID:', profile.id);
  console.log('      Name:', profile.name);
  console.log('      Role:', profile.role);

  const oldUserId = profile.id;
  const profileData = {
    name: profile.name,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    assigned_location_id: profile.assigned_location_id,
    school_origin: profile.school_origin,
  };

  // Delete old profile first (will cascade or we delete manually)
  console.log('\n2. Deleting old profile...');
  const { error: deleteProfileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', oldUserId);

  if (deleteProfileError) {
    console.log('   ❌ Delete profile error:', deleteProfileError.message);
  } else {
    console.log('   ✅ Profile deleted');
  }

  // Try to delete auth user
  console.log('\n3. Deleting old auth user...');
  const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(oldUserId);

  if (deleteUserError) {
    console.log('   ⚠️ Delete auth error:', deleteUserError.message);
    console.log('   (This is expected if auth user was corrupted)');
  } else {
    console.log('   ✅ Auth user deleted');
  }

  // Create new auth user
  console.log('\n4. Creating new auth user...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    console.log('   ❌ Create error:', authError.message);
    return;
  }

  console.log('   ✅ User created!');
  console.log('      New ID:', authData.user.id);

  // Create new profile
  console.log('\n5. Creating new profile...');
  const { error: newProfileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      ...profileData,
    });

  if (newProfileError) {
    console.log('   ❌ Profile error:', newProfileError.message);
  } else {
    console.log('   ✅ Profile created');
  }

  // Test login
  console.log('\n6. Testing login...');
  const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
  });

  if (loginError) {
    console.log('   ❌ Login error:', loginError.message);
  } else {
    console.log('   ✅ LOGIN SUCCESS!');
    console.log('      User ID:', loginData.user?.id);
    console.log('');
    console.log('   🎉 Student can now login!');
  }

  console.log('\n===========================================');
}

recreateStudent().catch(console.error);

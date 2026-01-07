/**
 * Check Student Auth User by ID
 * Usage: node scripts/check-student-auth.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Student user ID from profile we found
const STUDENT_ID = '14b2ce62-0519-4a7a-a8d4-3157ab388efc';

async function checkStudent() {
  console.log('===========================================');
  console.log('CHECK STUDENT AUTH USER');
  console.log('===========================================\n');

  console.log('Student ID:', STUDENT_ID);
  console.log('');

  // Check student auth user by ID
  console.log('1. Getting auth user by ID...');
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(STUDENT_ID);

  if (authError) {
    console.log('   ❌ Auth error:', authError.message);
  } else {
    console.log('   ✅ Auth user found:');
    console.log('      Email:', authUser.user.email);
    console.log('      Created:', authUser.user.created_at);
    console.log('      Email Confirmed:', authUser.user.email_confirmed_at);
    console.log('      Identities:', authUser.user.identities?.length || 0);
    console.log('      App Metadata:', JSON.stringify(authUser.user.app_metadata));
    console.log('      User Metadata:', JSON.stringify(authUser.user.user_metadata));

    // Try to reset password
    console.log('\n2. Resetting password...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      STUDENT_ID,
      { password: 'edward123' }
    );

    if (updateError) {
      console.log('   ❌ Update error:', updateError.message);
    } else {
      console.log('   ✅ Password reset successful');
    }

    // Try login again
    console.log('\n3. Trying login after password reset...');
    const anonClient = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzAyMTMsImV4cCI6MjA4MjQwNjIxM30.AvTJR6wF206M2Iz3raZCEOE6aAnhokjCR9W7PRrve2E');

    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: 'edward.chandyka@enormous1.com',
      password: 'edward123',
    });

    if (loginError) {
      console.log('   ❌ Login error:', loginError.message);
      console.log('   Status:', loginError.status);
    } else {
      console.log('   ✅ Login SUCCESS!');
      console.log('   User ID:', loginData.user?.id);
    }
  }

  console.log('\n===========================================');
}

checkStudent().catch(console.error);

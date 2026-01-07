/**
 * Check Database Status
 * Usage: node scripts/check-database.js
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

async function checkDatabase() {
  console.log('===========================================');
  console.log('DATABASE HEALTH CHECK');
  console.log('===========================================\n');

  // Check 1: profiles table
  console.log('1. Checking profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .limit(5);

  if (profilesError) {
    console.log('   ❌ Error:', profilesError.message);
  } else {
    console.log('   ✅ Working - Found', profiles.length, 'sample profiles');
  }

  // Check 2: Count students
  console.log('\n2. Counting student profiles...');
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'STUDENT');

  if (countError) {
    console.log('   ❌ Error:', countError.message);
  } else {
    console.log('   ✅ Found', count, 'student profiles');
  }

  // Check 3: locations table
  console.log('\n3. Checking locations table...');
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name')
    .limit(10);

  if (locError) {
    console.log('   ❌ Error:', locError.message);
  } else {
    console.log('   ✅ Working - Found', locations.length, 'locations');
    locations.forEach(l => console.log('      -', l.name));
  }

  // Check 4: Check specific student profile
  console.log('\n4. Checking specific student profile...');
  const { data: edward, error: edwardError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'edward.chandyka@enormous1.com')
    .single();

  if (edwardError) {
    console.log('   ❌ Error:', edwardError.message);
  } else {
    console.log('   ✅ Found profile:');
    console.log('      ID:', edward.id);
    console.log('      Name:', edward.name);
    console.log('      Email:', edward.email);
    console.log('      Role:', edward.role);
    console.log('      Status:', edward.status);
    console.log('      Location ID:', edward.assigned_location_id);
  }

  // Check 5: Check auth.users via admin API
  console.log('\n5. Checking auth user via getUserById...');
  if (edward) {
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(edward.id);

    if (authError) {
      console.log('   ❌ Error:', authError.message);
    } else {
      console.log('   ✅ Auth user found:');
      console.log('      Email:', authUser.user.email);
      console.log('      Email Confirmed:', authUser.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('      Created:', authUser.user.created_at);
      console.log('      App Metadata:', JSON.stringify(authUser.user.app_metadata));
      console.log('      User Metadata:', JSON.stringify(authUser.user.user_metadata));
    }
  }

  // Check 6: Try to get raw user data
  console.log('\n6. Checking auth health via listUsers...');
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 3,
  });

  if (listError) {
    console.log('   ❌ Error:', listError.message);
  } else {
    console.log('   ✅ listUsers working - Found', userList.users.length, 'users');
  }

  console.log('\n===========================================');
  console.log('CHECK COMPLETE');
  console.log('===========================================');
}

checkDatabase().catch(console.error);

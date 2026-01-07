/**
 * Check Admin User specifically
 * Usage: node scripts/check-admin-user.js
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

// Admin user ID from token.json
const ADMIN_ID = '58983f4d-4427-47d5-8c8f-b82a6d872ef4';

async function checkAdmin() {
  console.log('===========================================');
  console.log('CHECK ADMIN USER');
  console.log('===========================================\n');

  // Check admin profile
  console.log('1. Checking admin profile in profiles table...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', ADMIN_ID)
    .single();

  if (profileError) {
    console.log('   ❌ Profile error:', profileError.message);
  } else {
    console.log('   ✅ Admin profile found:');
    console.log('      Name:', profile.name);
    console.log('      Email:', profile.email);
    console.log('      Role:', profile.role);
  }

  // Check admin auth user
  console.log('\n2. Checking admin in auth.users via getUserById...');
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(ADMIN_ID);

  if (authError) {
    console.log('   ❌ Auth error:', authError.message);
    console.log('   Full error:', JSON.stringify(authError, null, 2));
  } else {
    console.log('   ✅ Auth user found:');
    console.log('      Email:', authUser.user.email);
    console.log('      Created:', authUser.user.created_at);
  }

  // Try to list just 1 user
  console.log('\n3. Trying listUsers with page 1 limit 1...');
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  if (listError) {
    console.log('   ❌ List error:', listError.message);
  } else {
    console.log('   ✅ List worked, found:', list.users.length, 'users');
    if (list.users[0]) {
      console.log('      First user email:', list.users[0].email);
    }
  }

  // Direct API call to see raw response
  console.log('\n4. Direct API call to auth endpoint...');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      }
    });

    const data = await response.json();
    console.log('   Status:', response.status);
    if (response.ok) {
      console.log('   ✅ Success - users count:', data.users?.length);
    } else {
      console.log('   ❌ Error:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('   ❌ Fetch error:', err.message);
  }

  console.log('\n===========================================');
}

checkAdmin().catch(console.error);

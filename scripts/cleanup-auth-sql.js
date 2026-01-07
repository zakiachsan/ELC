/**
 * Cleanup corrupted auth users via SQL
 * Usage: node scripts/cleanup-auth-sql.js
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

async function cleanup() {
  console.log('===========================================');
  console.log('CLEANUP AUTH DATABASE');
  console.log('===========================================\n');

  // Get all student profiles that were imported
  console.log('1. Getting student profiles...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, name')
    .eq('role', 'STUDENT')
    .like('email', '%@enormous1.com');

  if (profilesError) {
    console.log('   ❌ Error:', profilesError.message);
    return;
  }

  console.log('   Found', profiles.length, 'student profiles');

  // Try to check Supabase status
  console.log('\n2. Checking Supabase health...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      }
    });
    console.log('   REST API Status:', response.status);
  } catch (err) {
    console.log('   ❌ REST API error:', err.message);
  }

  // Check auth health
  console.log('\n3. Checking Auth API...');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      }
    });
    console.log('   Auth API Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('   External URL:', data.external_url);
    }
  } catch (err) {
    console.log('   ❌ Auth API error:', err.message);
  }

  // The issue: During bulk import, auth users might have been created
  // with corrupted identities or sessions

  console.log('\n4. RECOMMENDATION:');
  console.log('   The auth.users table appears to be corrupted from bulk import.');
  console.log('   This is a Supabase internal issue that needs to be fixed from:');
  console.log('');
  console.log('   Option A: Supabase Dashboard');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to Authentication > Users');
  console.log('   4. Try to delete the corrupted student users manually');
  console.log('   5. Then re-import using the script');
  console.log('');
  console.log('   Option B: SQL Editor in Supabase Dashboard');
  console.log('   1. Go to SQL Editor');
  console.log('   2. Run: SELECT * FROM auth.users WHERE email LIKE \'%@enormous1.com\' LIMIT 10');
  console.log('   3. If users exist, try: DELETE FROM auth.users WHERE email LIKE \'%@enormous1.com\'');
  console.log('   4. Also delete related: DELETE FROM auth.identities WHERE user_id IN (...)');
  console.log('   5. Then re-import');
  console.log('');
  console.log('   Option C: Contact Supabase Support');
  console.log('   If database is corrupted at a deeper level');
  console.log('');

  // Let's try one more thing - count auth users
  console.log('\n5. Trying to count auth users via API...');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   Total users (from API):', data.total || data.users?.length);
    } else {
      const err = await response.json();
      console.log('   ❌ Error:', err.msg || err.error);
    }
  } catch (err) {
    console.log('   ❌ Fetch error:', err.message);
  }

  console.log('\n===========================================');
}

cleanup().catch(console.error);

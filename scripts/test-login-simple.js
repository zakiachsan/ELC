/**
 * Simple Login Test - Just try to login
 * Usage: node scripts/test-login-simple.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzAyMTMsImV4cCI6MjA4MjQwNjIxM30.AvTJR6wF206M2Iz3raZCEOE6aAnhokjCR9W7PRrve2E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test credentials
const TEST_EMAIL = 'edward.chandyka@enormous1.com';
const TEST_PASSWORD = 'edward123';

async function testLogin() {
  console.log('Testing login for:', TEST_EMAIL);
  console.log('With password:', TEST_PASSWORD);
  console.log('');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (error) {
      console.log('❌ Login ERROR:');
      console.log('   Message:', error.message);
      console.log('   Status:', error.status);
      console.log('   Code:', error.code);
      console.log('   Full:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Login SUCCESS!');
      console.log('   User ID:', data.user?.id);
      console.log('   Email:', data.user?.email);
      console.log('   Session:', data.session ? 'Created' : 'None');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

// Also test admin login
async function testAdminLogin() {
  console.log('\n--- Testing ADMIN login ---');
  const ADMIN_EMAIL = 'admin@gmail.com';
  const ADMIN_PASSWORD = 'admin123';

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (error) {
      console.log('❌ Admin Login ERROR:', error.message);
    } else {
      console.log('✅ Admin Login SUCCESS!');
      console.log('   User ID:', data.user?.id);
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

testLogin().then(testAdminLogin).catch(console.error);

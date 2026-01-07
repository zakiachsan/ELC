/**
 * Check Edward's profile data
 * Usage: node scripts/check-edward-profile.js
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

async function check() {
  console.log('===========================================');
  console.log('CHECK EDWARD PROFILE');
  console.log('===========================================\n');

  // Get Edward's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'edward.chandyka@enormous1.com')
    .single();

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('Profile data:');
  console.log(JSON.stringify(profile, null, 2));

  // Get location name if assigned
  if (profile.assigned_location_id) {
    console.log('\n--- Location lookup ---');
    const { data: location } = await supabase
      .from('locations')
      .select('*')
      .eq('id', profile.assigned_location_id)
      .single();

    if (location) {
      console.log('Location found:', location.name);
    } else {
      console.log('❌ Location NOT FOUND for ID:', profile.assigned_location_id);
    }
  } else {
    console.log('\n⚠️ No assigned_location_id set!');
  }

  // Also check sessions that show for today
  console.log('\n--- Today\'s Sessions ---');
  const today = new Date().toISOString().split('T')[0];
  const { data: sessions } = await supabase
    .from('class_sessions')
    .select('id, topic, location, date_time')
    .gte('date_time', today)
    .lt('date_time', today + 'T23:59:59');

  console.log('Sessions today:', sessions?.length || 0);
  sessions?.forEach(s => {
    console.log(`  - ${s.topic} @ ${s.location}`);
  });

  console.log('\n===========================================');
}

check().catch(console.error);

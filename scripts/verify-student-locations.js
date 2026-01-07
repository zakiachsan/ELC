/**
 * Verify Student Location Assignments
 * Usage: node scripts/verify-student-locations.js
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

async function verify() {
  console.log('===========================================');
  console.log('VERIFY STUDENT LOCATION ASSIGNMENTS');
  console.log('===========================================\n');

  // Get all locations
  console.log('1. Getting all locations...');
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name, level');

  if (locError) {
    console.log('   ❌ Error:', locError.message);
    return;
  }

  console.log('   Found', locations.length, 'locations:');
  locations.forEach(l => console.log(`     - ${l.name} (${l.id})`));

  // Check SD ABDI SISWA ARIES
  console.log('\n2. Checking SD ABDI SISWA ARIES...');
  const sdAbdi = locations.find(l => l.name === 'SD ABDI SISWA ARIES');
  if (sdAbdi) {
    console.log('   ✅ Found:', sdAbdi.id);

    // Count students with this location
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'STUDENT')
      .eq('assigned_location_id', sdAbdi.id);

    console.log('   Students assigned:', count || 0);
  } else {
    console.log('   ❌ NOT FOUND!');
  }

  // Check SMP ABDI SISWA ARIES
  console.log('\n3. Checking SMP ABDI SISWA ARIES...');
  const smpAbdi = locations.find(l => l.name === 'SMP ABDI SISWA ARIES');
  if (smpAbdi) {
    console.log('   ✅ Found:', smpAbdi.id);

    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'STUDENT')
      .eq('assigned_location_id', smpAbdi.id);

    console.log('   Students assigned:', count || 0);
  } else {
    console.log('   ❌ NOT FOUND!');
  }

  // Check students with @enormous1.com email
  console.log('\n4. Checking students with @enormous1.com email...');
  const { data: students, error: studError } = await supabase
    .from('profiles')
    .select('id, email, name, assigned_location_id, school_origin')
    .eq('role', 'STUDENT')
    .like('email', '%@enormous1.com')
    .limit(10);

  if (studError) {
    console.log('   ❌ Error:', studError.message);
  } else {
    console.log('   Sample of', students.length, 'students:');
    students.forEach(s => {
      console.log(`     - ${s.name}`);
      console.log(`       Email: ${s.email}`);
      console.log(`       Location ID: ${s.assigned_location_id || 'NULL'}`);
      console.log(`       School Origin: ${s.school_origin || 'NULL'}`);
    });
  }

  // Count all students by location
  console.log('\n5. Student count by assigned_location_id...');
  const { data: allStudents, error: allError } = await supabase
    .from('profiles')
    .select('assigned_location_id')
    .eq('role', 'STUDENT');

  if (allError) {
    console.log('   ❌ Error:', allError.message);
  } else {
    const byLocation = {};
    allStudents.forEach(s => {
      const locId = s.assigned_location_id || 'NULL';
      byLocation[locId] = (byLocation[locId] || 0) + 1;
    });

    console.log('   Distribution:');
    Object.entries(byLocation).forEach(([locId, count]) => {
      const locName = locations.find(l => l.id === locId)?.name || 'Unknown/NULL';
      console.log(`     - ${locName}: ${count} students`);
    });
  }

  console.log('\n===========================================');
}

verify().catch(console.error);

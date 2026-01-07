/**
 * Verify data after fix
 * Usage: node scripts/verify-data-fixed.js
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
  console.log('VERIFY DATA AFTER FIX');
  console.log('===========================================\n');

  // 1. Check locations count (no duplicates)
  console.log('1. Checking locations...');
  const { data: locations, error: locErr } = await supabase
    .from('locations')
    .select('id, name, level');

  if (locErr) {
    console.log('   ❌ Error:', locErr.message);
    return;
  }

  // Check for duplicates
  const names = locations.map(l => l.name);
  const uniqueNames = [...new Set(names)];
  console.log('   Total locations:', locations.length);
  console.log('   Unique names:', uniqueNames.length);
  console.log('   Duplicates:', locations.length - uniqueNames.length, '(should be 0)');

  // 2. Check SD ABDI SISWA ARIES
  console.log('\n2. SD ABDI SISWA ARIES...');
  const sdAbdi = locations.filter(l => l.name === 'SD ABDI SISWA ARIES');
  console.log('   Count:', sdAbdi.length, '(should be 1)');
  if (sdAbdi[0]) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_location_id', sdAbdi[0].id);
    console.log('   Students:', count);
  }

  // 3. Check SMP ABDI SISWA ARIES
  console.log('\n3. SMP ABDI SISWA ARIES...');
  const smpAbdi = locations.filter(l => l.name === 'SMP ABDI SISWA ARIES');
  console.log('   Count:', smpAbdi.length, '(should be 1)');
  if (smpAbdi[0]) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_location_id', smpAbdi[0].id);
    console.log('   Students:', count);
  }

  // 4. Sample of schools with students
  console.log('\n4. Schools with students:');
  const schoolCounts = {};
  for (const loc of locations) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_location_id', loc.id);
    if (count > 0) {
      schoolCounts[loc.name] = count;
    }
  }

  Object.entries(schoolCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`   - ${name}: ${count} students`);
    });

  // 5. Sample students with school
  console.log('\n5. Sample students with location:');
  const { data: students } = await supabase
    .from('profiles')
    .select('name, email, assigned_location_id')
    .eq('role', 'STUDENT')
    .not('assigned_location_id', 'is', null)
    .limit(5);

  students?.forEach(s => {
    const loc = locations.find(l => l.id === s.assigned_location_id);
    console.log(`   - ${s.name}: ${loc?.name || 'Unknown'}`);
  });

  console.log('\n===========================================');
  console.log('✅ Data verification complete!');
  console.log('===========================================');
}

verify().catch(console.error);

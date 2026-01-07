/**
 * Fix Duplicate Locations
 * Merges duplicate locations and reassigns students
 * Usage: node scripts/fix-duplicate-locations.js
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

async function fixDuplicates() {
  console.log('===========================================');
  console.log('FIX DUPLICATE LOCATIONS');
  console.log('===========================================\n');

  // Get all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, level, address')
    .order('name');

  if (error) {
    console.log('❌ Error fetching locations:', error.message);
    return;
  }

  // Find duplicates by name
  const byName = {};
  locations.forEach(loc => {
    if (!byName[loc.name]) {
      byName[loc.name] = [];
    }
    byName[loc.name].push(loc);
  });

  const duplicates = Object.entries(byName).filter(([name, locs]) => locs.length > 1);

  console.log('Found', duplicates.length, 'location names with duplicates:\n');

  for (const [name, locs] of duplicates) {
    console.log(`📍 ${name} (${locs.length} duplicates)`);

    // For each location, count students
    for (const loc of locs) {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_location_id', loc.id);

      loc.studentCount = count || 0;
      console.log(`   - ${loc.id}: ${loc.studentCount} students, level=${loc.level}`);
    }

    // Keep the one with students OR the one with level set, merge into it
    const keep = locs.find(l => l.studentCount > 0) || locs.find(l => l.level) || locs[0];
    const toDelete = locs.filter(l => l.id !== keep.id);

    console.log(`   ✅ Keep: ${keep.id}`);

    // Reassign students from duplicates to keep
    for (const dup of toDelete) {
      if (dup.studentCount > 0) {
        console.log(`   🔄 Reassigning ${dup.studentCount} students from ${dup.id} to ${keep.id}...`);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ assigned_location_id: keep.id })
          .eq('assigned_location_id', dup.id);

        if (updateError) {
          console.log(`      ❌ Error: ${updateError.message}`);
        } else {
          console.log(`      ✅ Reassigned`);
        }
      }

      // Delete duplicate location
      console.log(`   🗑️  Deleting duplicate: ${dup.id}...`);
      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .eq('id', dup.id);

      if (deleteError) {
        console.log(`      ❌ Error: ${deleteError.message}`);
      } else {
        console.log(`      ✅ Deleted`);
      }
    }

    console.log('');
  }

  // Verify fix for SD ABDI SISWA ARIES
  console.log('\n--- VERIFICATION ---\n');

  const { data: sdAbdi } = await supabase
    .from('locations')
    .select('id, name')
    .eq('name', 'SD ABDI SISWA ARIES');

  console.log('SD ABDI SISWA ARIES locations remaining:', sdAbdi?.length);

  if (sdAbdi && sdAbdi.length > 0) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_location_id', sdAbdi[0].id);

    console.log(`   ID: ${sdAbdi[0].id}`);
    console.log(`   Students: ${count}`);
  }

  const { data: smpAbdi } = await supabase
    .from('locations')
    .select('id, name')
    .eq('name', 'SMP ABDI SISWA ARIES');

  console.log('\nSMP ABDI SISWA ARIES locations remaining:', smpAbdi?.length);

  if (smpAbdi && smpAbdi.length > 0) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_location_id', smpAbdi[0].id);

    console.log(`   ID: ${smpAbdi[0].id}`);
    console.log(`   Students: ${count}`);
  }

  console.log('\n===========================================');
  console.log('DONE! Refresh the locations page to see updated counts.');
  console.log('===========================================');
}

fixDuplicates().catch(console.error);

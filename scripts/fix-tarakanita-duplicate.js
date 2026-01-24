/**
 * Fix duplicate SMP TARAKANITA locations
 *
 * This script:
 * 1. Finds both SMP TARAKANITA and SMP TARAKANITA 4 locations
 * 2. Migrates any profiles from TARAKANITA 4 to TARAKANITA
 * 3. Deletes the duplicate TARAKANITA 4 location
 *
 * Usage: node scripts/fix-tarakanita-duplicate.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('='.repeat(60));
  console.log('FIX DUPLICATE SMP TARAKANITA LOCATIONS');
  console.log('='.repeat(60) + '\n');

  // Step 1: Find both locations
  console.log('[STEP 1] Finding TARAKANITA locations...');

  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name')
    .ilike('name', '%TARAKANITA%');

  if (locError) {
    console.error('Failed to get locations:', locError.message);
    return;
  }

  console.log('  Found locations:');
  locations.forEach(loc => console.log(`    - ${loc.name} (${loc.id})`));

  const correctLoc = locations.find(l => l.name === 'SMP TARAKANITA');
  const duplicateLoc = locations.find(l => l.name === 'SMP TARAKANITA 4');

  if (!duplicateLoc) {
    console.log('\n  ✅ No duplicate "SMP TARAKANITA 4" found. Nothing to fix.');
    return;
  }

  if (!correctLoc) {
    console.log('\n  ❌ No "SMP TARAKANITA" found. Cannot merge.');
    return;
  }

  console.log(`\n  Correct location: ${correctLoc.name} (${correctLoc.id})`);
  console.log(`  Duplicate location: ${duplicateLoc.name} (${duplicateLoc.id})`);

  // Step 2: Check for profiles using the duplicate location
  console.log('\n[STEP 2] Checking for profiles assigned to duplicate location...');

  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, name, role, assigned_location_id')
    .eq('assigned_location_id', duplicateLoc.id);

  if (profError) {
    console.error('Failed to get profiles:', profError.message);
    return;
  }

  console.log(`  Found ${profiles?.length || 0} profiles assigned to "${duplicateLoc.name}"`);

  if (profiles && profiles.length > 0) {
    console.log('  Profiles to migrate:');
    profiles.forEach(p => console.log(`    - ${p.name} (${p.role})`));

    // Step 3: Migrate profiles to correct location
    console.log('\n[STEP 3] Migrating profiles to correct location...');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ assigned_location_id: correctLoc.id })
      .eq('assigned_location_id', duplicateLoc.id);

    if (updateError) {
      console.error('Failed to migrate profiles:', updateError.message);
      return;
    }

    console.log(`  ✅ Migrated ${profiles.length} profiles to "${correctLoc.name}"`);
  } else {
    console.log('  No profiles to migrate.');
  }

  // Step 4: Delete classes for duplicate location (if any)
  console.log('\n[STEP 4] Removing classes for duplicate location...');

  const { data: deletedClasses, error: classError } = await supabase
    .from('classes')
    .delete()
    .eq('location_id', duplicateLoc.id)
    .select();

  if (classError) {
    console.error('Failed to delete classes:', classError.message);
  } else {
    console.log(`  Deleted ${deletedClasses?.length || 0} classes from duplicate location`);
  }

  // Step 5: Delete duplicate location
  console.log('\n[STEP 5] Deleting duplicate location...');

  const { error: deleteError } = await supabase
    .from('locations')
    .delete()
    .eq('id', duplicateLoc.id);

  if (deleteError) {
    console.error('Failed to delete location:', deleteError.message);
    console.log('  There might be foreign key constraints. Please check manually.');
    return;
  }

  console.log(`  ✅ Deleted "${duplicateLoc.name}"`);

  // Step 6: Verify
  console.log('\n[VERIFICATION]');

  const { data: finalLocations } = await supabase
    .from('locations')
    .select('id, name')
    .ilike('name', '%TARAKANITA%');

  console.log('  Remaining TARAKANITA locations:');
  finalLocations?.forEach(loc => console.log(`    - ${loc.name}`));

  const { count: classCount } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', correctLoc.id);

  console.log(`  Classes for SMP TARAKANITA: ${classCount}`);

  console.log('\n' + '='.repeat(60));
  console.log('COMPLETED');
  console.log('='.repeat(60));
}

main().catch(console.error);

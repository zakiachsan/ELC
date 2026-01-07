/**
 * Update teacher assigned_classes for SMK SANTA MARIA and SMA ABDI SISWA BINTARO
 *
 * Usage: node scripts/update-teacher-classes.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('='.repeat(60));
  console.log('UPDATE TEACHER ASSIGNED CLASSES');
  console.log('='.repeat(60) + '\n');

  // Step 1: Get target locations
  console.log('[STEP 1] Getting target locations...');
  const targetLocationNames = ['SMK SANTA MARIA', 'SMA ABDI SISWA BINTARO'];

  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name')
    .in('name', targetLocationNames);

  if (locError) {
    console.error('Failed to get locations:', locError.message);
    return;
  }

  const locationMap = {};
  locations.forEach(loc => {
    locationMap[loc.name] = loc.id;
  });

  console.log(`  Found locations:`);
  for (const loc of locations) {
    console.log(`    - ${loc.name}: ${loc.id}`);
  }
  console.log();

  // Step 2: Get classes for each location
  console.log('[STEP 2] Getting classes for each location...');
  const classesByLocation = {};

  for (const loc of locations) {
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('name')
      .eq('location_id', loc.id);

    if (classError) {
      console.error(`Failed to get classes for ${loc.name}:`, classError.message);
      continue;
    }

    classesByLocation[loc.id] = classes.map(c => c.name);
    console.log(`  ${loc.name}: ${classes.length} classes`);
    console.log(`    ${classesByLocation[loc.id].join(', ')}`);
  }
  console.log();

  // Step 3: Find teachers assigned to these locations
  console.log('[STEP 3] Finding teachers assigned to target locations...');
  const { data: teachers, error: teacherError } = await supabase
    .from('profiles')
    .select('id, name, email, assigned_location_ids, assigned_classes')
    .eq('role', 'TEACHER');

  if (teacherError) {
    console.error('Failed to get teachers:', teacherError.message);
    return;
  }

  // Filter teachers assigned to target locations
  const targetLocationIds = locations.map(l => l.id);
  const relevantTeachers = teachers.filter(t =>
    t.assigned_location_ids?.some(lid => targetLocationIds.includes(lid))
  );

  console.log(`  Found ${relevantTeachers.length} teachers assigned to target locations:\n`);

  // Step 4: Update each teacher's assigned_classes
  console.log('[STEP 4] Updating teacher assigned_classes...\n');

  for (const teacher of relevantTeachers) {
    console.log(`  ${teacher.name} (${teacher.email})`);
    console.log(`    Current classes: ${teacher.assigned_classes?.length || 0}`);

    // Get all location IDs for this teacher
    const teacherLocationIds = teacher.assigned_location_ids || [];

    // Collect new classes from target locations
    const newClasses = new Set(teacher.assigned_classes || []);
    let addedClasses = [];

    for (const locId of teacherLocationIds) {
      if (classesByLocation[locId]) {
        for (const className of classesByLocation[locId]) {
          if (!newClasses.has(className)) {
            newClasses.add(className);
            addedClasses.push(className);
          }
        }
      }
    }

    if (addedClasses.length > 0) {
      console.log(`    Adding classes: ${addedClasses.join(', ')}`);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ assigned_classes: Array.from(newClasses) })
        .eq('id', teacher.id);

      if (updateError) {
        console.log(`    ✗ Error: ${updateError.message}`);
      } else {
        console.log(`    ✓ Updated: ${newClasses.size} total classes`);
      }
    } else {
      console.log(`    - No new classes to add`);
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log('COMPLETED');
  console.log('='.repeat(60));
}

main().catch(console.error);

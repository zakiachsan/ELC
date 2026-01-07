/**
 * Populate classes table from existing school_origin data
 * Usage: node scripts/populate-classes.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('='.repeat(50));
  console.log('POPULATE CLASSES TABLE FROM SCHOOL_ORIGIN');
  console.log('='.repeat(50) + '\n');

  // Step 1: Get all locations
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name');

  if (locError) {
    console.error('Failed to get locations:', locError.message);
    return;
  }

  console.log(`Found ${locations.length} locations\n`);

  // Step 2: Get all students with school_origin (in batches to overcome 1000 row limit)
  const batchSize = 1000;
  let allStudents = [];
  let from = 0;
  let hasMore = true;

  console.log('Fetching students in batches...');

  while (hasMore) {
    const { data, error: studError } = await supabase
      .from('profiles')
      .select('school_origin, assigned_location_id')
      .eq('role', 'STUDENT')
      .not('school_origin', 'is', null)
      .range(from, from + batchSize - 1);

    if (studError) {
      console.error('Failed to get students:', studError.message);
      return;
    }

    if (data && data.length > 0) {
      allStudents = [...allStudents, ...data];
      console.log(`  Fetched batch ${Math.floor(from / batchSize) + 1}: ${data.length} students (total: ${allStudents.length})`);
      from += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  const students = allStudents;
  console.log(`\nFound ${students.length} students with school_origin\n`);

  // Step 3: Extract unique classes per location
  // Format of school_origin: "SD SANG TIMUR KARANG TENGAH - KELAS 1 A (Regular)"
  // or "SMP MARSUDIRINI - 7A (Regular)"
  const classesMap = new Map(); // key: location_id|class_name, value: { location_id, name, class_type }

  for (const student of students) {
    if (!student.school_origin || !student.assigned_location_id) continue;

    // Parse school_origin
    const match = student.school_origin.match(/^(.+?)\s*-\s*(.+?)\s*\((.+?)\)$/);
    if (!match) {
      // Try simpler format without parentheses
      const simpleMatch = student.school_origin.match(/^(.+?)\s*-\s*(.+?)$/);
      if (simpleMatch) {
        const [, schoolPart, classPart] = simpleMatch;
        const className = classPart.trim();
        const key = `${student.assigned_location_id}|${className}`;
        if (!classesMap.has(key)) {
          classesMap.set(key, {
            location_id: student.assigned_location_id,
            name: className,
            class_type: 'Regular'
          });
        }
      }
      continue;
    }

    const [, schoolPart, classPart, classType] = match;
    const className = classPart.trim();
    const key = `${student.assigned_location_id}|${className}`;

    if (!classesMap.has(key)) {
      // Truncate class_type to 20 chars (database column limit)
      const truncatedClassType = classType.trim().substring(0, 20);
      classesMap.set(key, {
        location_id: student.assigned_location_id,
        name: className,
        class_type: truncatedClassType
      });
    }
  }

  console.log(`Extracted ${classesMap.size} unique classes\n`);

  // Step 4: Insert classes into the table
  const classesToInsert = Array.from(classesMap.values());

  // Group by location for display
  const byLocation = {};
  for (const cls of classesToInsert) {
    const loc = locations.find(l => l.id === cls.location_id);
    const locName = loc ? loc.name : 'Unknown';
    if (!byLocation[locName]) byLocation[locName] = [];
    byLocation[locName].push(cls.name);
  }

  console.log('Classes by location:');
  for (const [locName, classes] of Object.entries(byLocation)) {
    console.log(`  ${locName}: ${classes.length} classes`);
    // Show first 5 classes
    classes.slice(0, 5).forEach(c => console.log(`    - ${c}`));
    if (classes.length > 5) console.log(`    ... and ${classes.length - 5} more`);
  }
  console.log();

  // Insert in batches
  const insertBatchSize = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < classesToInsert.length; i += insertBatchSize) {
    const batch = classesToInsert.slice(i, i + insertBatchSize);

    const { data, error } = await supabase
      .from('classes')
      .upsert(batch, {
        onConflict: 'location_id,name',
        ignoreDuplicates: true
      })
      .select();

    if (error) {
      console.error(`Batch ${Math.floor(i / insertBatchSize) + 1} error:`, error.message);
      skipped += batch.length;
    } else {
      inserted += data?.length || 0;
    }
  }

  console.log('='.repeat(50));
  console.log('COMPLETED');
  console.log('='.repeat(50));
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped/Errors: ${skipped}`);

  // Verify
  const { count } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal classes in database: ${count}`);
}

main().catch(console.error);

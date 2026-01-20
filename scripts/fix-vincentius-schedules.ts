/**
 * Script to fix SD ST VINCENTIUS schedule class names
 * Run with: npx tsx scripts/fix-vincentius-schedules.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('=== Fix SD ST VINCENTIUS Schedule Class Names ===\n');

  // Step 1: Get the location ID for SD ST VINCENTIUS
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name')
    .eq('name', 'SD ST VINCENTIUS')
    .single();

  if (locError || !locations) {
    console.error('Could not find SD ST VINCENTIUS location:', locError);
    return;
  }

  console.log(`Found location: ${locations.name} (${locations.id})`);

  // Step 2: Get all class names defined for this location
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('name, class_type')
    .eq('location_id', locations.id)
    .order('name');

  if (classError) {
    console.error('Error fetching classes:', classError);
    return;
  }

  console.log(`\nDefined classes for SD ST VINCENTIUS:`);
  classes?.forEach(c => console.log(`  - ${c.name} (${c.class_type || 'Regular'})`));

  // Step 3: Build mapping from old format to new format
  // Format: X.Y -> find matching class name
  const classNameMap: Record<string, string> = {};

  classes?.forEach(c => {
    // Extract grade and section from class name like "KELAS 1 A" or "KELAS 2A"
    const match = c.name.match(/KELAS\s*(\d+)\s*([A-C])/i);
    if (match) {
      const grade = match[1];
      const section = match[2].toUpperCase();
      // Map section letter to number: A=1, B=2, C=3
      const sectionNum = section.charCodeAt(0) - 64; // A=1, B=2, C=3
      const oldFormat = `${grade}.${sectionNum}`;
      classNameMap[oldFormat] = c.name;
    }
  });

  console.log(`\nClass name mapping:`);
  Object.entries(classNameMap).forEach(([old, newName]) => {
    console.log(`  ${old} -> ${newName}`);
  });

  // Step 4: Find sessions with old format class names
  const { data: sessions, error: sessError } = await supabase
    .from('class_sessions')
    .select('id, location, date_time, topic')
    .like('location', 'SD ST VINCENTIUS - %.%')
    .order('date_time', { ascending: false });

  if (sessError) {
    console.error('Error fetching sessions:', sessError);
    return;
  }

  console.log(`\nFound ${sessions?.length || 0} sessions with old format class names:\n`);

  if (!sessions || sessions.length === 0) {
    console.log('No sessions need to be fixed!');
    return;
  }

  // Preview changes
  const changes: { id: string; oldLocation: string; newLocation: string; topic: string }[] = [];

  sessions.forEach(session => {
    const match = session.location.match(/SD ST VINCENTIUS - (\d+\.\d+)/);
    if (match) {
      const oldClassFormat = match[1];
      const newClassName = classNameMap[oldClassFormat];
      if (newClassName) {
        const newLocation = `SD ST VINCENTIUS - ${newClassName}`;
        changes.push({
          id: session.id,
          oldLocation: session.location,
          newLocation,
          topic: session.topic
        });
        console.log(`  [${session.date_time}] "${session.topic}"`);
        console.log(`    ${session.location} -> ${newLocation}\n`);
      } else {
        console.log(`  [SKIP] ${session.location} - no mapping found for ${oldClassFormat}`);
      }
    }
  });

  if (changes.length === 0) {
    console.log('No changes needed!');
    return;
  }

  // Ask for confirmation
  console.log(`\n=== Ready to update ${changes.length} sessions ===`);
  console.log('Run with --apply flag to actually apply changes');
  console.log('  npx tsx scripts/fix-vincentius-schedules.ts --apply\n');

  // Check for --apply flag
  if (process.argv.includes('--apply')) {
    console.log('Applying changes...\n');

    let updated = 0;
    let failed = 0;

    for (const change of changes) {
      const { error } = await supabase
        .from('class_sessions')
        .update({ location: change.newLocation })
        .eq('id', change.id);

      if (error) {
        console.error(`  Failed to update ${change.id}:`, error.message);
        failed++;
      } else {
        console.log(`  Updated: ${change.oldLocation} -> ${change.newLocation}`);
        updated++;
      }
    }

    console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
  }
}

main().catch(console.error);

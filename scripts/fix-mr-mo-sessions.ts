/**
 * Fix Mr Mo's SMP TARAKANITA Sessions
 *
 * Updates sessions from "SD TARAKANITA - KELAS 7A" to "SMP TARAKANITA - KELAS 7A"
 * for grades 7, 8, 9
 *
 * Run with: npx tsx scripts/fix-mr-mo-sessions.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('='.repeat(60));
  console.log('FIX MR MO SMP TARAKANITA SESSIONS');
  console.log(DRY_RUN ? '>>> DRY RUN MODE <<<' : '>>> LIVE MODE <<<');
  console.log('='.repeat(60) + '\n');

  // Get location IDs
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .in('name', ['SD TARAKANITA', 'SMP TARAKANITA']);

  const sdLocation = locations?.find(l => l.name === 'SD TARAKANITA');
  const smpLocation = locations?.find(l => l.name === 'SMP TARAKANITA');

  if (!sdLocation || !smpLocation) {
    console.error('Could not find locations');
    return;
  }

  console.log(`SD TARAKANITA ID: ${sdLocation.id}`);
  console.log(`SMP TARAKANITA ID: ${smpLocation.id}\n`);

  // Get Mr Mo's ID
  const { data: teacher } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('email', 'mr.teacher@enormous1.com')
    .single();

  if (!teacher) {
    console.error('Teacher not found');
    return;
  }

  console.log(`Teacher: ${teacher.name} (${teacher.id})\n`);

  // Find sessions with SD TARAKANITA for grades 7, 8, 9
  const { data: sessions, error } = await supabase
    .from('class_sessions')
    .select('id, location, location_id, date_time, topic')
    .eq('teacher_id', teacher.id)
    .like('location', 'SD TARAKANITA - KELAS %');

  if (error) {
    console.error('Error fetching sessions:', error);
    return;
  }

  // Filter to only grades 7, 8, 9
  const smpSessions = sessions?.filter(s => {
    const match = s.location?.match(/KELAS ([789])[A-E]/);
    return match !== null;
  });

  console.log(`Found ${smpSessions?.length || 0} SMP sessions to fix\n`);

  if (!smpSessions || smpSessions.length === 0) {
    console.log('No sessions to fix!');
    return;
  }

  let updated = 0;
  const errors: string[] = [];

  for (const session of smpSessions) {
    const oldLocation = session.location;
    const newLocation = oldLocation.replace('SD TARAKANITA', 'SMP TARAKANITA');

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('class_sessions')
        .update({
          location: newLocation,
          location_id: smpLocation.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (updateError) {
        errors.push(`${session.id}: ${updateError.message}`);
      } else {
        updated++;
        console.log(`[UPDATED] ${oldLocation} -> ${newLocation}`);
      }
    } else {
      updated++;
      console.log(`[DRY-RUN] ${oldLocation} -> ${newLocation}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Sessions ${DRY_RUN ? 'would be ' : ''}updated: ${updated}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    errors.forEach(e => console.log(`  - ${e}`));
  }

  if (DRY_RUN) {
    console.log('\n>>> Run without --dry-run to apply changes <<<');
  }
}

main().catch(console.error);

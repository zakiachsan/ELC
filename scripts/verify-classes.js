/**
 * Verify classes count for all schools
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('='.repeat(60));
  console.log('CLASSES COUNT BY SCHOOL');
  console.log('='.repeat(60) + '\n');

  // Get all locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, level')
    .order('level')
    .order('name');

  // Get all classes
  const { data: classes } = await supabase
    .from('classes')
    .select('location_id');

  // Group by location
  const countByLocation = {};
  for (const cls of classes || []) {
    countByLocation[cls.location_id] = (countByLocation[cls.location_id] || 0) + 1;
  }

  // Group by level
  const levels = ['KINDERGARTEN', 'PRIMARY', 'JUNIOR', 'SENIOR'];
  const levelNames = {
    'KINDERGARTEN': 'TK',
    'PRIMARY': 'SD',
    'JUNIOR': 'SMP',
    'SENIOR': 'SMA/SMK'
  };

  let totalWithClasses = 0;
  let totalWithoutClasses = 0;

  for (const level of levels) {
    const schoolsAtLevel = locations?.filter(l => l.level === level) || [];
    if (schoolsAtLevel.length === 0) continue;

    console.log(`\n${levelNames[level]} (${level}):`);
    console.log('-'.repeat(40));

    for (const loc of schoolsAtLevel) {
      const count = countByLocation[loc.id] || 0;
      const status = count > 0 ? '✅' : '❌';
      console.log(`  ${status} ${loc.name}: ${count} kelas`);

      if (count > 0) totalWithClasses++;
      else totalWithoutClasses++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total sekolah dengan kelas: ${totalWithClasses}`);
  console.log(`Total sekolah tanpa kelas: ${totalWithoutClasses}`);
  console.log(`Total kelas: ${classes?.length || 0}`);
}

main().catch(console.error);

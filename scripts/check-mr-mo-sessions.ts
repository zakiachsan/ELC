import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('Checking Mr Mo sessions...\n');

  // Get Mr Mo's ID
  const { data: teacher } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('email', 'mr.teacher@enormous1.com')
    .single();

  if (!teacher) {
    console.log('Teacher not found');
    return;
  }

  console.log(`Teacher: ${teacher.name} (${teacher.id})\n`);

  // Get all sessions for Mr Mo
  const { data: sessions, error } = await supabase
    .from('class_sessions')
    .select('id, location, location_id, date_time, topic')
    .eq('teacher_id', teacher.id)
    .order('date_time', { ascending: false });

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log(`Total sessions: ${sessions?.length || 0}\n`);

  // Group by location pattern
  const byLocation: Record<string, any[]> = {};
  sessions?.forEach(s => {
    const loc = s.location || 'null';
    if (!byLocation[loc]) byLocation[loc] = [];
    byLocation[loc].push(s);
  });

  console.log('Sessions by location:');
  Object.entries(byLocation).forEach(([loc, items]) => {
    console.log(`\n  "${loc}": ${items.length} sessions`);
    // Show first 3
    items.slice(0, 3).forEach(s => {
      const date = new Date(s.date_time).toLocaleDateString('id-ID');
      console.log(`    - ${date}: ${s.topic?.slice(0, 50)}...`);
    });
  });

  // Check for old format (X.Y pattern like 7.1, 8.2, etc.)
  const oldFormatSessions = sessions?.filter(s => {
    return s.location && /\d+\.\d+/.test(s.location);
  });

  console.log(`\n\n=== Sessions with OLD format (X.Y like 7.1, 8.2) ===`);
  console.log(`Found: ${oldFormatSessions?.length || 0} sessions`);

  oldFormatSessions?.forEach(s => {
    const date = new Date(s.date_time).toLocaleDateString('id-ID');
    console.log(`  - ${s.location} | ${date} | ${s.topic?.slice(0, 40)}...`);
  });

  // Check for SMP TARAKANITA sessions
  const smpTarakanitaSessions = sessions?.filter(s => {
    return s.location && s.location.includes('TARAKANITA') && /[789]/.test(s.location);
  });

  console.log(`\n\n=== Sessions with TARAKANITA grades 7/8/9 ===`);
  console.log(`Found: ${smpTarakanitaSessions?.length || 0} sessions`);

  smpTarakanitaSessions?.slice(0, 10).forEach(s => {
    const date = new Date(s.date_time).toLocaleDateString('id-ID');
    console.log(`  - ${s.location} | ${date} | ${s.topic?.slice(0, 40)}...`);
  });
}

check().catch(console.error);

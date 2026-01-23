import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('Checking database for SMP students...\n');

  // Check students with grade 7, 8, 9 in school_origin
  const { data: smpStudents, error: err1 } = await supabase
    .from('profiles')
    .select('name, email, school_origin')
    .eq('role', 'STUDENT')
    .or('school_origin.like.% 7%,school_origin.like.% 8%,school_origin.like.% 9%,school_origin.like.%KELAS 7%,school_origin.like.%KELAS 8%,school_origin.like.%KELAS 9%')
    .limit(30);

  console.log('Students with grade 7/8/9 in school_origin:');
  smpStudents?.forEach(s => {
    console.log(`  ${s.name} | ${s.email} | ${s.school_origin}`);
  });
  console.log(`\nTotal: ${smpStudents?.length || 0}\n`);

  // Check for any TARAKANITA students
  const { data: tarakanitaStudents, error: err2 } = await supabase
    .from('profiles')
    .select('name, email, school_origin')
    .eq('role', 'STUDENT')
    .like('school_origin', '%TARAKANITA%')
    .limit(30);

  console.log('Students with TARAKANITA in school_origin:');
  tarakanitaStudents?.forEach(s => {
    console.log(`  ${s.name} | ${s.email} | ${s.school_origin}`);
  });
  console.log(`\nTotal: ${tarakanitaStudents?.length || 0}\n`);

  // Check SD TARAKANITA location students
  const sdTarakanitaId = '07173e72-3df0-427d-8f2e-407e779a67bc';
  const { data: sdStudents, count: sdCount } = await supabase
    .from('profiles')
    .select('name, email, school_origin', { count: 'exact' })
    .eq('role', 'STUDENT')
    .eq('assigned_location_id', sdTarakanitaId)
    .limit(20);

  console.log(`Students assigned to SD TARAKANITA location (${sdTarakanitaId}):`);
  sdStudents?.forEach(s => {
    console.log(`  ${s.name} | ${s.email} | ${s.school_origin}`);
  });
  console.log(`\nTotal: ${sdCount || 0}\n`);

  // Check SMP TARAKANITA location students
  const smpTarakanitaId = '70ccebea-dcd0-414f-8e39-48a4f56f257b';
  const { data: smpLocStudents, count: smpCount } = await supabase
    .from('profiles')
    .select('name, email, school_origin', { count: 'exact' })
    .eq('role', 'STUDENT')
    .eq('assigned_location_id', smpTarakanitaId)
    .limit(20);

  console.log(`Students assigned to SMP TARAKANITA location (${smpTarakanitaId}):`);
  smpLocStudents?.forEach(s => {
    console.log(`  ${s.name} | ${s.email} | ${s.school_origin}`);
  });
  console.log(`\nTotal: ${smpCount || 0}`);
}

check().catch(console.error);

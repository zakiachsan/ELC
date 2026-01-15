import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('=== Daftar Akun Parent ===\n');

  // Get all parent accounts
  const { data: parents, error: parentsError } = await supabase
    .from('profiles')
    .select('id, name, email, status, linked_student_id, created_at')
    .eq('role', 'PARENT')
    .order('created_at', { ascending: false });

  if (parentsError) {
    console.error('Error fetching parents:', parentsError);
    return;
  }

  if (!parents || parents.length === 0) {
    console.log('Tidak ada akun parent yang ditemukan di database.');
    return;
  }

  console.log(`Ditemukan ${parents.length} akun parent:\n`);

  // Get linked students info
  const studentIds = parents.filter(p => p.linked_student_id).map(p => p.linked_student_id);

  let studentsMap = {};
  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from('profiles')
      .select('id, name, email, school_origin')
      .in('id', studentIds);

    if (students) {
      studentsMap = Object.fromEntries(students.map(s => [s.id, s]));
    }
  }

  parents.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Email: ${p.email}`);
    console.log(`   Status: ${p.status}`);
    console.log(`   Created: ${new Date(p.created_at).toLocaleDateString('id-ID')}`);

    if (p.linked_student_id && studentsMap[p.linked_student_id]) {
      const student = studentsMap[p.linked_student_id];
      console.log(`   Linked Student: ${student.name} (${student.school_origin || 'N/A'})`);
    } else if (p.linked_student_id) {
      console.log(`   Linked Student ID: ${p.linked_student_id} (student not found)`);
    } else {
      console.log(`   Linked Student: None`);
    }
    console.log('');
  });
}

main().catch(console.error);

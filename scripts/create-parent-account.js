// Script untuk membuat akun parent yang di-link ke student real
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
  console.log('=== Create Parent Account Script ===\n');

  // 1. Get a real student to link
  console.log('1. Fetching students...');
  const { data: students, error: studentsError } = await supabase
    .from('profiles')
    .select('id, name, email, school_origin')
    .eq('role', 'STUDENT')
    .eq('status', 'ACTIVE')
    .limit(10);

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    return;
  }

  console.log(`Found ${students.length} students:\n`);
  students.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name} - ${s.school_origin || 'N/A'} - ${s.email}`);
  });

  // Pick first student for demo
  const selectedStudent = students[0];
  if (!selectedStudent) {
    console.error('No students found!');
    return;
  }

  console.log(`\n2. Selected student: ${selectedStudent.name} (${selectedStudent.id})`);

  // 2. Create parent credentials
  const parentName = `Parent of ${selectedStudent.name}`;
  const parentEmail = `parent.${selectedStudent.email.split('@')[0]}@gmail.com`;
  const parentPassword = 'Parent123!';

  console.log(`\n3. Creating parent account:`);
  console.log(`   Name: ${parentName}`);
  console.log(`   Email: ${parentEmail}`);
  console.log(`   Password: ${parentPassword}`);
  console.log(`   Linked Student: ${selectedStudent.name}`);

  // 3. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: parentEmail,
    password: parentPassword,
    email_confirm: true,
  });

  if (authError) {
    console.error('\nError creating auth user:', authError.message);
    return;
  }

  console.log(`\n4. Auth user created: ${authData.user.id}`);

  // 4. Create profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: parentEmail,
      name: parentName,
      role: 'PARENT',
      status: 'ACTIVE',
      linked_student_id: selectedStudent.id,
    })
    .select()
    .single();

  if (profileError) {
    console.error('\nError creating profile:', profileError.message);
    // Rollback auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    return;
  }

  console.log(`\n5. Profile created successfully!`);
  console.log('\n=== PARENT ACCOUNT CREATED ===');
  console.log(`Email: ${parentEmail}`);
  console.log(`Password: ${parentPassword}`);
  console.log(`Parent Name: ${parentName}`);
  console.log(`Linked Student: ${selectedStudent.name}`);
  console.log(`Parent ID: ${authData.user.id}`);
  console.log(`Student ID: ${selectedStudent.id}`);
}

main().catch(console.error);

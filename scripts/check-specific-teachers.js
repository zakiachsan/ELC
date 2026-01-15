import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // Get specific teachers
    const teacherNames = ['Mr Chris', 'Mr Gavin'];

    for (const name of teacherNames) {
        console.log('='.repeat(60));
        console.log(`TEACHER: ${name}`);
        console.log('='.repeat(60));

        const { data: teacher, error } = await supabase
            .from('profiles')
            .select('id, name, assigned_location_ids, assigned_classes, assigned_subjects')
            .eq('role', 'TEACHER')
            .ilike('name', `%${name}%`)
            .single();

        if (error) {
            console.log('Error:', error.message);
            continue;
        }

        console.log('\nDB Data:');
        console.log('  assigned_classes:', JSON.stringify(teacher.assigned_classes, null, 2));
        console.log('  assigned_subjects:', teacher.assigned_subjects);

        // Get school names
        if (teacher.assigned_location_ids?.length > 0) {
            const { data: locations } = await supabase
                .from('locations')
                .select('id, name')
                .in('id', teacher.assigned_location_ids);

            console.log('  Schools:', locations?.map(l => l.name).join(', '));

            // For each school, get the classes in the classes table
            for (const loc of locations || []) {
                const { data: classes } = await supabase
                    .from('classes')
                    .select('name, class_type')
                    .eq('location_id', loc.id)
                    .order('name');

                console.log(`\n  Classes in ${loc.name}:`);

                // Filter to show only assigned classes
                const assignedInThisSchool = classes?.filter(c =>
                    teacher.assigned_classes?.includes(c.name)
                );

                if (assignedInThisSchool?.length > 0) {
                    for (const cls of assignedInThisSchool) {
                        console.log(`    - ${cls.name} (${cls.class_type})`);
                    }
                } else {
                    console.log('    (no matching classes in assigned_classes)');
                }
            }
        }

        console.log('\n');
    }

    // Also check what SHOULD be according to CSV
    console.log('='.repeat(60));
    console.log('EXPECTED FROM CSV:');
    console.log('='.repeat(60));
    console.log(`
Mr Chris:
  - SD Bhakti, Regular, kelas 2,3,4,5,6

Mr Gavin:
  - TK Abdi Siswa Bintaro, bilingual, TK
  - SD Tarakanita Citra Raya, Regular, kelas 1, 6
  - SD Abdi Siswa Bintaro, bilingual, kelas 1, 2, 3, 4
`);
}

main().catch(console.error);

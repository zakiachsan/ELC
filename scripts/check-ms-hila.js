import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('='.repeat(60));
    console.log('CHECKING MS HILA DATA');
    console.log('='.repeat(60));

    // Get Ms Hila's profile
    const { data: teacher, error } = await supabase
        .from('profiles')
        .select('id, name, assigned_location_ids, assigned_classes, assigned_subjects')
        .eq('role', 'TEACHER')
        .ilike('name', '%hila%')
        .single();

    if (error) {
        console.log('Error finding teacher:', error.message);
        return;
    }

    console.log('\nTeacher Data:');
    console.log('  ID:', teacher.id);
    console.log('  Name:', teacher.name);
    console.log('  assigned_classes:', JSON.stringify(teacher.assigned_classes, null, 2));
    console.log('  assigned_subjects:', teacher.assigned_subjects);

    // Get school info
    if (teacher.assigned_location_ids?.length > 0) {
        const { data: locations } = await supabase
            .from('locations')
            .select('id, name, level')
            .in('id', teacher.assigned_location_ids);

        console.log('\nAssigned Schools:');
        for (const loc of locations || []) {
            console.log(`  - ${loc.name} (${loc.level})`);
        }

        // Check SDK Sang Timur Karang Tengah specifically
        const sdkLocation = locations?.find(l => l.name.includes('SANG TIMUR') && l.name.includes('KARANG'));
        
        if (sdkLocation) {
            console.log('\n' + '='.repeat(60));
            console.log(`CLASSES IN "${sdkLocation.name}"`);
            console.log('='.repeat(60));
            
            const { data: classes } = await supabase
                .from('classes')
                .select('name, class_type')
                .eq('location_id', sdkLocation.id)
                .order('name');

            console.log('\nAll classes in database:');
            for (const cls of classes || []) {
                const isAssigned = teacher.assigned_classes?.includes(cls.name);
                console.log(`  ${isAssigned ? '✓' : ' '} ${cls.name} (${cls.class_type || 'Regular'})`);
            }

            // Check which assigned classes match
            console.log('\n' + '-'.repeat(40));
            console.log('MATCHING STATUS:');
            console.log('-'.repeat(40));
            
            const classNames = classes?.map(c => c.name) || [];
            const matchedClasses = teacher.assigned_classes?.filter(c => classNames.includes(c)) || [];
            const unmatchedClasses = teacher.assigned_classes?.filter(c => !classNames.includes(c)) || [];
            
            console.log('  Matched classes:', matchedClasses.length > 0 ? matchedClasses.join(', ') : '(none)');
            console.log('  Unmatched classes:', unmatchedClasses.length > 0 ? unmatchedClasses.join(', ') : '(none)');

            if (unmatchedClasses.length > 0 && matchedClasses.length === 0) {
                console.log('\n⚠️  PROBLEM: No assigned_classes match the database!');
                console.log('   This is why ALL classes are being shown.');
                
                // Suggest fix
                console.log('\n' + '='.repeat(60));
                console.log('SUGGESTED FIX:');
                console.log('='.repeat(60));
                
                // Find classes that match grade 1
                const grade1Classes = classes?.filter(c => 
                    c.name.startsWith('1') || 
                    c.name.includes('KELAS 1') ||
                    c.name.includes('kelas 1')
                ) || [];
                
                if (grade1Classes.length > 0) {
                    console.log('\nGrade 1 classes in database:');
                    for (const cls of grade1Classes) {
                        console.log(`  - "${cls.name}"`);
                    }
                    
                    console.log('\nSQL to fix:');
                    console.log(`
UPDATE profiles 
SET assigned_classes = ARRAY[${grade1Classes.map(c => `'${c.name}'`).join(', ')}],
    updated_at = NOW()
WHERE id = '${teacher.id}';
                    `);
                }
            }
        }
    }
}

main().catch(console.error);

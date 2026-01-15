import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Extract grade number from class name
function extractGrade(className) {
    // Handle TK
    if (className.toUpperCase().includes('TK')) return 'TK';

    // Extract number
    const match = className.match(/\d+/);
    return match ? match[0] : null;
}

// Check if class is bilingual
function isBilingual(className) {
    return className.toUpperCase().includes('BILINGUAL');
}

async function main() {
    console.log('='.repeat(70));
    console.log('TEACHER ASSIGNED_CLASSES AUDIT & FIX');
    console.log('='.repeat(70));

    // Get all teachers
    const { data: teachers, error: teacherError } = await supabase
        .from('profiles')
        .select('id, name, assigned_location_ids, assigned_classes')
        .eq('role', 'TEACHER')
        .eq('status', 'ACTIVE')
        .order('name');

    if (teacherError) {
        console.error('Error:', teacherError);
        return;
    }

    // Get all locations
    const { data: locations } = await supabase
        .from('locations')
        .select('id, name');

    const locationMap = new Map(locations.map(l => [l.id, l]));

    // Get all classes
    const { data: allClasses } = await supabase
        .from('classes')
        .select('id, location_id, name, class_type');

    // Group classes by location
    const classesByLocation = new Map();
    for (const cls of allClasses) {
        if (!classesByLocation.has(cls.location_id)) {
            classesByLocation.set(cls.location_id, []);
        }
        classesByLocation.get(cls.location_id).push(cls);
    }

    const fixes = [];

    for (const teacher of teachers) {
        if (!teacher.assigned_location_ids?.length || !teacher.assigned_classes?.length) {
            continue;
        }

        const currentClasses = teacher.assigned_classes;
        const newClasses = new Set();
        const issues = [];

        // For each assigned class, find matching class in classes table
        for (const assignedClass of currentClasses) {
            const grade = extractGrade(assignedClass);
            const bilingual = isBilingual(assignedClass);

            let found = false;

            // Search in all assigned locations
            for (const locId of teacher.assigned_location_ids) {
                const locationClasses = classesByLocation.get(locId) || [];

                for (const cls of locationClasses) {
                    const clsGrade = extractGrade(cls.name);
                    const clsBilingual = cls.class_type?.toLowerCase() === 'bilingual' ||
                                        isBilingual(cls.name);

                    // Match by grade and type
                    if (clsGrade === grade) {
                        if (bilingual && clsBilingual) {
                            newClasses.add(cls.name);
                            found = true;
                        } else if (!bilingual && !clsBilingual) {
                            newClasses.add(cls.name);
                            found = true;
                        }
                    }
                }
            }

            if (!found) {
                issues.push(`"${assignedClass}" - no match found in classes table`);
            }
        }

        // Check if there are differences
        const sortedCurrent = [...currentClasses].sort();
        const sortedNew = [...newClasses].sort();

        const hasChanges = JSON.stringify(sortedCurrent) !== JSON.stringify(sortedNew);

        if (hasChanges || issues.length > 0) {
            const schoolNames = teacher.assigned_location_ids
                .map(id => locationMap.get(id)?.name)
                .filter(Boolean);

            fixes.push({
                teacher: teacher.name,
                teacherId: teacher.id,
                schools: schoolNames,
                currentClasses: sortedCurrent,
                newClasses: sortedNew,
                issues
            });
        }
    }

    // Output results
    console.log(`\nFound ${fixes.length} teachers with class assignment issues:\n`);

    for (const fix of fixes) {
        console.log('='.repeat(70));
        console.log(`TEACHER: ${fix.teacher}`);
        console.log(`Schools: ${fix.schools.join(', ')}`);
        console.log(`\nCurrent assigned_classes (${fix.currentClasses.length}):`);
        console.log(`  ${fix.currentClasses.join(', ')}`);
        console.log(`\nShould be (${fix.newClasses.length}):`);
        console.log(`  ${fix.newClasses.join(', ')}`);

        if (fix.issues.length > 0) {
            console.log(`\nIssues:`);
            fix.issues.forEach(i => console.log(`  - ${i}`));
        }
        console.log('');
    }

    // Generate SQL
    console.log('\n' + '='.repeat(70));
    console.log('SQL TO FIX (run in Supabase SQL Editor):');
    console.log('='.repeat(70) + '\n');

    console.log('-- BACKUP FIRST!');
    console.log('-- SELECT id, name, assigned_classes FROM profiles WHERE role = \'TEACHER\';\n');

    for (const fix of fixes) {
        if (fix.newClasses.length > 0) {
            const classesJson = JSON.stringify([...fix.newClasses].sort());
            console.log(`-- ${fix.teacher}`);
            console.log(`UPDATE profiles SET assigned_classes = '${classesJson}'::jsonb WHERE id = '${fix.teacherId}';`);
            console.log('');
        }
    }
}

main().catch(console.error);

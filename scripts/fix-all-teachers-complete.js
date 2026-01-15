import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Extract grade from class name
function extractGrade(className) {
    const upper = className.toUpperCase();
    if (upper.includes('TK') || upper.includes('KB')) return 'TK';
    if (upper.includes('X') && !upper.includes('XI')) return '10';
    if (upper.includes('XII')) return '12';
    if (upper.includes('XI')) return '11';
    const match = className.match(/(\d+)/);
    return match ? match[1] : null;
}

async function main() {
    // Get all teachers
    const { data: teachers } = await supabase
        .from('profiles')
        .select('id, name, assigned_location_ids, assigned_classes')
        .eq('role', 'TEACHER')
        .eq('status', 'ACTIVE')
        .order('name');

    // Get all locations
    const { data: locations } = await supabase
        .from('locations')
        .select('id, name');
    const locationMap = new Map(locations.map(l => [l.id, l.name]));

    // Get all classes
    const { data: allClasses } = await supabase
        .from('classes')
        .select('id, location_id, name, class_type');

    // Group classes by location and grade
    const classesByLocationGrade = new Map();
    for (const cls of allClasses) {
        const grade = extractGrade(cls.name);
        const key = `${cls.location_id}|${grade}`;
        if (!classesByLocationGrade.has(key)) {
            classesByLocationGrade.set(key, []);
        }
        classesByLocationGrade.get(key).push(cls);
    }

    console.log('-- =====================================================');
    console.log('-- FIX ALL TEACHERS - Complete Section Assignment');
    console.log('-- =====================================================');
    console.log('');
    console.log('BEGIN;');
    console.log('');

    let fixCount = 0;

    for (const teacher of teachers) {
        if (!teacher.assigned_location_ids?.length || !teacher.assigned_classes?.length) {
            continue;
        }

        // Get grades teacher currently has
        const currentGrades = new Set();
        for (const cls of teacher.assigned_classes) {
            const grade = extractGrade(cls);
            if (grade) currentGrades.add(grade);
        }

        // For each location, get ALL classes for those grades
        const newClasses = new Set();
        for (const locId of teacher.assigned_location_ids) {
            for (const grade of currentGrades) {
                const key = `${locId}|${grade}`;
                const classesForGrade = classesByLocationGrade.get(key) || [];
                for (const cls of classesForGrade) {
                    newClasses.add(cls.name);
                }
            }
        }

        // Check if there's a difference
        const currentSet = new Set(teacher.assigned_classes);
        const hasNewClasses = [...newClasses].some(c => !currentSet.has(c));

        if (hasNewClasses && newClasses.size > currentSet.size) {
            const schoolNames = teacher.assigned_location_ids
                .map(id => locationMap.get(id))
                .filter(Boolean)
                .join(', ');

            console.log(`-- ${teacher.name} (${schoolNames})`);
            console.log(`-- Grades: ${[...currentGrades].sort().join(', ')}`);
            console.log(`-- Current: ${teacher.assigned_classes.length} classes -> New: ${newClasses.size} classes`);

            const sortedClasses = [...newClasses].sort();
            const classesArray = sortedClasses.map(c => `'${c.replace(/'/g, "''")}'`).join(', ');

            console.log(`UPDATE profiles`);
            console.log(`SET assigned_classes = ARRAY[${classesArray}],`);
            console.log(`    updated_at = NOW()`);
            console.log(`WHERE id = '${teacher.id}';`);
            console.log('');
            fixCount++;
        }
    }

    console.log('-- =====================================================');
    console.log(`-- Total: ${fixCount} teachers updated`);
    console.log('-- =====================================================');
    console.log('');
    console.log('COMMIT;');
}

main().catch(console.error);

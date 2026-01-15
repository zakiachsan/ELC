import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Normalize class name for comparison - extract grade + section + type
function parseClassName(name) {
    const normalized = name.toUpperCase().trim();

    // Check if bilingual
    const isBilingual = normalized.includes('BILINGUAL');

    // Handle TK classes
    if (normalized.includes('TK')) {
        // Extract TK section (A, B, etc.)
        const tkMatch = normalized.match(/TK\s*[-]?\s*([AB])/i);
        if (tkMatch) {
            return { grade: 'TK', section: tkMatch[1], isBilingual };
        }
        return { grade: 'TK', section: null, isBilingual };
    }

    // Extract grade number
    const gradeMatch = normalized.match(/(\d+)/);
    if (!gradeMatch) return null;
    const grade = gradeMatch[1];

    // Extract section letter (A, B, C, D, etc.)
    // Look for pattern like "2A", "2 A", "KELAS 2A", etc.
    const sectionMatch = normalized.match(/\d+\s*[-]?\s*([A-Z])(?:\s|$|\)|])/i);
    const section = sectionMatch ? sectionMatch[1] : null;

    return { grade, section, isBilingual };
}

// Check if two class names refer to the same class
function classesMatch(assigned, dbClass) {
    const a = parseClassName(assigned);
    const b = parseClassName(dbClass);

    if (!a || !b) return false;

    // Must match grade
    if (a.grade !== b.grade) return false;

    // If assigned has section, db class must match
    if (a.section && b.section && a.section !== b.section) return false;

    // Bilingual status must match (assigned bilingual should only match db bilingual)
    if (a.isBilingual !== b.isBilingual) return false;

    return true;
}

async function main() {
    console.log('='.repeat(70));
    console.log('TEACHER ASSIGNED_CLASSES FIX v2');
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
    let totalIssues = 0;

    for (const teacher of teachers) {
        if (!teacher.assigned_location_ids?.length || !teacher.assigned_classes?.length) {
            continue;
        }

        const currentClasses = teacher.assigned_classes;
        const newClasses = [];
        const unmatchedClasses = [];

        // For each assigned class, find the EXACT matching class name in the classes table
        for (const assignedClass of currentClasses) {
            let matched = false;

            // Search in teacher's assigned locations
            for (const locId of teacher.assigned_location_ids) {
                const locationClasses = classesByLocation.get(locId) || [];

                // First try exact match
                const exactMatch = locationClasses.find(c => c.name === assignedClass);
                if (exactMatch) {
                    if (!newClasses.includes(exactMatch.name)) {
                        newClasses.push(exactMatch.name);
                    }
                    matched = true;
                    continue;
                }

                // Try fuzzy match
                for (const dbClass of locationClasses) {
                    if (classesMatch(assignedClass, dbClass.name)) {
                        if (!newClasses.includes(dbClass.name)) {
                            newClasses.push(dbClass.name);
                        }
                        matched = true;
                    }
                }
            }

            if (!matched) {
                unmatchedClasses.push(assignedClass);
            }
        }

        // Sort classes
        const sortedNew = [...newClasses].sort();
        const sortedCurrent = [...currentClasses].sort();

        // Check if there are differences
        if (JSON.stringify(sortedCurrent) !== JSON.stringify(sortedNew)) {
            const schoolNames = teacher.assigned_location_ids
                .map(id => locationMap.get(id)?.name)
                .filter(Boolean);

            fixes.push({
                teacher: teacher.name,
                teacherId: teacher.id,
                schools: schoolNames,
                currentClasses: sortedCurrent,
                newClasses: sortedNew,
                unmatchedClasses
            });
            totalIssues++;
        }
    }

    // Output results
    console.log(`\nFound ${totalIssues} teachers needing fixes:\n`);

    for (const fix of fixes) {
        console.log('='.repeat(70));
        console.log(`TEACHER: ${fix.teacher}`);
        console.log(`Schools: ${fix.schools.join(', ')}`);
        console.log(`\nCurrent (${fix.currentClasses.length}): ${fix.currentClasses.join(', ')}`);
        console.log(`Fixed (${fix.newClasses.length}): ${fix.newClasses.join(', ')}`);
        if (fix.unmatchedClasses.length > 0) {
            console.log(`⚠ Unmatched: ${fix.unmatchedClasses.join(', ')}`);
        }
    }

    // Generate SQL
    console.log('\n\n' + '='.repeat(70));
    console.log('SQL TO APPLY (copy to Supabase SQL Editor):');
    console.log('='.repeat(70) + '\n');

    console.log('-- ⚠️ BACKUP FIRST! Run this to backup:');
    console.log('-- SELECT id, name, assigned_classes FROM profiles WHERE role = \'TEACHER\';');
    console.log('');
    console.log('BEGIN;');
    console.log('');

    for (const fix of fixes) {
        if (fix.newClasses.length > 0) {
            const classesJson = JSON.stringify(fix.newClasses);
            console.log(`-- ${fix.teacher} (${fix.schools.join(', ')})`);
            console.log(`UPDATE profiles`);
            console.log(`SET assigned_classes = '${classesJson}'::jsonb,`);
            console.log(`    updated_at = NOW()`);
            console.log(`WHERE id = '${fix.teacherId}';`);
            console.log('');
        }
    }

    console.log('-- Verify changes before committing:');
    console.log('-- SELECT name, assigned_classes FROM profiles WHERE role = \'TEACHER\' ORDER BY name;');
    console.log('');
    console.log('COMMIT;');
    console.log('-- Or ROLLBACK; if something looks wrong');
}

main().catch(console.error);

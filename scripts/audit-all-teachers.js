import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV
function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (const char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        data.push(row);
    }
    return data;
}

// Extract grade number from class name
function extractGrade(className) {
    const upper = className.toUpperCase();
    if (upper.includes('TK') || upper.includes('KB')) return 'TK';
    if (upper.includes('XII')) return '12';
    if (upper.includes('XI')) return '11';
    if (upper.match(/\bX\b/) || upper.includes('X ') || upper.includes('X-')) return '10';
    const match = className.match(/(\d+)/);
    return match ? match[1] : null;
}

// Check if class is bilingual
function isBilingual(classType) {
    return classType?.toLowerCase().includes('bilingual');
}

async function main() {
    // Read CSV
    const csvContent = fs.readFileSync('Daftar Student/ELC TEACHERS - FIX teacher\'s schedule.csv', 'utf-8');
    const csvData = parseCSV(csvContent);

    // Get all teachers from DB
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
    const locationByName = new Map(locations.map(l => [l.name.toUpperCase(), l]));

    // Get all classes with their types
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

    // Group CSV data by teacher name
    const csvByTeacher = new Map();
    for (const row of csvData) {
        const name = row['NAMA GURU']?.trim();
        if (!name) continue;
        if (!csvByTeacher.has(name)) {
            csvByTeacher.set(name, []);
        }
        csvByTeacher.get(name).push(row);
    }

    console.log('-- =====================================================');
    console.log('-- COMPREHENSIVE TEACHER AUDIT & FIX');
    console.log('-- =====================================================');
    console.log('');
    console.log('BEGIN;');
    console.log('');

    let fixCount = 0;

    for (const teacher of teachers) {
        // Find teacher in CSV (fuzzy match)
        let csvRows = null;
        for (const [csvName, rows] of csvByTeacher) {
            if (csvName.toLowerCase().includes(teacher.name.toLowerCase()) ||
                teacher.name.toLowerCase().includes(csvName.toLowerCase())) {
                csvRows = rows;
                break;
            }
        }

        if (!csvRows || csvRows.length === 0) {
            continue; // Teacher not in CSV
        }

        // Build expected classes based on CSV
        const expectedClasses = new Set();
        const teacherSchools = [];

        for (const row of csvRows) {
            const schoolName = row['SEKOLAH']?.trim();
            const classType = row['JENIS KELAS']?.trim(); // 'bilingual' or 'Regular'
            const grades = row['KELAS']?.trim(); // e.g., "1, 2, 3, 4" or "TK"

            if (!schoolName || !grades) continue;

            // Find location in DB
            let location = null;
            for (const [locName, loc] of locationByName) {
                if (locName.includes(schoolName.toUpperCase()) ||
                    schoolName.toUpperCase().includes(locName.split(' ').slice(0, 2).join(' '))) {
                    location = loc;
                    break;
                }
            }

            if (!location) {
                // Try partial match
                const searchTerms = schoolName.toUpperCase().split(' ');
                for (const [locName, loc] of locationByName) {
                    if (searchTerms.every(term => locName.includes(term))) {
                        location = loc;
                        break;
                    }
                }
            }

            if (!location) continue;

            teacherSchools.push(location.name);

            // Get classes for this location
            const locationClasses = classesByLocation.get(location.id) || [];

            // Parse grades from CSV
            const gradeList = grades.split(',').map(g => g.trim());
            const isBilingualType = classType?.toLowerCase().includes('bilingual');

            for (const grade of gradeList) {
                const gradeNum = extractGrade(grade);
                if (!gradeNum) continue;

                // Find matching classes in this location
                for (const cls of locationClasses) {
                    const clsGrade = extractGrade(cls.name);
                    if (clsGrade !== gradeNum) continue;

                    // Check if class type matches
                    const clsIsBilingual = isBilingual(cls.class_type) || cls.name.toLowerCase().includes('bilingual');

                    if (isBilingualType === clsIsBilingual) {
                        expectedClasses.add(cls.name);
                    }
                }
            }
        }

        if (expectedClasses.size === 0) continue;

        // Compare with current
        const currentClasses = new Set(teacher.assigned_classes || []);
        const expectedArray = [...expectedClasses].sort();
        const currentArray = [...currentClasses].sort();

        // Check if different
        const isDifferent = expectedArray.length !== currentArray.length ||
            expectedArray.some((c, i) => c !== currentArray[i]);

        if (isDifferent) {
            console.log(`-- ${teacher.name}`);
            console.log(`-- Schools: ${[...new Set(teacherSchools)].join(', ')}`);
            console.log(`-- Current: ${currentArray.length} classes`);
            console.log(`-- Expected: ${expectedArray.length} classes`);

            const classesArrayStr = expectedArray.map(c => `'${c.replace(/'/g, "''")}'`).join(', ');

            console.log(`UPDATE profiles`);
            console.log(`SET assigned_classes = ARRAY[${classesArrayStr}],`);
            console.log(`    updated_at = NOW()`);
            console.log(`WHERE id = '${teacher.id}';`);
            console.log('');
            fixCount++;
        }
    }

    console.log('-- =====================================================');
    console.log(`-- Total: ${fixCount} teachers need updates`);
    console.log('-- =====================================================');
    console.log('');
    console.log('COMMIT;');
}

main().catch(console.error);

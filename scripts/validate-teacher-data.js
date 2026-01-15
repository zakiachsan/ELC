import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV data
function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle quoted fields with commas
        const values = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
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

        if (values.length >= 5) {
            data.push({
                teacher: values[0].trim(),
                school: values[1].trim(),
                classType: values[2].trim().toLowerCase(),
                classes: values[3].split(',').map(c => c.trim()).filter(c => c),
                subjects: values[4].split(',').map(s => s.trim().toLowerCase()).filter(s => s)
            });
        }
    }

    return data;
}

// Normalize teacher name for comparison
function normalizeTeacherName(name) {
    return name.toLowerCase()
        .replace(/^(mr\.?|ms\.?|mrs\.?)\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Normalize school name for comparison
function normalizeSchoolName(name) {
    return name.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/katolik\s*/i, '')
        .replace(/jakarta\s*/i, '')
        .replace(/batam\s*/i, '')
        .trim();
}

async function main() {
    console.log('='.repeat(60));
    console.log('TEACHER ASSIGNMENT VALIDATION');
    console.log('='.repeat(60));

    // Read CSV
    const csvPath = path.join(__dirname, '..', 'Daftar Student', 'ELC TEACHERS - FIX teacher\'s schedule.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvData = parseCSV(csvContent);

    console.log(`\nLoaded ${csvData.length} rows from CSV`);

    // Get all teachers from database
    const { data: teachers, error: teacherError } = await supabase
        .from('profiles')
        .select('id, name, email, assigned_location_ids, assigned_classes, assigned_subjects')
        .eq('role', 'TEACHER')
        .eq('status', 'ACTIVE');

    if (teacherError) {
        console.error('Error fetching teachers:', teacherError);
        return;
    }

    console.log(`Found ${teachers.length} active teachers in database\n`);

    // Get all locations
    const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id, name, level');

    if (locError) {
        console.error('Error fetching locations:', locError);
        return;
    }

    // Create location lookup
    const locationMap = new Map(locations.map(l => [l.id, l.name]));
    const locationByName = new Map(locations.map(l => [l.name.toLowerCase(), l]));

    // Get all classes
    const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, location_id, name, class_type');

    if (classError) {
        console.error('Error fetching classes:', classError);
        return;
    }

    // Group CSV data by teacher
    const csvByTeacher = new Map();
    for (const row of csvData) {
        const key = normalizeTeacherName(row.teacher);
        if (!csvByTeacher.has(key)) {
            csvByTeacher.set(key, []);
        }
        csvByTeacher.get(key).push(row);
    }

    console.log('DISCREPANCIES FOUND:');
    console.log('-'.repeat(60));

    let discrepancyCount = 0;

    // Check each teacher
    for (const teacher of teachers) {
        const normalizedName = normalizeTeacherName(teacher.name);
        const csvRows = csvByTeacher.get(normalizedName);

        if (!csvRows) {
            console.log(`\n[WARNING] Teacher "${teacher.name}" not found in CSV`);
            discrepancyCount++;
            continue;
        }

        // Get teacher's assigned school names
        const dbSchools = (teacher.assigned_location_ids || [])
            .map(id => locationMap.get(id))
            .filter(Boolean);

        // Get expected schools from CSV
        const csvSchools = [...new Set(csvRows.map(r => r.school))];

        // Get expected classes from CSV (grouped by type)
        const expectedBilingualClasses = new Set();
        const expectedRegularClasses = new Set();

        for (const row of csvRows) {
            const isBilingual = row.classType.includes('bilingual');
            for (const cls of row.classes) {
                if (isBilingual) {
                    expectedBilingualClasses.add(cls);
                } else {
                    expectedRegularClasses.add(cls);
                }
            }
        }

        // Get expected subjects
        const expectedSubjects = new Set();
        for (const row of csvRows) {
            for (const subj of row.subjects) {
                expectedSubjects.add(subj);
            }
        }

        // Compare
        const issues = [];

        // Check schools
        for (const csvSchool of csvSchools) {
            const found = dbSchools.some(dbSchool =>
                normalizeSchoolName(dbSchool).includes(normalizeSchoolName(csvSchool)) ||
                normalizeSchoolName(csvSchool).includes(normalizeSchoolName(dbSchool))
            );
            if (!found) {
                issues.push(`  - Missing school: "${csvSchool}"`);
            }
        }

        // Check class types
        const dbClassTypes = [] || [];
        if (expectedBilingualClasses.size > 0 && !dbClassTypes.some(t => t.toLowerCase().includes('bilingual'))) {
            issues.push(`  - Missing class_type: "Bilingual" (expected for classes: ${[...expectedBilingualClasses].join(', ')})`);
        }
        if (expectedRegularClasses.size > 0 && !dbClassTypes.some(t => t.toLowerCase().includes('regular'))) {
            issues.push(`  - Missing class_type: "Regular" (expected for classes: ${[...expectedRegularClasses].join(', ')})`);
        }

        // Check assigned_classes
        const dbClasses = teacher.assigned_classes || [];
        const allExpectedClasses = [...expectedBilingualClasses, ...expectedRegularClasses];

        // Detailed class check
        for (const expectedClass of allExpectedClasses) {
            const classNum = expectedClass.replace(/[^0-9]/g, '');
            const found = dbClasses.some(dbClass => {
                const dbNum = dbClass.replace(/[^0-9]/g, '');
                return dbNum === classNum || dbClass.toLowerCase().includes(expectedClass.toLowerCase());
            });
            if (!found && classNum) {
                // Check if it's a grade number that should match multiple classes
                const gradeClasses = dbClasses.filter(c => c.startsWith(classNum) || c.includes(classNum));
                if (gradeClasses.length === 0) {
                    issues.push(`  - May be missing class for grade: ${expectedClass}`);
                }
            }
        }

        if (issues.length > 0) {
            discrepancyCount++;
            console.log(`\n[MISMATCH] ${teacher.name}`);
            console.log(`  DB Schools: ${dbSchools.join(', ') || 'None'}`);
            console.log(`  CSV Schools: ${csvSchools.join(', ')}`);
            console.log(`  DB Classes: ${dbClasses.join(', ') || 'None'}`);
            console.log(`  CSV Classes (Bilingual): ${[...expectedBilingualClasses].join(', ') || 'None'}`);
            console.log(`  CSV Classes (Regular): ${[...expectedRegularClasses].join(', ') || 'None'}`);
            console.log(`  DB Class Types: ${dbClassTypes.join(', ') || 'None'}`);
            console.log(`  Issues:`);
            issues.forEach(issue => console.log(issue));
        }
    }

    // Check for teachers in CSV but not in DB
    console.log('\n' + '-'.repeat(60));
    console.log('TEACHERS IN CSV BUT NOT IN DATABASE:');

    for (const [normalizedName, rows] of csvByTeacher.entries()) {
        const found = teachers.some(t => normalizeTeacherName(t.name) === normalizedName);
        if (!found) {
            console.log(`  - ${rows[0].teacher} (teaches at: ${[...new Set(rows.map(r => r.school))].join(', ')})`);
            discrepancyCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`SUMMARY: ${discrepancyCount} potential issues found`);
    console.log('='.repeat(60));

    // Detailed teacher list for reference
    console.log('\n\nDETAILED TEACHER DATA FROM DATABASE:');
    console.log('-'.repeat(60));

    for (const teacher of teachers.sort((a, b) => a.name.localeCompare(b.name))) {
        const schools = (teacher.assigned_location_ids || [])
            .map(id => locationMap.get(id))
            .filter(Boolean);

        console.log(`\n${teacher.name}:`);
        console.log(`  Schools: ${schools.join(', ') || 'None'}`);
        console.log(`  Classes: ${(teacher.assigned_classes || []).join(', ') || 'None'}`);
        console.log(`  Subjects: ${(teacher.assigned_subjects || []).join(', ') || 'None'}`);
        console.log(`  Class Types: ${([] || []).join(', ') || 'None'}`);
    }
}

main().catch(console.error);

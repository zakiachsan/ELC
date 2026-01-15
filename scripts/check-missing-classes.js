import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // Schools that need SMA/SMK classes (10, 11, 12)
    const smaSchools = [
        'SMA ABDI SISWA BINTARO',
        'SMA ABDI SISWA PATRA',
        'SMA BHK',
        'SMK SANTA MARIA'
    ];

    // Schools that need Bilingual classes
    const bilingualSchools = [
        'SD ABDI SISWA BINTARO',
        'TK ABDI SISWA BINTARO'
    ];

    console.log('='.repeat(60));
    console.log('CHECKING MISSING CLASSES');
    console.log('='.repeat(60));

    // Get all locations
    const { data: locations } = await supabase
        .from('locations')
        .select('id, name, level');

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

    console.log('\n--- SMA/SMK SCHOOLS ---\n');

    for (const schoolName of smaSchools) {
        const location = locations.find(l =>
            l.name.toUpperCase().includes(schoolName.toUpperCase().replace('SMA ', '').replace('SMK ', ''))
            && (l.name.toUpperCase().includes('SMA') || l.name.toUpperCase().includes('SMK'))
        );

        if (!location) {
            console.log(`❌ ${schoolName}: Location NOT FOUND in database`);
            continue;
        }

        const classes = classesByLocation.get(location.id) || [];
        console.log(`\n${location.name} (ID: ${location.id}):`);
        console.log(`  Level: ${location.level || 'Not set'}`);
        console.log(`  Classes (${classes.length}):`);

        if (classes.length === 0) {
            console.log('    ⚠️ NO CLASSES DEFINED');
        } else {
            classes.sort((a, b) => a.name.localeCompare(b.name));
            for (const cls of classes) {
                console.log(`    - ${cls.name} (${cls.class_type})`);
            }
        }
    }

    console.log('\n\n--- BILINGUAL SCHOOLS ---\n');

    for (const schoolName of bilingualSchools) {
        const location = locations.find(l =>
            l.name.toUpperCase().includes(schoolName.toUpperCase())
        );

        if (!location) {
            console.log(`❌ ${schoolName}: Location NOT FOUND`);
            continue;
        }

        const classes = classesByLocation.get(location.id) || [];
        const bilingualClasses = classes.filter(c =>
            c.class_type?.toLowerCase().includes('bilingual') ||
            c.name.toLowerCase().includes('bilingual')
        );

        console.log(`\n${location.name} (ID: ${location.id}):`);
        console.log(`  Bilingual classes (${bilingualClasses.length}):`);

        if (bilingualClasses.length === 0) {
            console.log('    ⚠️ NO BILINGUAL CLASSES');
        } else {
            for (const cls of bilingualClasses) {
                console.log(`    - ${cls.name} (${cls.class_type})`);
            }
        }
    }

    // Generate SQL for missing classes
    console.log('\n\n' + '='.repeat(60));
    console.log('SQL TO ADD MISSING CLASSES:');
    console.log('='.repeat(60) + '\n');

    // Find SMA locations that need classes
    for (const schoolName of smaSchools) {
        const location = locations.find(l =>
            l.name.toUpperCase().includes(schoolName.toUpperCase().replace('SMA ', '').replace('SMK ', ''))
            && (l.name.toUpperCase().includes('SMA') || l.name.toUpperCase().includes('SMK'))
        );

        if (!location) continue;

        const classes = classesByLocation.get(location.id) || [];

        // Check if grades 10, 11, 12 exist
        const hasGrade10 = classes.some(c => c.name.includes('10'));
        const hasGrade11 = classes.some(c => c.name.includes('11'));
        const hasGrade12 = classes.some(c => c.name.includes('12'));

        if (!hasGrade10 || !hasGrade11 || !hasGrade12) {
            console.log(`-- ${location.name} (${location.id})`);

            if (!hasGrade10) {
                console.log(`INSERT INTO classes (location_id, name, class_type) VALUES`);
                console.log(`  ('${location.id}', '10A', 'Regular'),`);
                console.log(`  ('${location.id}', '10B', 'Regular');`);
            }
            if (!hasGrade11) {
                console.log(`INSERT INTO classes (location_id, name, class_type) VALUES`);
                console.log(`  ('${location.id}', '11A', 'Regular'),`);
                console.log(`  ('${location.id}', '11B', 'Regular');`);
            }
            if (!hasGrade12) {
                console.log(`INSERT INTO classes (location_id, name, class_type) VALUES`);
                console.log(`  ('${location.id}', '12A', 'Regular'),`);
                console.log(`  ('${location.id}', '12B', 'Regular');`);
            }
            console.log('');
        }
    }
}

main().catch(console.error);

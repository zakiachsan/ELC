import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const schoolsToCheck = [
        'SMP ABDI SISWA BINTARO',
        'SMP SANG TIMUR',
        'SD CHARITAS'
    ];

    const { data: locations } = await supabase
        .from('locations')
        .select('id, name');

    const { data: allClasses } = await supabase
        .from('classes')
        .select('id, location_id, name, class_type');

    for (const searchName of schoolsToCheck) {
        const matchingLocs = locations.filter(l =>
            l.name.toUpperCase().includes(searchName.toUpperCase())
        );

        for (const loc of matchingLocs) {
            const classes = allClasses.filter(c => c.location_id === loc.id);
            console.log(`\n${loc.name} (${loc.id}):`);
            if (classes.length === 0) {
                console.log('  No classes');
            } else {
                classes.sort((a, b) => a.name.localeCompare(b.name));
                for (const c of classes) {
                    console.log(`  - "${c.name}" (${c.class_type})`);
                }
            }
        }
    }
}

main().catch(console.error);

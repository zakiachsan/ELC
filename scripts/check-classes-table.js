import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const schoolNames = [
        'SD BHAKTI',
        'TK ABDI SISWA BINTARO',
        'SD ABDI SISWA BINTARO',
        'SD TARAKANITA'
    ];

    for (const schoolName of schoolNames) {
        console.log('='.repeat(60));
        console.log(`SCHOOL: ${schoolName}`);
        console.log('='.repeat(60));

        // Get location
        const { data: location } = await supabase
            .from('locations')
            .select('id, name')
            .ilike('name', `%${schoolName}%`)
            .single();

        if (!location) {
            console.log('  Location not found');
            continue;
        }

        // Get classes for this location
        const { data: classes } = await supabase
            .from('classes')
            .select('name, class_type')
            .eq('location_id', location.id)
            .order('class_type')
            .order('name');

        console.log(`  Location ID: ${location.id}`);
        console.log(`  Classes in DB:\n`);

        if (classes?.length > 0) {
            for (const cls of classes) {
                console.log(`    "${cls.name}" (${cls.class_type})`);
            }
        } else {
            console.log('    (no classes defined)');
        }
        console.log('');
    }
}

main().catch(console.error);

/**
 * Import/Fix SMP TARAKANITA Students
 *
 * This script:
 * 1. Creates SMP TARAKANITA classes (KELAS 7A - 9D)
 * 2. Imports SMP students from CSV (creates auth users + profiles)
 * 3. Updates teacher data if needed
 *
 * Run with: npx tsx scripts/fix-smp-tarakanita.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DRY_RUN = process.argv.includes('--dry-run');

// All SMP classes
const SMP_CLASSES = [
  'KELAS 7A', 'KELAS 7B', 'KELAS 7C', 'KELAS 7D', 'KELAS 7E',
  'KELAS 8A', 'KELAS 8B', 'KELAS 8C', 'KELAS 8D',
  'KELAS 9A', 'KELAS 9B', 'KELAS 9C', 'KELAS 9D'
];

const TEACHER_EMAIL = 'mr.teacher@enormous1.com';

interface CSVRow {
  Jenjang: string;
  Kelas: string;
  'Tipe Kelas': string;
  'Nama Siswa': string;
  Email: string;
  Password: string;
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else current += char;
    }
    values.push(current.trim());

    const obj: Record<string, string> = {};
    headers.forEach((h, i) => obj[h] = values[i]?.trim() || '');
    return obj as unknown as CSVRow;
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('IMPORT SMP TARAKANITA STUDENTS');
  console.log(DRY_RUN ? '>>> DRY RUN MODE - No changes will be made <<<' : '>>> LIVE MODE - Changes will be applied <<<');
  console.log('='.repeat(60) + '\n');

  // Step 1: Get location IDs
  console.log('Step 1: Getting location IDs...');
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name')
    .in('name', ['SD TARAKANITA', 'SMP TARAKANITA']);

  if (locError || !locations) {
    console.error('Error fetching locations:', locError);
    return;
  }

  const sdLocation = locations.find(l => l.name === 'SD TARAKANITA');
  const smpLocation = locations.find(l => l.name === 'SMP TARAKANITA');

  if (!smpLocation) {
    console.error('Could not find SMP TARAKANITA location');
    return;
  }

  console.log(`  SMP TARAKANITA ID: ${smpLocation.id}\n`);

  // Step 2: Create/ensure classes exist for SMP TARAKANITA
  console.log('Step 2: Creating classes for SMP TARAKANITA...');
  let classesCreated = 0;

  for (const className of SMP_CLASSES) {
    if (!DRY_RUN) {
      const { error } = await supabase.from('classes').upsert({
        location_id: smpLocation.id,
        name: className,
        class_type: 'Regular'
      }, { onConflict: 'location_id,name' });

      if (!error) classesCreated++;
    } else {
      console.log(`  [DRY-RUN] Would create/verify class: ${className}`);
      classesCreated++;
    }
  }
  console.log(`  ${DRY_RUN ? 'Would create' : 'Created'}/verified ${classesCreated} classes\n`);

  // Step 3: Update teacher if needed
  console.log('Step 3: Checking teacher...');
  const { data: teacher } = await supabase
    .from('profiles')
    .select('id, name, email, assigned_classes, assigned_location_ids')
    .eq('email', TEACHER_EMAIL)
    .eq('role', 'TEACHER')
    .single();

  if (teacher) {
    const existingLocationIds = teacher.assigned_location_ids || [];
    const hasSmpLocation = existingLocationIds.includes(smpLocation.id);

    if (!hasSmpLocation) {
      console.log(`  Adding SMP TARAKANITA location to teacher ${teacher.name}`);
      if (!DRY_RUN) {
        await supabase
          .from('profiles')
          .update({
            assigned_location_ids: [...existingLocationIds, smpLocation.id],
            updated_at: new Date().toISOString()
          })
          .eq('id', teacher.id);
      }
    } else {
      console.log(`  Teacher ${teacher.name} already has SMP TARAKANITA location`);
    }
  } else {
    console.log(`  Teacher ${TEACHER_EMAIL} not found`);
  }

  // Step 4: Load CSV and import students
  console.log('\nStep 4: Loading CSV and importing students...');

  const csvPath = path.join(__dirname, '..', 'Daftar Student-Siswa-Sekolah', 'SD_SMP_TARAKANITA_List_With_Credentials.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`  CSV file not found: ${csvPath}`);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const allRows = parseCSV(csvContent);

  // Filter SMP students only
  const smpStudents = allRows.filter(row => row.Jenjang === 'SMP');
  console.log(`  Found ${smpStudents.length} SMP students in CSV\n`);

  let studentsCreated = 0;
  let studentsUpdated = 0;
  let studentsSkipped = 0;
  const errors: string[] = [];

  for (const student of smpStudents) {
    const email = student.Email;
    const password = student.Password;
    const name = student['Nama Siswa'];
    const className = student.Kelas; // e.g., "KELAS 7A"
    const classType = student['Tipe Kelas']; // "Regular"
    const schoolOrigin = `SMP TARAKANITA - ${className} (${classType})`;

    // Check if student already exists
    const { data: existingStudent } = await supabase
      .from('profiles')
      .select('id, name, school_origin, assigned_location_id')
      .eq('email', email)
      .eq('role', 'STUDENT')
      .single();

    if (existingStudent) {
      // Student exists - update if needed
      if (existingStudent.assigned_location_id !== smpLocation.id ||
          existingStudent.school_origin !== schoolOrigin) {
        if (!DRY_RUN) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              assigned_location_id: smpLocation.id,
              school_origin: schoolOrigin,
              assigned_classes: [className],
              updated_at: new Date().toISOString()
            })
            .eq('id', existingStudent.id);

          if (updateError) {
            errors.push(`Update ${name}: ${updateError.message}`);
          } else {
            studentsUpdated++;
            if (studentsUpdated <= 5) {
              console.log(`  [UPDATED] ${name}: ${existingStudent.school_origin} -> ${schoolOrigin}`);
            }
          }
        } else {
          studentsUpdated++;
          if (studentsUpdated <= 5) {
            console.log(`  [DRY-RUN UPDATE] ${name}: ${existingStudent.school_origin} -> ${schoolOrigin}`);
          }
        }
      } else {
        studentsSkipped++;
      }
    } else {
      // Student doesn't exist - create new
      if (!DRY_RUN) {
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

        if (authError) {
          errors.push(`Auth ${name}: ${authError.message}`);
          continue;
        }

        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authUser.user.id,
          name,
          email,
          role: 'STUDENT',
          status: 'ACTIVE',
          school_origin: schoolOrigin,
          assigned_location_id: smpLocation.id,
          assigned_classes: [className],
          class_type: classType.toUpperCase()
        });

        if (profileError) {
          errors.push(`Profile ${name}: ${profileError.message}`);
        } else {
          studentsCreated++;
          if (studentsCreated <= 10) {
            console.log(`  [CREATED] ${name} | ${email} | ${schoolOrigin}`);
          }
        }
      } else {
        studentsCreated++;
        if (studentsCreated <= 10) {
          console.log(`  [DRY-RUN CREATE] ${name} | ${email} | ${schoolOrigin}`);
        }
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Classes created/verified: ${classesCreated}`);
  console.log(`Students ${DRY_RUN ? 'would be ' : ''}created: ${studentsCreated}`);
  console.log(`Students ${DRY_RUN ? 'would be ' : ''}updated: ${studentsUpdated}`);
  console.log(`Students skipped (already correct): ${studentsSkipped}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    errors.slice(0, 20).forEach(e => console.log(`  - ${e}`));
    if (errors.length > 20) console.log(`  ... and ${errors.length - 20} more`);
  }

  if (DRY_RUN) {
    console.log('\n>>> This was a DRY RUN. Run without --dry-run to apply changes <<<');
  }
}

main().catch(console.error);

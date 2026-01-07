/**
 * Populate classes table from CSV files for:
 * - SMK SANTA MARIA (from TK_SD_SMP_SMK_SANTA_MARIA_List_Full.csv)
 * - SMA ABDI SISWA BINTARO (from SMP_SMA_ABDI_SISWA_BINTARO_List_Full.csv)
 *
 * Usage: node scripts/populate-classes-from-csv.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Mapping from CSV Jenjang to database location names
const JENJANG_TO_LOCATION = {
  // Santa Maria CSV
  'TK': 'TK SANTA MARIA',
  'SD': 'SD SANTA MARIA',
  'SMP': 'SMP SANTA MARIA',
  'SMK': 'SMK SANTA MARIA',
  // Abdi Siswa Bintaro CSV
  'SMA': 'SMA ABDI SISWA BINTARO',
};

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).filter(line => line.trim()).map(line => {
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

    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row;
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('POPULATE CLASSES FROM CSV FILES');
  console.log('='.repeat(60) + '\n');

  // Step 1: Get all locations
  console.log('[STEP 1] Fetching locations from database...');
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name');

  if (locError) {
    console.error('Failed to get locations:', locError.message);
    return;
  }

  const locationMap = {};
  locations.forEach(loc => {
    locationMap[loc.name.toUpperCase()] = loc.id;
  });
  console.log(`  Found ${locations.length} locations\n`);

  // Step 2: Parse CSV files and extract unique classes
  console.log('[STEP 2] Parsing CSV files...\n');

  const classesToInsert = [];

  // Process Santa Maria CSV
  const santaMariaPath = path.join(__dirname, '..', 'Daftar Student', 'TK_SD_SMP_SMK_SANTA_MARIA_List_Full.csv');
  if (fs.existsSync(santaMariaPath)) {
    console.log('  Processing: TK_SD_SMP_SMK_SANTA_MARIA_List_Full.csv');
    const content = fs.readFileSync(santaMariaPath, 'utf-8');
    const rows = parseCSV(content);

    // Extract unique classes by jenjang
    const classesMap = new Map();
    for (const row of rows) {
      const jenjang = row['Jenjang']?.trim();
      const kelas = row['Kelas']?.trim();
      const tipeKelas = row['Tipe Kelas']?.trim() || 'Regular';

      if (!jenjang || !kelas) continue;

      let locationName;
      if (jenjang === 'SMK') {
        locationName = 'SMK SANTA MARIA';
      } else if (jenjang === 'SMP') {
        locationName = 'SMP SANTA MARIA';
      } else if (jenjang === 'SD') {
        locationName = 'SD SANTA MARIA';
      } else if (jenjang === 'TK') {
        locationName = 'TK SANTA MARIA';
      }

      if (!locationName) continue;

      const locationId = locationMap[locationName.toUpperCase()];
      if (!locationId) {
        console.log(`    ⚠ Location not found: ${locationName}`);
        continue;
      }

      const key = `${locationId}|${kelas}`;
      if (!classesMap.has(key)) {
        classesMap.set(key, {
          location_id: locationId,
          name: kelas,
          class_type: tipeKelas.substring(0, 20),
          location_name: locationName
        });
      }
    }

    for (const cls of classesMap.values()) {
      classesToInsert.push(cls);
    }

    // Group by location for display
    const byLocation = {};
    for (const cls of classesMap.values()) {
      if (!byLocation[cls.location_name]) byLocation[cls.location_name] = [];
      byLocation[cls.location_name].push(cls.name);
    }

    for (const [locName, classes] of Object.entries(byLocation)) {
      console.log(`    ${locName}: ${classes.length} classes`);
      console.log(`      Classes: ${classes.sort().join(', ')}`);
    }
    console.log();
  } else {
    console.log('  ⚠ Santa Maria CSV not found\n');
  }

  // Process Abdi Siswa Bintaro CSV
  const bintaroPath = path.join(__dirname, '..', 'Daftar Student', 'SMP_SMA_ABDI_SISWA_BINTARO_List_Full.csv');
  if (fs.existsSync(bintaroPath)) {
    console.log('  Processing: SMP_SMA_ABDI_SISWA_BINTARO_List_Full.csv');
    const content = fs.readFileSync(bintaroPath, 'utf-8');
    const rows = parseCSV(content);

    // Extract unique classes by jenjang
    const classesMap = new Map();
    for (const row of rows) {
      const jenjang = row['Jenjang']?.trim();
      const kelas = row['Kelas']?.trim();
      const tipeKelas = row['Tipe Kelas']?.trim() || 'Regular';

      if (!jenjang || !kelas) continue;

      let locationName;
      if (jenjang === 'SMA') {
        locationName = 'SMA ABDI SISWA BINTARO';
      } else if (jenjang === 'SMP') {
        locationName = 'SMP ABDI SISWA BINTARO';
      }

      if (!locationName) continue;

      const locationId = locationMap[locationName.toUpperCase()];
      if (!locationId) {
        console.log(`    ⚠ Location not found: ${locationName}`);
        continue;
      }

      const key = `${locationId}|${kelas}`;
      if (!classesMap.has(key)) {
        classesMap.set(key, {
          location_id: locationId,
          name: kelas,
          class_type: tipeKelas.substring(0, 20),
          location_name: locationName
        });
      }
    }

    for (const cls of classesMap.values()) {
      classesToInsert.push(cls);
    }

    // Group by location for display
    const byLocation = {};
    for (const cls of classesMap.values()) {
      if (!byLocation[cls.location_name]) byLocation[cls.location_name] = [];
      byLocation[cls.location_name].push(cls.name);
    }

    for (const [locName, classes] of Object.entries(byLocation)) {
      console.log(`    ${locName}: ${classes.length} classes`);
      console.log(`      Classes: ${classes.sort().join(', ')}`);
    }
    console.log();
  } else {
    console.log('  ⚠ Abdi Siswa Bintaro CSV not found\n');
  }

  // Step 3: Insert classes into database
  console.log('[STEP 3] Inserting classes into database...');
  console.log(`  Total classes to insert: ${classesToInsert.length}\n`);

  // Remove location_name before insert
  const insertData = classesToInsert.map(({ location_name, ...rest }) => rest);

  // Insert in batches
  const batchSize = 50;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < insertData.length; i += batchSize) {
    const batch = insertData.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('classes')
      .upsert(batch, {
        onConflict: 'location_id,name',
        ignoreDuplicates: true
      })
      .select();

    if (error) {
      console.error(`  Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      skipped += batch.length;
    } else {
      inserted += data?.length || 0;
      console.log(`  Batch ${Math.floor(i / batchSize) + 1}: Inserted ${data?.length || 0} classes`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('COMPLETED');
  console.log('='.repeat(60));
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped/Duplicates: ${classesToInsert.length - inserted}`);

  // Verify by showing classes count per location
  console.log('\n[VERIFICATION] Classes count by location:');
  const targetLocations = ['SMK SANTA MARIA', 'SMA ABDI SISWA BINTARO', 'SMP ABDI SISWA BINTARO'];
  for (const locName of targetLocations) {
    const locId = locationMap[locName.toUpperCase()];
    if (locId) {
      const { count } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locId);
      console.log(`  ${locName}: ${count} classes`);
    }
  }
}

main().catch(console.error);

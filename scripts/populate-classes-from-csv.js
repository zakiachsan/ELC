/**
 * Populate classes table from ALL CSV files
 *
 * This script processes all student CSV files and extracts unique classes
 * for each school, then inserts them into the classes table.
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

// CSV files configuration with their school mappings
const CSV_CONFIG = [
  {
    file: 'TK_SD_ABDI_SISWA_BINTARO_List_Full.csv',
    mapping: {
      'TK': 'TK ABDI SISWA BINTARO',
      'SD': 'SD ABDI SISWA BINTARO'
    }
  },
  {
    file: 'TK_SD_KRISTOFORUS_1_List_Full.csv',
    mapping: {
      'TK': 'TK KRISTOFORUS 1',
      'SD': 'SD KRISTOFORUS 1'
    }
  },
  {
    file: 'TK_SD_KRISTOFORUS_2_List_Full.csv',
    mapping: {
      'TK': 'TK KRISTOFORUS 2',
      'SD': 'SD KRISTOFORUS 2'
    }
  },
  {
    file: 'TK_SD_SMP_CHARITAS_BATAM_List_Full.csv',
    mapping: {
      'TK': 'TK CHARITAS BATAM',
      'SD': 'SD CHARITAS BATAM',
      'SMP': 'SMP CHARITAS BATAM'
    }
  },
  {
    file: 'TK_SD_SMP_SMK_SANTA_MARIA_List_Full.csv',
    mapping: {
      'TK': 'TK SANTA MARIA',
      'SD': 'SD SANTA MARIA',
      'SMP': 'SMP SANTA MARIA',
      'SMK': 'SMK SANTA MARIA'
    }
  },
  {
    file: 'TK_SD_SMP_ST_VINCENTIUS_List_Full.csv',
    mapping: {
      'TK': 'TK ST VINCENTIUS',
      'SD': 'SD ST VINCENTIUS',
      'SMP': 'SMP ST VINCENTIUS'
    }
  },
  {
    file: 'SD_BHAKTI_List_Full.csv',
    mapping: {
      'SD': 'SD BHAKTI'
    }
  },
  {
    file: 'SD_SANG_TIMUR_CAKUNG_List_Full.csv',
    mapping: {
      'SD': 'SD SANG TIMUR CAKUNG'
    }
  },
  {
    file: 'SD_SMP_ABDI_SISWA_ARIES_List.csv',
    mapping: {
      'SD': 'SD ABDI SISWA ARIES',
      'SMP': 'SMP ABDI SISWA ARIES'
    }
  },
  {
    file: 'SD_SMP_CHARITAS_JKT_List_Full.csv',
    mapping: {
      'SD': 'SD CHARITAS JKT',
      'SMP': 'SMP CHARITAS JKT'
    }
  },
  {
    file: 'SD_SMP_SANG_TIMUR_KARANG_TENGAH_List_Full.csv',
    mapping: {
      'SD': 'SDK SANG TIMUR KARANG TENGAH',
      'SMP': 'SMP SANG TIMUR KARANG TENGAH'
    }
  },
  {
    file: 'SD_SMP_TARAKANITA_List_Full.csv',
    mapping: {
      'SD': 'SD TARAKANITA',
      'SMP': 'SMP TARAKANITA'
    }
  },
  {
    file: 'SMP_MARSUDIRINI_List_Full.csv',
    mapping: {
      'SMP': 'SMP MARSUDIRINI'
    }
  },
  {
    file: 'SMP_SMA_ABDI_SISWA_BINTARO_List_Full.csv',
    mapping: {
      'SMP': 'SMP ABDI SISWA BINTARO',
      'SMA': 'SMA ABDI SISWA BINTARO'
    }
  },
  {
    file: 'SMP_SMA_ABDI_SISWA_PATRA_List_Full.csv',
    mapping: {
      'SMP': 'SMP ABDI SISWA PATRA',
      'SMA': 'SMA ABDI SISWA PATRA'
    }
  },
  {
    file: 'SMP_SMA_BHK_List_Full.csv',
    mapping: {
      'SMP': 'SMP BHK',
      'SMA': 'SMA BHK'
    }
  }
];

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
  console.log('POPULATE CLASSES FROM ALL CSV FILES');
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

  // Step 2: Process all CSV files
  console.log('[STEP 2] Processing CSV files...\n');

  const allClasses = new Map(); // Global map to track all unique classes
  const csvDir = path.join(__dirname, '..', 'Daftar Student-Siswa-Sekolah');

  let processedFiles = 0;
  let skippedFiles = 0;

  for (const config of CSV_CONFIG) {
    const csvPath = path.join(csvDir, config.file);

    if (!fs.existsSync(csvPath)) {
      console.log(`  ⚠ File not found: ${config.file}`);
      skippedFiles++;
      continue;
    }

    console.log(`  Processing: ${config.file}`);
    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content);

    // Extract unique classes by jenjang
    const fileClasses = new Map();
    for (const row of rows) {
      const jenjang = row['Jenjang']?.trim().toUpperCase();
      const kelas = row['Kelas']?.trim();
      const tipeKelas = row['Tipe Kelas']?.trim() || 'Regular';

      if (!jenjang || !kelas) continue;

      const locationName = config.mapping[jenjang];
      if (!locationName) {
        continue;
      }

      const locationId = locationMap[locationName.toUpperCase()];
      if (!locationId) {
        console.log(`    ⚠ Location not found: ${locationName}`);
        continue;
      }

      const key = `${locationId}|${kelas}`;
      if (!allClasses.has(key)) {
        allClasses.set(key, {
          location_id: locationId,
          name: kelas,
          class_type: tipeKelas.substring(0, 20),
          location_name: locationName
        });
        fileClasses.set(key, true);
      }
    }

    // Show summary for this file
    const byLocation = {};
    for (const [key] of fileClasses) {
      const cls = allClasses.get(key);
      if (!byLocation[cls.location_name]) byLocation[cls.location_name] = [];
      byLocation[cls.location_name].push(cls.name);
    }

    for (const [locName, classes] of Object.entries(byLocation)) {
      console.log(`    → ${locName}: ${classes.length} classes`);
    }

    processedFiles++;
    console.log();
  }

  console.log(`  Processed: ${processedFiles} files`);
  console.log(`  Skipped: ${skippedFiles} files\n`);

  // Step 3: Insert classes into database
  console.log('[STEP 3] Inserting classes into database...');
  console.log(`  Total unique classes to insert: ${allClasses.size}\n`);

  // Prepare insert data (remove location_name)
  const insertData = Array.from(allClasses.values()).map(({ location_name, ...rest }) => rest);

  // Insert in batches
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;

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
      errors += batch.length;
    } else {
      inserted += data?.length || 0;
      console.log(`  Batch ${Math.floor(i / batchSize) + 1}: Inserted/Updated ${data?.length || 0} classes`);
    }
  }

  // Step 4: Summary
  console.log('\n' + '='.repeat(60));
  console.log('COMPLETED');
  console.log('='.repeat(60));
  console.log(`Total processed: ${insertData.length}`);
  console.log(`Inserted/Updated: ${inserted}`);
  console.log(`Errors: ${errors}`);

  // Step 5: Verification - show classes count per location
  console.log('\n[VERIFICATION] Classes count by location:');

  const { data: classCounts } = await supabase
    .from('classes')
    .select('location_id');

  // Group by location
  const countByLocation = {};
  for (const cls of classCounts || []) {
    countByLocation[cls.location_id] = (countByLocation[cls.location_id] || 0) + 1;
  }

  // Show with location names
  const sortedLocations = locations.sort((a, b) => a.name.localeCompare(b.name));
  for (const loc of sortedLocations) {
    const count = countByLocation[loc.id] || 0;
    const status = count > 0 ? '✅' : '❌';
    console.log(`  ${status} ${loc.name}: ${count} classes`);
  }
}

main().catch(console.error);

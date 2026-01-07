/**
 * Direct Import Script for TK & SD ABDI SISWA BINTARO
 * Usage: node scripts/import-students-bintaro.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';
const CSV_FILE = path.join(__dirname, '..', 'Daftar Student', 'TK_SD_ABDI_SISWA_BINTARO_List_With_Credentials.csv');

// Create Supabase Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Parse CSV file
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || '';
    });
    return obj;
  });
}

// Create locations if not exist
async function ensureLocationsExist() {
  const locationNames = ['SD ABDI SISWA BINTARO', 'TK ABDI SISWA BINTARO'];

  for (const name of locationNames) {
    // Check if exists
    const { data: existing } = await supabase
      .from('locations')
      .select('id')
      .eq('name', name)
      .single();

    if (!existing) {
      console.log(`Creating location: ${name}`);
      const level = name.startsWith('TK') ? 'KINDERGARTEN' : 'PRIMARY';
      const { error } = await supabase
        .from('locations')
        .insert({
          name,
          address: 'Bintaro, Jakarta Selatan',
          capacity: 500,
          level,
        });

      if (error) {
        console.error(`Failed to create ${name}:`, error.message);
      }
    }
  }
}

// Main import function
async function importStudents() {
  console.log('===========================================');
  console.log('IMPORT TK & SD ABDI SISWA BINTARO');
  console.log('===========================================\n');

  // Ensure locations exist
  console.log('Ensuring locations exist...');
  await ensureLocationsExist();

  // Read CSV
  console.log('\nReading CSV file...');
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const students = parseCSV(csvContent);
  console.log(`Found ${students.length} students in CSV\n`);

  // Get location IDs
  console.log('Fetching location IDs...');
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name')
    .in('name', ['SD ABDI SISWA BINTARO', 'TK ABDI SISWA BINTARO']);

  if (locError) {
    console.error('Error fetching locations:', locError.message);
    process.exit(1);
  }

  const locationMap = {};
  locations?.forEach((loc) => {
    if (loc.name === 'SD ABDI SISWA BINTARO') locationMap['SD'] = loc.id;
    if (loc.name === 'TK ABDI SISWA BINTARO') locationMap['TK'] = loc.id;
  });

  console.log('Location IDs:', locationMap);

  if (!locationMap['SD'] || !locationMap['TK']) {
    console.error('\nError: SD or TK ABDI SISWA BINTARO not found in locations table!');
    process.exit(1);
  }

  // Count by jenjang
  const byJenjang = { SD: 0, TK: 0 };
  students.forEach(s => {
    byJenjang[s['Jenjang']] = (byJenjang[s['Jenjang']] || 0) + 1;
  });
  console.log('\nStudents by Jenjang:');
  console.log(`  - SD: ${byJenjang.SD}`);
  console.log(`  - TK: ${byJenjang.TK}`);

  // Results tracking
  const results = { success: 0, failed: 0, errors: [] };

  // Process students one by one
  console.log('\nStarting import...\n');

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const studentNum = i + 1;

    process.stdout.write(`[${studentNum}/${students.length}] ${s['Nama Siswa']}... `);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: s['Email'],
        password: s['Password'],
        email_confirm: true,
      });

      if (authError) {
        console.log(`FAILED (auth: ${authError.message})`);
        results.failed++;
        results.errors.push(`${s['Email']}: ${authError.message}`);
        continue;
      }

      const userId = authData.user.id;
      const jenjang = s['Jenjang'];
      const locationId = locationMap[jenjang] || null;
      const schoolInfo = `${jenjang} ABDI SISWA BINTARO - ${s['Kelas']} (${s['Tipe Kelas']})`;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: s['Email'],
          name: s['Nama Siswa'],
          role: 'STUDENT',
          status: 'ACTIVE',
          assigned_location_id: locationId,
          school_origin: schoolInfo,
        });

      if (profileError) {
        // Rollback auth user
        await supabase.auth.admin.deleteUser(userId);
        console.log(`FAILED (profile: ${profileError.message})`);
        results.failed++;
        results.errors.push(`${s['Email']}: ${profileError.message}`);
        continue;
      }

      console.log('OK');
      results.success++;

    } catch (err) {
      console.log(`FAILED (${err.message})`);
      results.failed++;
      results.errors.push(`${s['Email']}: ${err.message}`);
    }

    // Delay to avoid rate limits (300ms per student)
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Print results
  console.log('\n===========================================');
  console.log('IMPORT COMPLETED');
  console.log('===========================================');
  console.log(`Total Success: ${results.success}`);
  console.log(`Total Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.slice(0, 20).forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    if (results.errors.length > 20) {
      console.log(`  ... and ${results.errors.length - 20} more errors`);
    }
  }
}

importStudents().catch(console.error);

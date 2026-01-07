/**
 * Direct Import Script - Uses Supabase Admin API directly
 * No edge function needed!
 *
 * Usage: node scripts/import-students-direct.js
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
const CSV_FILE = path.join(__dirname, '..', 'Daftar Student', 'SD_SMP_ABDI_SISWA_ARIES_List.csv');

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

// Main import function
async function importStudents() {
  console.log('===========================================');
  console.log('DIRECT STUDENT IMPORT (No Edge Function)');
  console.log('===========================================\n');

  // Read CSV
  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const students = parseCSV(csvContent);
  console.log(`Found ${students.length} students in CSV\n`);

  // Get location IDs
  console.log('Fetching location IDs...');
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name')
    .in('name', ['SD ABDI SISWA ARIES', 'SMP ABDI SISWA ARIES']);

  if (locError) {
    console.error('Error fetching locations:', locError.message);
    console.log('\nMake sure you have run the schools migration first!');
    process.exit(1);
  }

  const locationMap = {};
  locations?.forEach((loc) => {
    if (loc.name === 'SD ABDI SISWA ARIES') locationMap['SD'] = loc.id;
    if (loc.name === 'SMP ABDI SISWA ARIES') locationMap['SMP'] = loc.id;
  });

  console.log('Location IDs:', locationMap);

  if (!locationMap['SD'] || !locationMap['SMP']) {
    console.error('\nError: SD or SMP ABDI SISWA ARIES not found in locations table!');
    console.log('Please run the schools migration first.');
    process.exit(1);
  }

  // Results tracking
  const results = { success: 0, failed: 0, errors: [] };

  // Process students one by one (to avoid rate limits)
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
      const schoolInfo = `${jenjang} ABDI SISWA ARIES - ${s['Kelas']} (${s['Tipe Kelas']})`;

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

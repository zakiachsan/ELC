/**
 * Fix Missing Profiles Script
 * Creates profiles for users who exist in auth.users but don't have profiles
 *
 * Usage: node scripts/fix-missing-profiles.js
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

async function fixMissingProfiles() {
  console.log('===========================================');
  console.log('FIX MISSING PROFILES');
  console.log('===========================================\n');

  // Read CSV to get student data
  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const students = parseCSV(csvContent);
  console.log(`Found ${students.length} students in CSV\n`);

  // Create email -> student data map
  const studentMap = {};
  students.forEach(s => {
    studentMap[s['Email'].toLowerCase()] = s;
  });

  // Get location IDs
  console.log('Fetching location IDs...');
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .in('name', ['SD ABDI SISWA ARIES', 'SMP ABDI SISWA ARIES']);

  const locationMap = {};
  locations?.forEach((loc) => {
    if (loc.name === 'SD ABDI SISWA ARIES') locationMap['SD'] = loc.id;
    if (loc.name === 'SMP ABDI SISWA ARIES') locationMap['SMP'] = loc.id;
  });
  console.log('Location IDs:', locationMap, '\n');

  // Get all auth users with @enormous1.com email
  console.log('Fetching auth users...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (authError) {
    console.error('Error fetching auth users:', authError.message);
    process.exit(1);
  }

  const studentUsers = authUsers.users.filter(u =>
    u.email?.endsWith('@enormous1.com')
  );
  console.log(`Found ${studentUsers.length} student auth accounts\n`);

  // Get existing profiles
  console.log('Fetching existing profiles...');
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('id, email');

  const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);
  console.log(`Found ${existingProfileIds.size} existing profiles\n`);

  // Find users without profiles
  const usersWithoutProfiles = studentUsers.filter(u => !existingProfileIds.has(u.id));
  console.log(`Found ${usersWithoutProfiles.length} users WITHOUT profiles\n`);

  if (usersWithoutProfiles.length === 0) {
    console.log('All users have profiles! Nothing to fix.');
    return;
  }

  // Create missing profiles
  console.log('Creating missing profiles...\n');
  let success = 0;
  let failed = 0;

  for (const user of usersWithoutProfiles) {
    const email = user.email?.toLowerCase();
    const studentData = studentMap[email];

    process.stdout.write(`${email}... `);

    if (!studentData) {
      console.log('SKIPPED (not in CSV)');
      continue;
    }

    const jenjang = studentData['Jenjang'];
    const locationId = locationMap[jenjang] || null;
    const schoolInfo = `${jenjang} ABDI SISWA ARIES - ${studentData['Kelas']} (${studentData['Tipe Kelas']})`;

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name: studentData['Nama Siswa'],
          role: 'STUDENT',
          status: 'ACTIVE',
          assigned_location_id: locationId,
          school_origin: schoolInfo,
        });

      if (profileError) {
        console.log(`FAILED (${profileError.message})`);
        failed++;
      } else {
        console.log('OK');
        success++;
      }
    } catch (err) {
      console.log(`FAILED (${err.message})`);
      failed++;
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n===========================================');
  console.log('COMPLETED');
  console.log('===========================================');
  console.log(`Profiles Created: ${success}`);
  console.log(`Failed: ${failed}`);
}

fixMissingProfiles().catch(console.error);

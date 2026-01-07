/**
 * Batch Import Script for Multiple Schools
 * Usage: node scripts/batch-import-schools.js
 *
 * This script processes all CSV files, generates credentials, and imports students.
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
const STUDENT_FOLDER = path.join(__dirname, '..', 'Daftar Student');

// Schools configuration
const SCHOOLS = [
  {
    file: 'TK_SD_KRISTOFORUS_1_List_Full.csv',
    name: 'KRISTOFORUS 1',
    locations: ['TK KRISTOFORUS 1', 'SD KRISTOFORUS 1'],
    levels: { TK: 'KINDERGARTEN', SD: 'ELEMENTARY' }
  },
  {
    file: 'TK_SD_SMP_CHARITAS_BATAM_List_Full.csv',
    name: 'CHARITAS BATAM',
    locations: ['TK CHARITAS BATAM', 'SD CHARITAS BATAM', 'SMP CHARITAS BATAM'],
    levels: { TK: 'KINDERGARTEN', SD: 'ELEMENTARY', SMP: 'JUNIOR' }
  },
  {
    file: 'SMP_MARSUDIRINI_List_Full.csv',
    name: 'MARSUDIRINI',
    locations: ['SMP MARSUDIRINI'],
    levels: { SMP: 'JUNIOR' }
  },
  {
    file: 'SD_SMP_SANG_TIMUR_KARANG_TENGAH_List_Full.csv',
    name: 'SANG TIMUR KARANG TENGAH',
    locations: ['SD SANG TIMUR KARANG TENGAH', 'SMP SANG TIMUR KARANG TENGAH'],
    levels: { SD: 'ELEMENTARY', SMP: 'JUNIOR' }
  },
  {
    file: 'SD_SANG_TIMUR_CAKUNG_List_Full.csv',
    name: 'SANG TIMUR CAKUNG',
    locations: ['SD SANG TIMUR CAKUNG'],
    levels: { SD: 'ELEMENTARY' }
  },
  {
    file: 'TK_SD_SMP_SMK_SANTA_MARIA_List_Full.csv',
    name: 'SANTA MARIA',
    locations: ['TK SANTA MARIA', 'SD SANTA MARIA', 'SMP SANTA MARIA', 'SMK SANTA MARIA'],
    levels: { TK: 'KINDERGARTEN', SD: 'ELEMENTARY', SMP: 'JUNIOR', SMK: 'VOCATIONAL' }
  },
  {
    file: 'SD_BHAKTI_List_Full.csv',
    name: 'BHAKTI',
    locations: ['SD BHAKTI'],
    levels: { SD: 'ELEMENTARY' }
  },
  {
    file: 'SD_SMP_TARAKANITA_List_Full.csv',
    name: 'TARAKANITA',
    locations: ['SD TARAKANITA', 'SMP TARAKANITA'],
    levels: { SD: 'ELEMENTARY', SMP: 'JUNIOR' }
  },
  {
    file: 'TK_SD_SMP_ST_VINCENTIUS_List_Full.csv',
    name: 'ST VINCENTIUS',
    locations: ['TK ST VINCENTIUS', 'SD ST VINCENTIUS', 'SMP ST VINCENTIUS'],
    levels: { TK: 'KINDERGARTEN', SD: 'ELEMENTARY', SMP: 'JUNIOR' }
  }
];

// Create Supabase Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Global email tracker for uniqueness across all files
const globalEmailCounts = {};

// Parse CSV file
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return {
    headers,
    rows: lines.slice(1).filter(line => line.trim()).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
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

      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
      });
      return obj;
    })
  };
}

// Generate email from name
function generateEmail(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return `${parts[0].toLowerCase().replace(/[^a-z]/g, '')}@enormous1.com`;
  }
  const firstName = parts[0].toLowerCase().replace(/[^a-z]/g, '');
  const lastName = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '');
  return `${firstName}.${lastName}@enormous1.com`;
}

// Generate password from name
function generatePassword(name) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0].toLowerCase().replace(/[^a-z]/g, '')}123`;
}

// Determine jenjang from class name
function determineJenjang(kelas, originalJenjang) {
  const kelasLower = kelas.toLowerCase();

  // TK patterns
  if (kelasLower.includes('tk') || kelasLower.includes('kb') ||
      kelasLower.includes('kelompok') || kelasLower.includes('playgroup')) {
    return 'TK';
  }

  // Extract class number
  const match = kelas.match(/(\d+)/);
  if (match) {
    const classNum = parseInt(match[1], 10);
    if (classNum >= 1 && classNum <= 6) return 'SD';
    if (classNum >= 7 && classNum <= 9) return 'SMP';
    if (classNum >= 10 && classNum <= 12) {
      // Check if it's SMK or SMA based on original jenjang
      if (originalJenjang && originalJenjang.toUpperCase() === 'SMK') return 'SMK';
      return 'SMA';
    }
  }

  // Default to original or SD
  return originalJenjang || 'SD';
}

// Get unique email
function getUniqueEmail(baseEmail) {
  if (!globalEmailCounts[baseEmail]) {
    globalEmailCounts[baseEmail] = 1;
    return baseEmail;
  }
  globalEmailCounts[baseEmail]++;
  const [local, domain] = baseEmail.split('@');
  return `${local}${globalEmailCounts[baseEmail]}@${domain}`;
}

// Ensure location exists
async function ensureLocationExists(name, level) {
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) return existing.id;

  console.log(`  Creating location: ${name}`);
  const { data: created, error } = await supabase
    .from('locations')
    .insert({ name, address: 'Indonesia', capacity: 1000, level })
    .select('id')
    .single();

  if (error) {
    console.error(`  Failed to create ${name}:`, error.message);
    return null;
  }
  return created.id;
}

// Process one school
async function processSchool(school, locationMap) {
  const filePath = path.join(STUDENT_FOLDER, school.file);

  if (!fs.existsSync(filePath)) {
    console.log(`  File not found: ${school.file}`);
    return { success: 0, failed: 0, errors: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const { rows } = parseCSV(content);

  console.log(`  Found ${rows.length} students`);

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row['Nama Siswa'];

    if (!name) continue;

    const kelas = row['Kelas'] || '';
    const tipeKelas = row['Tipe Kelas'] || 'Regular';
    const originalJenjang = row['Jenjang'] || '';
    const jenjang = determineJenjang(kelas, originalJenjang);

    const locationName = `${jenjang} ${school.name}`;
    const locationId = locationMap[locationName];

    if (!locationId) {
      results.failed++;
      results.errors.push(`${name}: Location ${locationName} not found`);
      continue;
    }

    const baseEmail = generateEmail(name);
    const email = getUniqueEmail(baseEmail);
    const password = generatePassword(name);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        results.failed++;
        results.errors.push(`${email}: ${authError.message}`);
        continue;
      }

      const schoolInfo = `${jenjang} ${school.name} - ${kelas} (${tipeKelas})`;

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email,
        name,
        role: 'STUDENT',
        status: 'ACTIVE',
        assigned_location_id: locationId,
        school_origin: schoolInfo,
      });

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        results.failed++;
        results.errors.push(`${email}: ${profileError.message}`);
        continue;
      }

      results.success++;

      // Progress indicator every 50 students
      if ((i + 1) % 50 === 0) {
        console.log(`    Progress: ${i + 1}/${rows.length}`);
      }

    } catch (err) {
      results.failed++;
      results.errors.push(`${email}: ${err.message}`);
    }

    // Rate limit delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

// Main function
async function main() {
  console.log('='.repeat(60));
  console.log('BATCH IMPORT - 9 SCHOOLS');
  console.log('='.repeat(60));

  const startTime = Date.now();
  const totalResults = { success: 0, failed: 0, allErrors: [] };

  // Step 1: Create all locations first
  console.log('\n[STEP 1] Creating locations...');
  const locationMap = {};

  for (const school of SCHOOLS) {
    for (const locName of school.locations) {
      const jenjang = locName.split(' ')[0]; // TK, SD, SMP, SMK
      const level = school.levels[jenjang] || 'ELEMENTARY';
      const locId = await ensureLocationExists(locName, level);
      if (locId) {
        locationMap[locName] = locId;
      }
    }
  }

  console.log(`  Created/verified ${Object.keys(locationMap).length} locations`);

  // Step 2: Process each school
  console.log('\n[STEP 2] Importing students...\n');

  for (let i = 0; i < SCHOOLS.length; i++) {
    const school = SCHOOLS[i];
    console.log(`[${i + 1}/${SCHOOLS.length}] ${school.name}`);

    const results = await processSchool(school, locationMap);

    totalResults.success += results.success;
    totalResults.failed += results.failed;
    totalResults.allErrors.push(...results.errors.map(e => `${school.name}: ${e}`));

    console.log(`  Success: ${results.success}, Failed: ${results.failed}\n`);
  }

  // Final summary
  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log('='.repeat(60));
  console.log('IMPORT COMPLETED');
  console.log('='.repeat(60));
  console.log(`Total Success: ${totalResults.success}`);
  console.log(`Total Failed: ${totalResults.failed}`);
  console.log(`Duration: ${duration} seconds`);

  if (totalResults.allErrors.length > 0) {
    console.log(`\nFirst 30 errors:`);
    totalResults.allErrors.slice(0, 30).forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    if (totalResults.allErrors.length > 30) {
      console.log(`  ... and ${totalResults.allErrors.length - 30} more errors`);
    }
  }

  // Get final count
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'STUDENT');

  console.log(`\nTotal students in database: ${count}`);
}

main().catch(console.error);

/**
 * Import Teachers Script
 * Usage: node scripts/import-teachers.js
 *
 * This script reads teacher data from CSV and creates teacher accounts with proper assignments.
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
const CSV_FILE = path.join(__dirname, '..', 'Daftar Student', 'ELC TEACHERS - FIX teacher\'s schedule.csv');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// School name mapping from CSV to database location names
// Database locations:
// SD: ABDI SISWA ARIES, ABDI SISWA BINTARO, BHAKTI, CHARITAS BATAM, CHARITAS JKT, KRISTOFORUS 1/2, SANG TIMUR CAKUNG/KARANG TENGAH, SANTA MARIA, ST VINCENTIUS, TARAKANITA
// SMP: ABDI SISWA ARIES, ABDI SISWA BINTARO, ABDI SISWA PATRA, BHK, CHARITAS BATAM, CHARITAS JKT, MARSUDIRINI, SANG TIMUR KARANG TENGAH, SANTA MARIA, ST VINCENTIUS, TARAKANITA
// SMA: ABDI SISWA BINTARO, ABDI SISWA PATRA, BHK
// SMK: SANTA MARIA
// TK: ABDI SISWA BINTARO, CHARITAS BATAM, KRISTOFORUS 1/2, SANTA MARIA, ST VINCENTIUS
const SCHOOL_NAME_MAPPING = {
  // Abdi Siswa Aries (Taman Aries)
  'SD Abdi Siswa Aries': 'SD ABDI SISWA ARIES',
  'SD ABDI SISWA TAMAN ARIES': 'SD ABDI SISWA ARIES',
  'SMP Abdi Siswa Aries': 'SMP ABDI SISWA ARIES',
  'SMP ABDI SISWA TAMAN ARIES': 'SMP ABDI SISWA ARIES',

  // Abdi Siswa Bintaro
  'SD Abdi Siswa Bintaro': 'SD ABDI SISWA BINTARO',
  'SMP Abdi Siswa Bintaro': 'SMP ABDI SISWA BINTARO',
  'SMA Abdi Siswa Bintaro': 'SMA ABDI SISWA BINTARO',
  'TK Abdi Siswa Bintaro': 'TK ABDI SISWA BINTARO',

  // Abdi Siswa Patra
  'SMP Abdi Siswa Patra': 'SMP ABDI SISWA PATRA',
  'SMA Abdi Siswa Patra': 'SMA ABDI SISWA PATRA',

  // BHK
  'SMP BHK Jakrta': 'SMP BHK',
  'SMP BHK Jakarta': 'SMP BHK',
  'SMA BHK Jakarta': 'SMA BHK',

  // Albertus - doesn't exist, will create
  'SD Albertus': 'SD ALBERTUS',

  // Marsudirini
  'SMP Marsudirini': 'SMP MARSUDIRINI',

  // Sang Timur
  'SDK Sang Timur Karang Tengah': 'SDK SANG TIMUR KARANG TENGAH',
  'SMP Katolik Sang Timur Karang Tengah': 'SMP SANG TIMUR KARANG TENGAH',
  'SDK Sang Timur Cakung': 'SD SANG TIMUR CAKUNG',
  'SMP Sang Timur Cakung': 'SMP SANG TIMUR CAKUNG',

  // Santa Maria
  'TK Santa Maria Jakarta': 'TK SANTA MARIA',
  'SD Santa Maria Jakarta': 'SD SANTA MARIA',
  'SMP Santa Maria': 'SMP SANTA MARIA',
  'SMK SANTA MARIA JAKARTA': 'SMK SANTA MARIA',

  // Bhakti
  'SD Bhakti': 'SD BHAKTI',

  // Tarakanita
  'SD Tarakanita Citra Raya': 'SD TARAKANITA',
  'SMP Tarakanita Citra Raya': 'SMP TARAKANITA',

  // Charitas
  'SD Charitas Batam': 'SD CHARITAS BATAM',
  'TK Charitas Batam': 'TK CHARITAS BATAM',
  'SMP Charitas Batam': 'SMP CHARITAS BATAM',
  'SD Charitas': 'SD CHARITAS JKT',
  'SD Charitas Jakarta': 'SD CHARITAS JKT',
  'SMP CHARITAS JAKARTA': 'SMP CHARITAS JKT',

  // Kristoforus
  'SD Santo Kristoforus II': 'SD KRISTOFORUS 2',
  'SD KRISTOFORUS 1': 'SD KRISTOFORUS 1',
  'TK KRISTOFORUS 1': 'TK KRISTOFORUS 1',
  'TK KRISTOFORUS 2': 'TK KRISTOFORUS 2',

  // St Vincentius
  'TK ST. VINCETIUS SCHOOL': 'TK ST VINCENTIUS',
  'SD ST. VINCETIUS SCHOOL': 'SD ST VINCENTIUS',
  'SMP ST. VINCETIUS SCHOOL': 'SMP ST VINCENTIUS',
};

// Parse CSV file
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).filter(line => line.trim()).map(line => {
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
  });
}

// Parse grades from CSV (e.g., "1, 2" -> ["1", "2"])
function parseGrades(gradesStr) {
  if (!gradesStr) return [];
  return gradesStr.split(',').map(g => g.trim()).filter(Boolean);
}

// Parse subjects from CSV (e.g., "writing, reading" -> ["writing", "reading"])
function parseSubjects(subjectsStr) {
  if (!subjectsStr) return [];
  return subjectsStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

// Normalize class type
function normalizeClassType(classType) {
  const ct = classType.toLowerCase().trim();
  if (ct === 'bilingual') return 'Bilingual';
  if (ct === 'regular') return 'Regular';
  return classType;
}

// Generate email from teacher name
function generateEmail(name) {
  // Clean the name - remove Mr./Ms./etc
  const cleanName = name.replace(/^(Mr\.|Ms\.|Mrs\.)\s*/i, '').trim();
  const parts = cleanName.split(/\s+/);

  if (parts.length === 1) {
    return `${parts[0].toLowerCase().replace(/[^a-z]/g, '')}.teacher@enormous1.com`;
  }
  const firstName = parts[0].toLowerCase().replace(/[^a-z]/g, '');
  return `${firstName}.teacher@enormous1.com`;
}

// Generate password from teacher name
function generatePassword(name) {
  const cleanName = name.replace(/^(Mr\.|Ms\.|Mrs\.)\s*/i, '').trim();
  const parts = cleanName.split(/\s+/);
  return `${parts[0].toLowerCase().replace(/[^a-z]/g, '')}teacher123`;
}

async function main() {
  console.log('='.repeat(60));
  console.log('IMPORT TEACHERS FROM CSV');
  console.log('='.repeat(60) + '\n');

  // Step 1: Read and parse CSV
  console.log('[STEP 1] Reading CSV file...');

  if (!fs.existsSync(CSV_FILE)) {
    console.error('CSV file not found:', CSV_FILE);
    return;
  }

  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  const rows = parseCSV(content);
  console.log(`  Found ${rows.length} rows in CSV\n`);

  // Step 2: Get all locations from database
  console.log('[STEP 2] Fetching locations from database...');
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
  console.log(`  Found ${locations.length} locations`);

  // Collect all unique school names from CSV to check for missing locations
  const csvSchoolNames = new Set();
  for (const row of rows) {
    const schoolName = row['SEKOLAH']?.trim();
    if (schoolName) {
      const mappedName = SCHOOL_NAME_MAPPING[schoolName] || schoolName.toUpperCase();
      csvSchoolNames.add(mappedName);
    }
  }

  // Create missing locations
  const missingLocations = [];
  for (const schoolName of csvSchoolNames) {
    if (!locationMap[schoolName.toUpperCase()]) {
      missingLocations.push(schoolName);
    }
  }

  if (missingLocations.length > 0) {
    console.log(`\n  Creating ${missingLocations.length} missing locations:`);
    for (const locName of missingLocations) {
      // Determine level based on prefix
      let level = 'ELEMENTARY';
      if (locName.startsWith('TK')) level = 'KINDERGARTEN';
      else if (locName.startsWith('SMP')) level = 'JUNIOR';
      else if (locName.startsWith('SMA')) level = 'HIGH';
      else if (locName.startsWith('SMK')) level = 'VOCATIONAL';

      const { data: newLoc, error: createError } = await supabase
        .from('locations')
        .insert({ name: locName, address: 'Indonesia', capacity: 500, level })
        .select('id')
        .single();

      if (createError) {
        console.log(`    ✗ ${locName}: ${createError.message}`);
      } else {
        locationMap[locName.toUpperCase()] = newLoc.id;
        console.log(`    ✓ ${locName}`);
      }
    }
  }
  console.log();

  // Step 3: Get all classes from database
  console.log('[STEP 3] Fetching classes from database...');
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name, location_id, class_type');

  if (classError) {
    console.error('Failed to get classes:', classError.message);
    return;
  }

  // Group classes by location
  const classesByLocation = {};
  classes.forEach(cls => {
    if (!classesByLocation[cls.location_id]) {
      classesByLocation[cls.location_id] = [];
    }
    classesByLocation[cls.location_id].push(cls);
  });
  console.log(`  Found ${classes.length} classes\n`);

  // Step 4: Aggregate teacher data
  console.log('[STEP 4] Aggregating teacher data...');

  const teachersMap = new Map(); // Key: teacher name, Value: aggregated data

  for (const row of rows) {
    const teacherName = row['NAMA GURU']?.trim();
    const schoolName = row['SEKOLAH']?.trim();
    const classType = normalizeClassType(row['JENIS KELAS'] || 'Regular');
    const gradesStr = row['KELAS'] || '';
    const subjectsStr = row['SUBJECT'] || '';

    if (!teacherName || !schoolName) continue;

    // Map school name to location name
    const mappedSchoolName = SCHOOL_NAME_MAPPING[schoolName] || schoolName.toUpperCase();
    const locationId = locationMap[mappedSchoolName.toUpperCase()];

    if (!locationId) {
      console.warn(`  Warning: Location not found for "${schoolName}" -> "${mappedSchoolName}"`);
      continue;
    }

    // Get or create teacher entry
    if (!teachersMap.has(teacherName)) {
      teachersMap.set(teacherName, {
        name: teacherName,
        locationIds: new Set(),
        classes: new Set(),
        classTypes: new Set(),
        subjects: new Set(),
        assignments: [] // For tracking detailed assignments
      });
    }

    const teacher = teachersMap.get(teacherName);
    teacher.locationIds.add(locationId);
    teacher.classTypes.add(classType);

    // Parse and add subjects
    const subjects = parseSubjects(subjectsStr);
    subjects.forEach(s => teacher.subjects.add(s));

    // Parse grades and find matching classes
    const grades = parseGrades(gradesStr);
    const locationClasses = classesByLocation[locationId] || [];

    for (const grade of grades) {
      const gradeLower = grade.toLowerCase().trim();

      // Handle TK grades
      if (gradeLower === 'tk' || gradeLower.includes('tk')) {
        // Add all TK classes for this location
        locationClasses.forEach(cls => {
          if (cls.name.toLowerCase().includes('tk')) {
            teacher.classes.add(cls.name);
          }
        });
        continue;
      }

      // Handle numeric grades
      const gradeNum = parseInt(gradeLower, 10);
      if (!isNaN(gradeNum)) {
        // Find all classes that match this grade number
        // e.g., grade "1" matches "KELAS 1 A", "KELAS 1 B", "KELAS 1 C", "1A", "1B"
        locationClasses.forEach(cls => {
          const className = cls.name.toUpperCase();
          // Match patterns like "KELAS 1 A", "KELAS 1 B", "1A", "1 A"
          const patterns = [
            new RegExp(`^KELAS\\s+${gradeNum}\\s*[A-Z]?$`, 'i'),
            new RegExp(`^${gradeNum}\\s*[A-Z]$`, 'i'),
            new RegExp(`^${gradeNum}[A-Z]$`, 'i'),
          ];

          if (patterns.some(p => p.test(className))) {
            teacher.classes.add(cls.name);
          }
        });
      }
    }

    // Track the assignment for reference
    teacher.assignments.push({
      school: schoolName,
      locationId,
      classType,
      grades,
      subjects
    });
  }

  console.log(`  Aggregated ${teachersMap.size} unique teachers\n`);

  // Show teacher summary
  console.log('[STEP 5] Teacher Summary:');
  for (const [name, data] of teachersMap) {
    console.log(`  ${name}:`);
    console.log(`    - Schools: ${data.locationIds.size}`);
    console.log(`    - Classes: ${data.classes.size}`);
    console.log(`    - Class Types: ${[...data.classTypes].join(', ')}`);
    console.log(`    - Subjects: ${[...data.subjects].slice(0, 5).join(', ')}${data.subjects.size > 5 ? '...' : ''}`);
  }
  console.log();

  // Step 6: Create teacher accounts
  console.log('[STEP 6] Creating teacher accounts...');

  const results = { success: 0, failed: 0, errors: [], credentials: [] };
  const emailCounts = {}; // Track duplicate emails

  for (const [teacherName, data] of teachersMap) {
    // Generate unique email
    let baseEmail = generateEmail(teacherName);
    if (!emailCounts[baseEmail]) {
      emailCounts[baseEmail] = 1;
    } else {
      emailCounts[baseEmail]++;
      const [local, domain] = baseEmail.split('@');
      baseEmail = `${local}${emailCounts[baseEmail]}@${domain}`;
    }

    const email = baseEmail;
    const password = generatePassword(teacherName);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`  ${teacherName}: Email already exists, skipping...`);
          results.failed++;
          results.errors.push(`${teacherName}: Email ${email} already registered`);
          continue;
        }
        throw authError;
      }

      // Create profile
      // Note: class_types column doesn't exist yet, so we store in school_origin as reference
      const classTypesStr = [...data.classTypes].join(', ');
      const profileData = {
        id: authData.user.id,
        email,
        name: teacherName,
        role: 'TEACHER',
        status: 'ACTIVE',
        assigned_location_ids: [...data.locationIds],
        assigned_classes: [...data.classes],
        assigned_subjects: [...data.subjects],
        school_origin: `Class Types: ${classTypesStr}`, // Store class types here temporarily
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        // Rollback auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      results.success++;
      results.credentials.push({
        name: teacherName,
        email,
        password,
        schools: data.locationIds.size,
        classes: data.classes.size
      });

      console.log(`  ✓ ${teacherName} (${email})`);

    } catch (err) {
      results.failed++;
      results.errors.push(`${teacherName}: ${err.message}`);
      console.log(`  ✗ ${teacherName}: ${err.message}`);
    }

    // Rate limit delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT COMPLETED');
  console.log('='.repeat(60));
  console.log(`Success: ${results.success}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  }

  // Save credentials to file
  if (results.credentials.length > 0) {
    const credentialsFile = path.join(__dirname, '..', 'Daftar Student', 'teacher-credentials.csv');
    const csvContent = [
      'Name,Email,Password,Schools,Classes',
      ...results.credentials.map(c => `"${c.name}","${c.email}","${c.password}",${c.schools},${c.classes}`)
    ].join('\n');

    fs.writeFileSync(credentialsFile, csvContent);
    console.log(`\nCredentials saved to: ${credentialsFile}`);
  }

  // Get final count
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'TEACHER');

  console.log(`\nTotal teachers in database: ${count}`);
}

main().catch(console.error);

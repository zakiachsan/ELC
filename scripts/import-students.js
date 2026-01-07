/**
 * Script to import students from CSV to Supabase
 *
 * Prerequisites:
 * 1. Run the schools migration first: supabase db push or run 20250106_add_schools.sql
 * 2. Deploy the import-students edge function: supabase functions deploy import-students
 * 3. Have an admin account logged in to get the token
 *
 * Usage:
 * 1. Login as admin in the browser
 * 2. Open DevTools > Application > Local Storage
 * 3. Copy the 'sb-prmjdngeuczatlspinql-auth-token' value
 * 4. Save it to scripts/token.json
 * 5. Run: node scripts/import-students.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzAyMTMsImV4cCI6MjA4MjQwNjIxM30.AvTJR6wF206M2Iz3raZCEOE6aAnhokjCR9W7PRrve2E';
const CSV_FILE = path.join(__dirname, '..', 'Daftar Student', 'SD_SMP_ABDI_SISWA_ARIES_List.csv');

// Get token from environment OR from token.json file
let TOKEN = process.env.SUPABASE_TOKEN;

// Try reading from token.json if env var not set
if (!TOKEN) {
  const tokenFile = path.join(__dirname, 'token.json');
  if (fs.existsSync(tokenFile)) {
    try {
      const tokenData = fs.readFileSync(tokenFile, 'utf-8');
      TOKEN = tokenData.trim();
      console.log('Token loaded from scripts/token.json');
    } catch (e) {
      console.error('Error reading token.json:', e.message);
    }
  }
}

if (!TOKEN) {
  console.error('Error: Token not found!');
  console.log('\n=== CARA MUDAH ===');
  console.log('1. Login sebagai admin di browser');
  console.log('2. Buka DevTools (F12) > Application > Local Storage');
  console.log('3. Copy value dari key "sb-prmjdngeuczatlspinql-auth-token"');
  console.log('4. Buat file: scripts/token.json');
  console.log('5. Paste token ke dalam file tersebut (tanpa modifikasi)');
  console.log('6. Jalankan lagi: node scripts/import-students.js');
  process.exit(1);
}

// Parse access_token from the stored auth data
let accessToken;

// Remove surrounding quotes if present
let cleanToken = TOKEN.replace(/^["']|["']$/g, '').trim();

try {
  const authData = JSON.parse(cleanToken);
  accessToken = authData.access_token;
  if (!accessToken) throw new Error('No access_token in auth data');
  console.log('Parsed access_token from JSON object');
} catch (e) {
  // If it's already just the token string (JWT)
  accessToken = cleanToken;
  console.log('Using token directly as JWT');
}

console.log('Token preview:', accessToken.substring(0, 50) + '...');

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

// Read and parse CSV
console.log('Reading CSV file...');
const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
const students = parseCSV(csvContent);
console.log(`Found ${students.length} students in CSV`);

// Transform to expected format
const studentData = students.map(s => ({
  name: s['Nama Siswa'],
  email: s['Email'],
  password: s['Password'],
  jenjang: s['Jenjang'],
  kelas: s['Kelas'],
  tipe_kelas: s['Tipe Kelas']
}));

// Import function
async function importStudents() {
  console.log('\nStarting import...');
  console.log(`Importing ${studentData.length} students to ${SUPABASE_URL}`);

  // Process in batches of 50
  const batchSize = 50;
  let totalSuccess = 0;
  let totalFailed = 0;
  const allErrors = [];

  for (let i = 0; i < studentData.length; i += batchSize) {
    const batch = studentData.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(studentData.length / batchSize);

    console.log(`\nProcessing batch ${batchNum}/${totalBatches} (${batch.length} students)...`);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/import-students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ students: batch }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`Batch ${batchNum} error:`, result.error || response.statusText);
        console.error(`Status: ${response.status}, Full response:`, JSON.stringify(result));
        totalFailed += batch.length;
        allErrors.push(`Batch ${batchNum}: ${result.error || response.statusText}`);
      } else {
        console.log(`Batch ${batchNum} completed - Success: ${result.success}, Failed: ${result.failed}`);
        totalSuccess += result.success || 0;
        totalFailed += result.failed || 0;
        if (result.errors && result.errors.length > 0) {
          allErrors.push(...result.errors);
        }
      }
    } catch (error) {
      console.error(`Batch ${batchNum} network error:`, error.message);
      totalFailed += batch.length;
      allErrors.push(`Batch ${batchNum} network error: ${error.message}`);
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n========================================');
  console.log('IMPORT COMPLETED');
  console.log('========================================');
  console.log(`Total Success: ${totalSuccess}`);
  console.log(`Total Failed: ${totalFailed}`);

  if (allErrors.length > 0) {
    console.log('\nErrors encountered:');
    allErrors.slice(0, 20).forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    if (allErrors.length > 20) {
      console.log(`  ... and ${allErrors.length - 20} more errors`);
    }
  }
}

importStudents().catch(console.error);

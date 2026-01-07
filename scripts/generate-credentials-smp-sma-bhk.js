/**
 * Generate Email and Password for SMP_SMA_BHK students
 * Usage: node scripts/generate-credentials-smp-sma-bhk.js
 *
 * Note: The source CSV has all students marked as "SMA", but grades 7-9 are SMP.
 * This script corrects the Jenjang based on class number.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '..', 'Daftar Student', 'SMP_SMA_BHK_List_Full.csv');
const OUTPUT_FILE = path.join(__dirname, '..', 'Daftar Student', 'SMP_SMA_BHK_List_With_Credentials.csv');

// Helper function to generate email from name
function generateEmail(name) {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return `${parts[0].toLowerCase()}@enormous1.com`;
  }

  const firstName = parts[0].toLowerCase();
  const lastName = parts[parts.length - 1].toLowerCase();

  const cleanFirst = firstName.replace(/[^a-z]/g, '');
  const cleanLast = lastName.replace(/[^a-z]/g, '');

  return `${cleanFirst}.${cleanLast}@enormous1.com`;
}

// Helper function to generate password from name
function generatePassword(name) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0].toLowerCase().replace(/[^a-z]/g, '');
  return `${firstName}123`;
}

// Helper function to determine correct Jenjang from class name
function determineJenjang(kelas) {
  // Extract the class number from various formats
  const match = kelas.match(/(\d+)/);
  if (match) {
    const classNum = parseInt(match[1], 10);
    if (classNum >= 7 && classNum <= 9) {
      return 'SMP';
    } else if (classNum >= 10 && classNum <= 12) {
      return 'SMA';
    }
  }
  // Default to SMA if can't determine
  return 'SMA';
}

// Parse CSV
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

      return values;
    })
  };
}

// Main function
function main() {
  console.log('===========================================');
  console.log('GENERATE CREDENTIALS - SMP & SMA BHK');
  console.log('===========================================\n');

  // Read input file
  console.log('Reading input file...');
  const content = fs.readFileSync(INPUT_FILE, 'utf-8');
  const { headers, rows } = parseCSV(content);

  console.log(`Found ${rows.length} students\n`);
  console.log('Headers:', headers);

  // Find column indices
  const jenjangIndex = headers.findIndex(h => h.toLowerCase().includes('jenjang'));
  const kelasIndex = headers.findIndex(h => h.toLowerCase().includes('kelas'));
  const nameIndex = headers.findIndex(h => h.toLowerCase().includes('nama'));

  if (nameIndex === -1) {
    console.error('Could not find name column!');
    process.exit(1);
  }
  console.log(`Jenjang index: ${jenjangIndex}, Kelas index: ${kelasIndex}, Name index: ${nameIndex}\n`);

  // Track email uniqueness
  const emailCounts = {};

  // Generate credentials for each row
  const newHeaders = [...headers, 'Email', 'Password'];
  const newRows = rows.map((row, index) => {
    const name = row[nameIndex];
    if (!name) {
      console.log(`Row ${index + 2}: Empty name, skipping`);
      return [...row, '', ''];
    }

    // Correct the Jenjang based on class
    const originalJenjang = row[jenjangIndex];
    const kelas = row[kelasIndex];
    const correctedJenjang = determineJenjang(kelas);

    if (originalJenjang !== correctedJenjang) {
      row[jenjangIndex] = correctedJenjang;
    }

    let email = generateEmail(name);
    const password = generatePassword(name);

    // Handle duplicate emails
    if (emailCounts[email]) {
      emailCounts[email]++;
      const [localPart, domain] = email.split('@');
      email = `${localPart}${emailCounts[email]}@${domain}`;
    } else {
      emailCounts[email] = 1;
    }

    return [...row, email, password];
  });

  // Count by corrected jenjang
  console.log('\nBreakdown by Jenjang (corrected):');
  const byJenjang = { SMP: 0, SMA: 0 };
  newRows.forEach(row => {
    const jenjang = row[jenjangIndex];
    byJenjang[jenjang] = (byJenjang[jenjang] || 0) + 1;
  });
  Object.entries(byJenjang).forEach(([jenjang, count]) => {
    console.log(`  - ${jenjang}: ${count} students`);
  });

  // Count duplicates
  const duplicates = Object.entries(emailCounts).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log(`\nFound ${duplicates.length} names with duplicates:`);
    duplicates.forEach(([email, count]) => {
      console.log(`  - ${email}: ${count} students`);
    });
  }

  // Generate output CSV
  console.log('\nGenerating output CSV...');
  const outputLines = [
    newHeaders.join(','),
    ...newRows.map(row => row.map(v => v.includes(',') ? `"${v}"` : v).join(','))
  ];

  fs.writeFileSync(OUTPUT_FILE, outputLines.join('\n'), 'utf-8');

  console.log(`\nOutput saved to: ${OUTPUT_FILE}`);
  console.log(`   Total students: ${rows.length}`);

  // Show sample
  console.log('\nSample of generated credentials:');
  newRows.slice(0, 5).forEach((row, i) => {
    const name = row[nameIndex];
    const jenjang = row[jenjangIndex];
    const kelas = row[kelasIndex];
    const email = row[row.length - 2];
    const password = row[row.length - 1];
    console.log(`  ${i + 1}. ${name} (${jenjang} - ${kelas})`);
    console.log(`     Email: ${email}`);
    console.log(`     Password: ${password}`);
  });

  console.log('\n===========================================');
  console.log('DONE!');
  console.log('===========================================');
}

main();

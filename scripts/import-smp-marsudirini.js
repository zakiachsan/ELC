/**
 * Import Script for SMP MARSUDIRINI
 * Usage: node scripts/import-smp-marsudirini.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';
const CSV_FILE = path.join(__dirname, '..', 'Daftar Student', 'SMP_MARSUDIRINI_List_Full.csv');
const OUTPUT_CSV = path.join(__dirname, '..', 'Daftar Student', 'SMP_MARSUDIRINI_List_With_Credentials.csv');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const emailCounts = {};

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
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else current += char;
      }
      values.push(current.trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i]?.trim() || '');
      return obj;
    })
  };
}

function generateEmail(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0].toLowerCase().replace(/[^a-z]/g, '')}@enormous1.com`;
  const first = parts[0].toLowerCase().replace(/[^a-z]/g, '');
  const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '');
  return `${first}.${last}@enormous1.com`;
}

function generatePassword(name) {
  return `${name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '')}123`;
}

function getUniqueEmail(base) {
  if (!emailCounts[base]) { emailCounts[base] = 1; return base; }
  emailCounts[base]++;
  const [local, domain] = base.split('@');
  return `${local}${emailCounts[base]}@${domain}`;
}

async function ensureLocation(name, level) {
  const { data } = await supabase.from('locations').select('id').eq('name', name).single();
  if (data) return data.id;
  const { data: created, error } = await supabase.from('locations')
    .insert({ name, address: 'Jakarta', capacity: 500, level }).select('id').single();
  if (error) { console.error(`Failed to create ${name}:`, error.message); return null; }
  console.log(`Created location: ${name}`);
  return created.id;
}

async function main() {
  console.log('='.repeat(50));
  console.log('IMPORT SMP MARSUDIRINI');
  console.log('='.repeat(50) + '\n');

  const smpId = await ensureLocation('SMP MARSUDIRINI', 'JUNIOR');

  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  const { headers, rows } = parseCSV(content);
  console.log(`Found ${rows.length} students\n`);

  const processedRows = rows.map(r => {
    const email = getUniqueEmail(generateEmail(r['Nama Siswa']));
    const password = generatePassword(r['Nama Siswa']);
    return { ...r, jenjang: 'SMP', email, password };
  });

  // Save CSV
  const csvLines = [
    [...headers, 'Email', 'Password'].join(','),
    ...processedRows.map(r => [...headers.map(h => r[h]?.includes(',') ? `"${r[h]}"` : r[h]), r.email, r.password].join(','))
  ];
  fs.writeFileSync(OUTPUT_CSV, csvLines.join('\n'), 'utf-8');
  console.log(`Credentials saved to: ${OUTPUT_CSV}\n`);

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < processedRows.length; i++) {
    const s = processedRows[i];
    process.stdout.write(`[${i + 1}/${processedRows.length}] ${s['Nama Siswa']}... `);

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: s.email, password: s.password, email_confirm: true
      });

      if (authError) {
        console.log(`FAILED`);
        results.failed++; results.errors.push(`${s.email}: ${authError.message}`);
        continue;
      }

      const schoolInfo = `SMP MARSUDIRINI - ${s['Kelas']} (${s['Tipe Kelas'] || 'Regular'})`;
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id, email: s.email, name: s['Nama Siswa'],
        role: 'STUDENT', status: 'ACTIVE',
        assigned_location_id: smpId, school_origin: schoolInfo
      });

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log(`FAILED`);
        results.failed++; results.errors.push(`${s.email}: ${profileError.message}`);
        continue;
      }

      console.log('OK');
      results.success++;
    } catch (err) {
      console.log(`FAILED`);
      results.failed++; results.errors.push(`${s.email}: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n' + '='.repeat(50));
  console.log('COMPLETED');
  console.log('='.repeat(50));
  console.log(`Success: ${results.success}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT');
  console.log(`\nTotal students in database: ${count}`);
}

main().catch(console.error);

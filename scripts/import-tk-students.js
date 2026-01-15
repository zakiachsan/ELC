// Script to import TK ABDI SISWA BINTARO students
// Run with: node scripts/import-tk-students.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY=your_service_role_key to .env.local');
  console.log('You can find it in Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const students = [
  { name: "Advenny Rafela Hutasoit", email: "advenny.hutasoit@enormous1.com", password: "advenny123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Alona Pali Tondok", email: "alona.tondok@enormous1.com", password: "alona123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Applelyn Vilianto", email: "applelyn.vilianto@enormous1.com", password: "applelyn123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Chevelle Elena Nathania", email: "chevelle.nathania@enormous1.com", password: "chevelle123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Diodaru Ekadanta Sugianto", email: "diodaru.sugianto@enormous1.com", password: "diodaru123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Glory Natamaro Tampubolon", email: "glory.tampubolon@enormous1.com", password: "glory123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Jason Aldrich Arcadia", email: "jason.arcadia@enormous1.com", password: "jason123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Kenji Sidney Wang", email: "kenji.wang@enormous1.com", password: "kenji123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Maximus Darren Prabowo", email: "maximus.prabowo@enormous1.com", password: "maximus123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Ong Kenzo Santoso", email: "ong.santoso@enormous1.com", password: "ong123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Raphaelo Davean Gunawan", email: "raphaelo.gunawan@enormous1.com", password: "raphaelo123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Rentera Naladhipa Setyatma Ahimsa", email: "rentera.ahimsa@enormous1.com", password: "rentera123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Visakha Alexandra Gautami", email: "visakha.gautami@enormous1.com", password: "visakha123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Xavier Theofani Hita Karana", email: "xavier.karana@enormous1.com", password: "xavier123", kelas: "TK A", tipe_kelas: "Bilingual" },
  { name: "Adelmar Hosea Elnathan", email: "adelmar.elnathan@enormous1.com", password: "adelmar123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Alexandra Holy Gratia", email: "alexandra.gratia@enormous1.com", password: "alexandra123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Baelyn Sutera Sutardinata", email: "baelyn.sutardinata@enormous1.com", password: "baelyn123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Calysta Feodora Yusuf", email: "calysta.yusuf@enormous1.com", password: "calysta123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Carolyn Resyanda Raharjo", email: "carolyn.raharjo@enormous1.com", password: "carolyn123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Dewi Putri Irmayanti", email: "dewi.irmayanti@enormous1.com", password: "dewi123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Emilly Freya Iskandar", email: "emilly.iskandar@enormous1.com", password: "emilly123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Felicia Jovanka Seraphine Widjaya", email: "felicia.widjaya@enormous1.com", password: "felicia123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Gaetano Hizkia Mulia Pandiangan", email: "gaetano.pandiangan@enormous1.com", password: "gaetano123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Isabelle Aurora Tarigan", email: "isabelle.tarigan@enormous1.com", password: "isabelle123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Jayden Melviano", email: "jayden.melviano@enormous1.com", password: "jayden123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Lentera Tesalonika Bisanto", email: "lentera.bisanto@enormous1.com", password: "lentera123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Michael Ethan Hamonangan", email: "michael.hamonangan@enormous1.com", password: "michael123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Moriya Pali Tondok", email: "moriya.tondok@enormous1.com", password: "moriya123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Neve Elora Handoko", email: "neve.handoko@enormous1.com", password: "neve123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Senada Ende Serafim Batubara", email: "senada.batubara@enormous1.com", password: "senada123", kelas: "TK B", tipe_kelas: "Bilingual" },
  { name: "Valerie Fransesca Tanujaya", email: "valerie.tanujaya@enormous1.com", password: "valerie123", kelas: "TK B", tipe_kelas: "Bilingual" },
];

async function importStudents() {
  console.log('Starting import of TK ABDI SISWA BINTARO students...\n');

  // Get location ID
  const { data: location, error: locError } = await supabase
    .from('locations')
    .select('id, name')
    .ilike('name', '%TK ABDI SISWA BINTARO%')
    .single();

  if (locError || !location) {
    console.error('Location not found:', locError?.message);
    return;
  }

  console.log(`Found location: ${location.name} (${location.id})\n`);

  let success = 0;
  let failed = 0;
  const errors = [];

  for (const student of students) {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: student.email,
        password: student.password,
        email_confirm: true,
      });

      if (authError) {
        failed++;
        errors.push(`${student.email}: ${authError.message}`);
        console.log(`❌ ${student.name}: ${authError.message}`);
        continue;
      }

      const userId = authData.user.id;
      const schoolInfo = `TK ABDI SISWA BINTARO - ${student.kelas} (${student.tipe_kelas})`;

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: student.email,
          name: student.name,
          role: 'STUDENT',
          status: 'ACTIVE',
          assigned_location_id: location.id,
          school_origin: schoolInfo,
        });

      if (profileError) {
        // Rollback auth user
        await supabase.auth.admin.deleteUser(userId);
        failed++;
        errors.push(`${student.email}: Profile error - ${profileError.message}`);
        console.log(`❌ ${student.name}: ${profileError.message}`);
        continue;
      }

      success++;
      console.log(`✅ ${student.name} (${student.kelas})`);
    } catch (err) {
      failed++;
      errors.push(`${student.email}: ${err.message}`);
      console.log(`❌ ${student.name}: ${err.message}`);
    }
  }

  console.log('\n========================================');
  console.log(`Import completed!`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
}

importStudents();

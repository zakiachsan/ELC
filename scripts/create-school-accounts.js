/**
 * Script to create SCHOOL accounts for all existing schools/locations in the database
 *
 * Usage: node scripts/create-school-accounts.js
 *
 * This script will:
 * 1. Fetch all locations from the database
 * 2. Create Supabase auth users with email format: school_[location_slug]@elcenormous1.com
 * 3. Create profiles with role='SCHOOL' and assigned_location_id
 * 4. Output credentials for each school
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in environment variables');
  console.error('Please add your Supabase Service Role Key to .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Convert school name to slug for email
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .trim();
}

// Default password for all school accounts
const DEFAULT_PASSWORD = 'SchoolELC2025!';

async function createSchoolAccounts() {
  console.log('='.repeat(60));
  console.log('Creating School Accounts');
  console.log('='.repeat(60));

  // Fetch all locations
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name')
    .order('name');

  if (locError) {
    console.error('Error fetching locations:', locError);
    return;
  }

  console.log(`\nFound ${locations.length} locations`);
  console.log('-'.repeat(60));

  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  for (const location of locations) {
    // Skip online/virtual locations
    if (location.name.toLowerCase().includes('online') ||
        location.name.toLowerCase().includes('virtual')) {
      results.skipped.push({ name: location.name, reason: 'Online/Virtual location' });
      continue;
    }

    const slug = slugify(location.name);
    const email = `school_${slug}@elcenormous1.com`;

    console.log(`\nProcessing: ${location.name}`);
    console.log(`  Email: ${email}`);

    // Check if profile already exists for this location
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('assigned_location_id', location.id)
      .eq('role', 'SCHOOL')
      .maybeSingle();

    if (existingProfile) {
      console.log(`  -> Skipped: Account already exists (${existingProfile.email})`);
      results.skipped.push({ name: location.name, reason: 'Account already exists', email: existingProfile.email });
      continue;
    }

    // Check if email already used
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      console.log(`  -> Skipped: Email already in use`);
      results.skipped.push({ name: location.name, reason: 'Email already in use', email });
      continue;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true
      });

      if (authError) {
        throw authError;
      }

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          name: `${location.name} (School Admin)`,
          role: 'SCHOOL',
          assigned_location_id: location.id,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        // Rollback auth user if profile creation fails
        await supabase.auth.admin.deleteUser(userId);
        throw profileError;
      }

      console.log(`  -> Created successfully!`);
      results.created.push({
        name: location.name,
        email,
        password: DEFAULT_PASSWORD,
        location_id: location.id
      });

    } catch (error) {
      console.log(`  -> Error: ${error.message}`);
      results.errors.push({
        name: location.name,
        email,
        error: error.message
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  console.log(`\nCreated: ${results.created.length}`);
  console.log(`Skipped: ${results.skipped.length}`);
  console.log(`Errors:  ${results.errors.length}`);

  if (results.created.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('CREATED ACCOUNTS');
    console.log('-'.repeat(60));
    console.log('\nSchool Name | Email | Password');
    console.log('-'.repeat(60));
    results.created.forEach(account => {
      console.log(`${account.name}`);
      console.log(`  Email: ${account.email}`);
      console.log(`  Password: ${account.password}`);
      console.log('');
    });
  }

  if (results.skipped.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('SKIPPED');
    console.log('-'.repeat(60));
    results.skipped.forEach(item => {
      console.log(`${item.name}: ${item.reason}${item.email ? ` (${item.email})` : ''}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('ERRORS');
    console.log('-'.repeat(60));
    results.errors.forEach(item => {
      console.log(`${item.name}: ${item.error}`);
    });
  }

  // Export to JSON file
  const outputPath = 'scripts/school-accounts-output.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults exported to: ${outputPath}`);

  console.log('\n' + '='.repeat(60));
  console.log('Done!');
  console.log('='.repeat(60));
}

createSchoolAccounts().catch(console.error);

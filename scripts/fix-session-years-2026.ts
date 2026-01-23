import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://prmjdngeuczatlspinql.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found. Set it in environment or .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_LOCATION = 'SD SANG TIMUR CAKUNG - 1 BILINGUAL';
const TARGET_YEAR = 2026;

async function fixSessionYears() {
  console.log(`\n🔍 Finding sessions for: ${TARGET_LOCATION}\n`);

  // Fetch sessions
  const { data: sessions, error: fetchError } = await supabase
    .from('class_sessions')
    .select('id, topic, date_time, location')
    .eq('location', TARGET_LOCATION);

  if (fetchError) {
    console.error('❌ Error fetching sessions:', fetchError);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log('⚠️ No sessions found for this location');
    return;
  }

  console.log(`📋 Found ${sessions.length} sessions to update:\n`);

  // Show what will be updated
  for (const session of sessions) {
    const oldDate = new Date(session.date_time);
    const newDate = new Date(oldDate);
    newDate.setFullYear(TARGET_YEAR);

    console.log(`  📅 "${session.topic}"`);
    console.log(`     ${oldDate.toISOString()} → ${newDate.toISOString()}\n`);
  }

  // Ask for confirmation
  const args = process.argv.slice(2);
  if (!args.includes('--execute')) {
    console.log('\n⚠️  DRY RUN - No changes made');
    console.log('👉 Run with --execute flag to apply changes:');
    console.log('   npx tsx scripts/fix-session-years-2026.ts --execute\n');
    return;
  }

  // Execute updates
  console.log('\n🚀 Executing updates...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const session of sessions) {
    const oldDate = new Date(session.date_time);
    const newDate = new Date(oldDate);
    newDate.setFullYear(TARGET_YEAR);

    const { error: updateError } = await supabase
      .from('class_sessions')
      .update({ date_time: newDate.toISOString() })
      .eq('id', session.id);

    if (updateError) {
      console.error(`  ❌ Failed to update "${session.topic}":`, updateError.message);
      errorCount++;
    } else {
      console.log(`  ✅ Updated "${session.topic}"`);
      successCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} updated, ${errorCount} failed\n`);
}

fixSessionYears();

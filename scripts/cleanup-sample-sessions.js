/**
 * Cleanup Sample Sessions
 * Usage: node scripts/cleanup-sample-sessions.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://prmjdngeuczatlspinql.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWpkbmdldWN6YXRsc3BpbnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMDIxMywiZXhwIjoyMDgyNDA2MjEzfQ.8GsYBacv2iEOTYp6fl-yXK50GA5KG5b2TpwvnbdZD1Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function cleanup() {
  console.log('===========================================');
  console.log('CLEANUP SAMPLE DATA');
  console.log('===========================================\n');

  // 1. Check all sessions
  console.log('1. Checking all sessions...');
  const { data: sessions, error: sessionsError } = await supabase
    .from('class_sessions')
    .select('id, topic, location, date_time')
    .order('date_time', { ascending: false });

  if (sessionsError) {
    console.log('   ❌ Error:', sessionsError.message);
    return;
  }

  console.log('   Found', sessions.length, 'total sessions:');
  sessions.forEach(s => {
    console.log(`   - "${s.topic}" @ ${s.location}`);
  });

  // 2. Find sample sessions (containing "Sample" in topic or "SMA Negeri" in location)
  console.log('\n2. Identifying sample sessions...');
  const sampleSessions = sessions.filter(s =>
    s.topic?.toLowerCase().includes('sample') ||
    s.location?.includes('SMA Negeri')
  );

  console.log('   Found', sampleSessions.length, 'sample sessions to delete:');
  sampleSessions.forEach(s => {
    console.log(`   - [${s.id}] "${s.topic}" @ ${s.location}`);
  });

  if (sampleSessions.length === 0) {
    console.log('\n   No sample sessions to clean up!');
    return;
  }

  // 3. Delete sample sessions
  console.log('\n3. Deleting sample sessions...');
  const idsToDelete = sampleSessions.map(s => s.id);

  // First delete related session_reports
  console.log('   Deleting related session_reports...');
  const { error: reportsError } = await supabase
    .from('session_reports')
    .delete()
    .in('session_id', idsToDelete);

  if (reportsError) {
    console.log('   ⚠️ Reports error:', reportsError.message);
  } else {
    console.log('   ✅ Related reports deleted');
  }

  // Delete sessions
  console.log('   Deleting sessions...');
  const { error: deleteError } = await supabase
    .from('class_sessions')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.log('   ❌ Delete error:', deleteError.message);
  } else {
    console.log('   ✅ Sample sessions deleted');
  }

  // 4. Verify
  console.log('\n4. Verifying cleanup...');
  const { count } = await supabase
    .from('class_sessions')
    .select('*', { count: 'exact', head: true });

  console.log('   Remaining sessions:', count);

  console.log('\n===========================================');
  console.log('CLEANUP COMPLETE');
  console.log('===========================================');
}

cleanup().catch(console.error);

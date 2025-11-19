#!/usr/bin/env bun
/**
 * Database setup script for SurveyJS questionnaire system
 *
 * Usage:
 *   bun run setup-db           # Check status and guide you through setup
 *   bun run setup-db --check   # Just check if table exists
 *   bun run setup-db --reset   # Clear all data (keeps table structure)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_API_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTableExists(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('survey_responses')
      .select('id')
      .limit(1);

    // If no error or error is about empty result, table exists
    if (!error || error.code === 'PGRST116') {
      return true;
    }

    // Error code 42P01 means table doesn't exist
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      return false;
    }

    console.warn('⚠️  Unexpected error checking table:', error.message);
    return false;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function getTableStats(): Promise<void> {
  const { data, error, count } = await supabase
    .from('survey_responses')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error getting stats:', error.message);
    return;
  }

  console.log(`\n📊 Current Status:`);
  console.log(`   Total responses: ${count || 0}`);

  if (count && count > 0) {
    const { data: latest } = await supabase
      .from('survey_responses')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      console.log(`   Last response: ${new Date(latest.created_at).toLocaleString()}`);
    }
  }
}

async function clearAllData(): Promise<void> {
  console.log('⚠️  WARNING: This will delete all survey responses!');
  console.log('   The table structure will remain intact.');
  console.log('   Press Ctrl+C within 3 seconds to cancel...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🗑️  Deleting all responses...');

  const { error } = await supabase
    .from('survey_responses')
    .delete()
    .neq('id', 0); // Delete all rows

  if (error) {
    console.error('❌ Failed to delete responses:', error.message);
    process.exit(1);
  }

  console.log('✅ All responses deleted');
}

function printSetupInstructions(): void {
  console.log('\n📋 Setup Instructions:');
  console.log('\n1. Open your Supabase Dashboard:');
  console.log(`   ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}`);
  console.log('\n2. Navigate to: SQL Editor (left sidebar)');
  console.log('\n3. Click "New Query" and paste the contents of:');
  console.log('   supabase-schema.sql');
  console.log('\n4. Click "Run" or press Ctrl+Enter');
  console.log('\n5. Run this script again to verify: bun run setup-db');
  console.log('\nAlternatively, copy and run this SQL:\n');

  try {
    const sqlPath = join(import.meta.dir, '..', 'supabase-schema.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
  } catch (error) {
    console.log('   (SQL file not found at supabase-schema.sql)');
  }
}

async function main() {
  const args = Bun.argv.slice(2);
  const check = args.includes('--check');
  const reset = args.includes('--reset');

  console.log('🚀 SurveyJS Database Setup\n');

  // Check if table exists
  const exists = await checkTableExists();

  if (check) {
    console.log(exists ? '✅ Table exists' : '❌ Table does not exist');
    if (exists) {
      await getTableStats();
    }
    process.exit(exists ? 0 : 1);
  }

  if (reset) {
    if (!exists) {
      console.log('❌ Table does not exist. Nothing to reset.');
      console.log('   Run without --reset to get setup instructions.');
      process.exit(1);
    }

    await clearAllData();
    await getTableStats();
    return;
  }

  // Regular status check
  if (exists) {
    console.log('✅ Table "survey_responses" exists!');
    await getTableStats();
    console.log('\n✨ Database is ready to use!');
    console.log('\n📋 Available commands:');
    console.log('   bun run setup-db:check  - Check table status');
    console.log('   bun run setup-db:reset  - Clear all responses');
    console.log('   bun run dev             - Start the application');
  } else {
    console.log('❌ Table "survey_responses" does not exist yet.');
    printSetupInstructions();
  }
}

main().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});

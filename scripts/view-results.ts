#!/usr/bin/env bun
/**
 * View survey results from Supabase
 *
 * Usage:
 *   bun run view-results           # View all responses in a summary
 *   bun run view-results --latest  # Show only the latest response
 *   bun run view-results --json    # Output as JSON
 *   bun run view-results --id 1    # Show specific response by ID
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_API_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAllResponses(): Promise<any[]> {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching responses:', error.message);
    process.exit(1);
  }

  return data || [];
}

async function getResponseById(id: number): Promise<any> {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ Error fetching response:', error.message);
    process.exit(1);
  }

  return data;
}

function formatValue(value: any): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

function displayResponse(response: any, index?: number) {
  const header = index !== undefined
    ? `\n${'='.repeat(80)}\n📋 Response #${index + 1} (ID: ${response.id})`
    : `\n${'='.repeat(80)}\n📋 Response (ID: ${response.id})`;

  console.log(header);
  console.log(`🕐 Submitted: ${new Date(response.created_at).toLocaleString()}`);
  console.log('='.repeat(80));

  const data = response.data || response;
  const keys = Object.keys(data).sort();

  keys.forEach(key => {
    if (key === 'created_at' || key === 'id') return;

    const value = data[key];
    if (value === undefined || value === null || value === '') return;

    // Format key to be more readable
    const formattedKey = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    console.log(`\n${formattedKey}:`);
    console.log(`  ${formatValue(value)}`);
  });
}

function displaySummary(responses: any[]) {
  console.log('\n📊 Survey Results Summary');
  console.log('='.repeat(80));
  console.log(`Total responses: ${responses.length}`);

  if (responses.length === 0) {
    console.log('\nNo responses yet.');
    return;
  }

  console.log(`Latest response: ${new Date(responses[0].created_at).toLocaleString()}`);
  console.log(`Oldest response: ${new Date(responses[responses.length - 1].created_at).toLocaleString()}`);

  // Count responses by involvement level (if available)
  const involvementCounts: Record<string, number> = {};
  responses.forEach(r => {
    const level = r.data?.involvement_level;
    if (level) {
      involvementCounts[level] = (involvementCounts[level] || 0) + 1;
    }
  });

  if (Object.keys(involvementCounts).length > 0) {
    console.log('\n📈 Involvement Levels:');
    Object.entries(involvementCounts).forEach(([level, count]) => {
      console.log(`  ${level}: ${count}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 Use --latest to see the most recent response');
  console.log('💡 Use --json to export as JSON');
  console.log('💡 Use --id <num> to see a specific response');
}

async function main() {
  const args = Bun.argv.slice(2);
  const latest = args.includes('--latest');
  const json = args.includes('--json');
  const idIndex = args.indexOf('--id');
  const showId = idIndex !== -1 ? parseInt(args[idIndex + 1]) : null;

  if (showId) {
    const response = await getResponseById(showId);
    if (json) {
      console.log(JSON.stringify(response, null, 2));
    } else {
      displayResponse(response);
    }
    return;
  }

  const responses = await getAllResponses();

  if (json) {
    console.log(JSON.stringify(responses, null, 2));
    return;
  }

  if (latest && responses.length > 0) {
    displayResponse(responses[0], 0);
    return;
  }

  if (args.includes('--all')) {
    responses.forEach((response, index) => {
      displayResponse(response, index);
    });
    return;
  }

  // Default: show summary
  displaySummary(responses);
}

main().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});

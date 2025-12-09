#!/usr/bin/env bun
/**
 * Print all email addresses from survey responses
 *
 * Usage:
 *   bun run scripts/print-emails.ts
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

// Fetch all responses and extract emails
async function printEmails(): Promise<void> {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('data')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching responses:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No survey responses found.');
    return;
  }

  // Extract and deduplicate emails
  const emails = new Set<string>();

  for (const response of data) {
    const email = response.data?.contact;
    if (email) {
      emails.add(email);
    }
  }

  // Print all unique emails, one per line
  for (const email of emails) {
    console.log(email);
  }
}

printEmails().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

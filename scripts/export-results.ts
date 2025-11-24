#!/usr/bin/env bun
/**
 * Export survey results with filtering by email
 * Keeps only the newest response for each unique email address
 * Includes UI text labels for better LLM analysis
 *
 * Usage:
 *   bun run scripts/export-results.ts
 *   bun run scripts/export-results.ts --output results.json
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
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

// Load survey config to get UI text labels
function loadSurveyConfig(language: string = 'fi'): any {
  try {
    const configPath = join(import.meta.dir, '..', 'packages', 'survey', `survey-config.${language}.json`);
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return config;
  } catch (error) {
    console.error(`❌ Failed to load survey config for language '${language}':`, error);
    process.exit(1);
  }
}

// Build a map of question names to their config
function buildQuestionMap(config: any): Map<string, any> {
  const questionMap = new Map();

  if (config.pages) {
    for (const page of config.pages) {
      if (page.elements) {
        for (const element of page.elements) {
          questionMap.set(element.name, element);
        }
      }
    }
  }

  return questionMap;
}

// Get the display text for a choice value
function getChoiceText(question: any, value: any): any {
  if (!question.choices) return value;

  // Handle array values (checkbox)
  if (Array.isArray(value)) {
    return value.map(v => getChoiceText(question, v));
  }

  // Find the choice in the question config
  const choice = question.choices.find((c: any) => {
    const choiceValue = typeof c === 'object' ? c.value : c;
    return choiceValue === value;
  });

  if (choice) {
    return typeof choice === 'object' ? choice.text : choice;
  }

  return value;
}

// Transform response to include UI text labels
function enrichResponseData(data: any, questionMap: Map<string, any>): any {
  const enriched: any = {};

  for (const [key, value] of Object.entries(data)) {
    const question = questionMap.get(key);

    if (!question) {
      enriched[key] = value;
      continue;
    }

    // Store both the raw value and the display text
    enriched[key] = {
      value: value,
      label: question.title,
      displayValue: getChoiceText(question, value),
    };
  }

  return enriched;
}

// Fetch all responses from Supabase
async function fetchResponses(): Promise<any[]> {
  console.log('📥 Fetching survey responses from Supabase...');

  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching responses:', error);
    process.exit(1);
  }

  console.log(`✅ Found ${data?.length || 0} total responses`);
  return data || [];
}

// Filter to keep only the newest response per email
function filterNewestByEmail(responses: any[]): any[] {
  const emailMap = new Map<string, any>();

  for (const response of responses) {
    const email = response.data?.contact;

    if (!email) {
      console.warn(`⚠️  Response ${response.id} has no email, skipping`);
      continue;
    }

    // Check if we already have a response for this email
    const existing = emailMap.get(email);

    if (!existing) {
      emailMap.set(email, response);
    } else {
      // Compare timestamps and keep the newer one
      const existingDate = new Date(existing.created_at);
      const currentDate = new Date(response.created_at);

      if (currentDate > existingDate) {
        emailMap.set(email, response);
      }
    }
  }

  const filtered = Array.from(emailMap.values());
  console.log(`✅ Filtered to ${filtered.length} unique emails (newest responses only)`);

  return filtered;
}

// Main export function
async function exportResults(outputPath?: string, language: string = 'fi'): Promise<void> {
  // Load survey config
  const config = loadSurveyConfig(language);
  const questionMap = buildQuestionMap(config);

  // Fetch and filter responses
  const allResponses = await fetchResponses();
  const filteredResponses = filterNewestByEmail(allResponses);

  // Enrich responses with UI text labels
  console.log('🔄 Enriching responses with UI text labels...');
  const enrichedResponses = filteredResponses.map(response => ({
    id: response.id,
    created_at: response.created_at,
    data: enrichResponseData(response.data, questionMap),
  }));

  // Prepare output
  const output = {
    metadata: {
      exported_at: new Date().toISOString(),
      total_responses: allResponses.length,
      unique_emails: filteredResponses.length,
      survey_title: config.title,
    },
    responses: enrichedResponses,
  };

  // Write to file
  const defaultPath = `survey-results-${new Date().toISOString().split('T')[0]}.json`;
  const finalPath = outputPath || defaultPath;

  writeFileSync(finalPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log('\n✅ Export complete!');
  console.log(`📄 Saved to: ${finalPath}`);
  console.log(`📊 Total responses: ${allResponses.length}`);
  console.log(`👤 Unique participants: ${filteredResponses.length}`);
  console.log('\n💡 Tip: You can now pass this file to an LLM for analysis');
}

// Parse command line arguments
async function main() {
  const args = Bun.argv.slice(2);
  let outputPath: string | undefined;
  let language: string = 'fi';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--language' || args[i] === '-l') {
      language = args[i + 1];
      i++;
    }
  }

  await exportResults(outputPath, language);
}

main().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});

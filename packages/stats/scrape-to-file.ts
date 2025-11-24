#!/usr/bin/env bun
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { scrapeAuctionData, calculateTotal } from './scraper';

async function main() {
  console.log('Starting auction data scrape...');

  try {
    const properties = await scrapeAuctionData();
    const total = calculateTotal(properties);

    const data = {
      properties,
      total,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toLocaleString('fi-FI')
    };

    const outputPath = join(import.meta.dir, 'auction-data.json');
    await writeFile(outputPath, JSON.stringify(data, null, 2));

    console.log(`✅ Data saved to ${outputPath}`);
    console.log(`Total: ${total}€`);
    console.log(`Properties: ${properties.length}`);
  } catch (error) {
    console.error('❌ Error scraping data:', error);
    process.exit(1);
  }
}

main();

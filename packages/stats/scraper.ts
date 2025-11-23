interface PropertyData {
  id: string;
  propertyNumber: string;
  url: string;
  currentPrice: number;
  hasBids: boolean;
  status: string;
  auctionEnd?: string;
  minutesLeft?: number;
}

async function fetchPropertyPrice(url: string): Promise<{ currentPrice: number; hasBids: boolean; status: string; auctionEnd?: string; minutesLeft?: number }> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Extract data from embedded JSON in the page
    // The data is embedded in Next.js server-side rendered JSON
    // Note: quotes are escaped as \" in the HTML
    const highestBidMatch = html.match(/highestBid\\":(\d+)/);
    // Match auction end date - can have $D prefix or be plain ISO date
    // The date ends with \" (escaped quote in HTML)
    const auctionEndMatch = html.match(/auctionEnd\\":\\"(?:\$D)?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^"\\]*)\\/);

    let currentPrice = 0;
    if (highestBidMatch && highestBidMatch[1]) {
      currentPrice = parseInt(highestBidMatch[1], 10);
    }

    // Calculate time left
    let auctionEnd: string | undefined;
    let minutesLeft: number | undefined;
    if (auctionEndMatch && auctionEndMatch[1]) {
      auctionEnd = auctionEndMatch[1];
      // Parse the date - it's in ISO 8601 format with timezone
      // Example: "2025-11-23T14:05:19+02:00" or "2025-11-23T12:05:19.000Z"
      const endDate = new Date(auctionEnd);
      const now = new Date();
      const msLeft = endDate.getTime() - now.getTime();
      minutesLeft = Math.round(msLeft / (1000 * 60));
    }

    // Check for "Ei tarjouksia" (No bids)
    const hasBids = currentPrice > 0 || !html.includes('Ei tarjouksia');

    // Determine status
    let status = 'Active';
    if (html.includes('Päättynyt')) {
      status = 'Ended';
    }
    if (html.includes('tarkistetaan tarjouksia')) {
      status = 'Ended - Verifying bids';
    }

    // If we have minutesLeft and it's negative, mark as ended
    if (minutesLeft !== undefined && minutesLeft < 0) {
      status = 'Ended';
    }

    return {
      currentPrice,
      hasBids,
      status,
      auctionEnd,
      minutesLeft
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return { currentPrice: 0, hasBids: false, status: 'Error' };
  }
}

export async function scrapeAuctionData(): Promise<PropertyData[]> {
  const properties = [
    { id: '5811936', propertyNumber: '444-519-3-28' },
    { id: '5811954', propertyNumber: '444-519-2-104' },
    { id: '5811984', propertyNumber: '444-519-2-154' },
    { id: '5812020', propertyNumber: '444-519-2-155' },
    { id: '5812050', propertyNumber: '444-519-2-165' },
    { id: '5812083', propertyNumber: '444-519-2-168' },
    { id: '5812101', propertyNumber: '444-519-3-29' },
    { id: '5812110', propertyNumber: '444-519-3-18' },
  ];

  console.log(`[Scraper] Starting to scrape ${properties.length} properties...`);
  const results: PropertyData[] = [];
  let completed = 0;

  for (const prop of properties) {
    const url = `https://huutokaupat.com/kohde/${prop.id}`;
    console.log(`[Scraper] Fetching ${++completed}/${properties.length}: ${prop.propertyNumber} (ID: ${prop.id})`);

    const startTime = Date.now();
    const { currentPrice, hasBids, status, auctionEnd, minutesLeft } = await fetchPropertyPrice(url);
    const elapsed = Date.now() - startTime;

    console.log(`[Scraper]   ✓ ${prop.propertyNumber}: ${currentPrice}€, ${status} (${elapsed}ms)`);

    results.push({
      id: prop.id,
      propertyNumber: prop.propertyNumber,
      url,
      currentPrice,
      hasBids,
      status,
      auctionEnd,
      minutesLeft
    });

    // Small delay to be respectful to the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const total = calculateTotal(results);
  console.log(`[Scraper] ✅ Complete! Total: ${total}€`);
  return results;
}

export function calculateTotal(properties: PropertyData[]): number {
  return properties.reduce((sum, prop) => sum + prop.currentPrice, 0);
}

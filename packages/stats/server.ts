import indexHtml from "./index.html";
import { scrapeAuctionData, calculateTotal } from "./scraper";

const PORT = process.env.PORT || 3000;

console.log(`Starting server on http://localhost:${PORT}`);

Bun.serve({
  port: PORT,
  routes: {
    "/": indexHtml,
    "/api/properties": {
      GET: async () => {
        console.log("Fetching auction data...");
        const properties = await scrapeAuctionData();
        const total = calculateTotal(properties);

        return new Response(
          JSON.stringify({
            properties,
            total,
            timestamp: new Date().toISOString()
          }),
          {
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }
  },
  development: {
    hmr: true,
    console: true
  }
});

console.log(`Server running at http://localhost:${PORT}`);

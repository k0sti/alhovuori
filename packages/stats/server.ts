import { scrapeAuctionData, calculateTotal } from "./scraper";
import { join } from "path";

const PORT = process.env.PORT || 3000;

console.log(`Starting server on http://localhost:${PORT}`);

Bun.serve({
  port: PORT,
  idleTimeout: 30,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Serve index.html at root
    if (path === "/" || path === "/index.html") {
      const file = Bun.file(join(import.meta.dir, "index.html"));
      return new Response(file);
    }

    // API endpoint for live scraping
    if (path === "/api/properties") {
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

    // Serve static files (frontend.js, auction-data.json, etc.)
    const filePath = join(import.meta.dir, path.slice(1));
    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("Not Found", { status: 404 });
  },
  development: {
    hmr: true,
    console: true
  }
});

console.log(`Server running at http://localhost:${PORT}`);

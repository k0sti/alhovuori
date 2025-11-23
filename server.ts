import { join } from "path";
import { existsSync } from "fs";
import { scrapeAuctionData, calculateTotal } from "./packages/stats/scraper";

const PORT = process.env.PORT || 3000;

// Paths to built applications
const SURVEY_DIST = join(import.meta.dir, "packages/survey/dist");
const STATS_DIST = join(import.meta.dir, "packages/stats");

console.log(`Starting Alhovuori server on http://localhost:${PORT}`);
console.log(`Survey path: ${SURVEY_DIST}`);
console.log(`Stats path: ${STATS_DIST}`);

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Auction stats routes
    if (path === "/auction" || path.startsWith("/auction/")) {
      // Redirect /auction to /auction/ for proper relative paths
      if (path === "/auction") {
        return Response.redirect(new URL("/auction/", req.url), 301);
      }

      // Handle auction API
      if (path === "/auction/api/properties") {
        try {
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
        } catch (error) {
          console.error("Error fetching auction data:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch auction data" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }

      // Serve auction stats static files
      const statsPath = path.replace(/^\/auction\/?/, "");

      // For /auction/ root, serve index.html
      if (!statsPath || statsPath === "") {
        const indexFile = Bun.file(join(STATS_DIST, "index.html"));
        if (await indexFile.exists()) {
          return new Response(indexFile);
        }
        return new Response("Auction stats index.html not found", { status: 404 });
      }

      // For other files, serve them directly
      const filePath = join(STATS_DIST, statsPath);
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }

      // If file not found, return 404
      return new Response(`Auction file not found: ${statsPath}`, { status: 404 });
    }

    // Survey routes - serve at root
    // Handle asset requests
    if (path.startsWith("/assets/")) {
      const assetPath = join(SURVEY_DIST, path);
      const file = Bun.file(assetPath);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // Serve survey index.html for root and all other routes (SPA fallback)
    const indexFile = Bun.file(join(SURVEY_DIST, "index.html"));
    if (await indexFile.exists()) {
      return new Response(indexFile);
    }

    // 404 for other routes
    return new Response("Not Found", { status: 404 });
  },
  development: {
    hmr: true,
    console: true
  }
});

console.log(`✓ Server running at http://localhost:${PORT}`);
console.log(`  → Survey:  http://localhost:${PORT}/`);
console.log(`  → Auction: http://localhost:${PORT}/auction/`);

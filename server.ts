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

    // Stats routes
    if (path === "/stats" || path.startsWith("/stats/")) {
      // Redirect /stats to /stats/ for proper relative paths
      if (path === "/stats") {
        return Response.redirect(new URL("/stats/", req.url), 301);
      }

      // Handle stats API
      if (path === "/stats/api/properties") {
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

      // Serve stats static files
      const statsPath = path.replace(/^\/stats\/?/, "");

      // For /stats/ root, serve index.html
      if (!statsPath || statsPath === "") {
        const indexFile = Bun.file(join(STATS_DIST, "index.html"));
        if (await indexFile.exists()) {
          return new Response(indexFile);
        }
        return new Response("Stats index.html not found", { status: 404 });
      }

      // For other files, serve them directly
      const filePath = join(STATS_DIST, statsPath);
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }

      // If file not found, return 404
      return new Response(`Stats file not found: ${statsPath}`, { status: 404 });
    }

    // Survey routes
    if (path === "/survey" || path.startsWith("/survey/")) {
      // Redirect /survey to /survey/ for proper relative paths
      if (path === "/survey") {
        return Response.redirect(new URL("/survey/", req.url), 301);
      }

      // Remove /survey prefix for file lookup
      const surveyPath = path.replace(/^\/survey\/?/, "");

      // Handle asset requests
      if (surveyPath.startsWith("assets/")) {
        const assetPath = join(SURVEY_DIST, surveyPath);
        const file = Bun.file(assetPath);
        if (await file.exists()) {
          return new Response(file);
        }
      }

      // Serve index.html for all other survey routes
      const indexFile = Bun.file(join(SURVEY_DIST, "index.html"));
      if (await indexFile.exists()) {
        return new Response(indexFile);
      }

      return new Response("Survey not found. Did you build the survey package?", {
        status: 404
      });
    }

    // Root route - show available routes
    if (path === "/" || path === "") {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Alhovuori</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                max-width: 600px;
                margin: 80px auto;
                padding: 20px;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              h1 {
                color: #2d5016;
                margin-bottom: 30px;
              }
              a {
                display: block;
                padding: 15px 20px;
                margin: 10px 0;
                background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                color: white;
                text-decoration: none;
                border-radius: 6px;
                transition: transform 0.2s;
              }
              a:hover {
                transform: translateY(-2px);
              }
              p {
                color: #666;
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🏔️ Alhovuori</h1>
              <p>Welcome to the Alhovuori community project platform.</p>
              <a href="/survey/">📋 Survey / Kysely</a>
              <a href="/stats/">📊 Auction Stats / Huutokauppa</a>
            </div>
          </body>
        </html>
        `,
        {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        }
      );
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
console.log(`  → Survey:  http://localhost:${PORT}/survey/`);
console.log(`  → Stats:   http://localhost:${PORT}/stats/`);

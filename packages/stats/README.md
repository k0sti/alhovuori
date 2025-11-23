# Huutokaupat.com Price Tracker

Web application that collects and displays price information from huutokaupat.com auction listings.

## Features

- Scrapes current prices from 8 property auctions in Lohja Ikkalassa
- Displays data in a clean, responsive table
- Calculates total sum of all current prices
- Real-time refresh capability
- Shows auction status (Active/Ended)
- Links to individual auction pages

## Installation

```bash
bun install
```

## Usage

Start the development server:

```bash
bun run start
# or
bun run dev
```

The server will start on port 3000 (or 3001 if 3000 is in use).

Visit `http://localhost:3001` in your browser to view the auction tracker.

## API Endpoints

- `GET /` - Web interface
- `GET /api/properties` - JSON API returning property data and total sum

## Project Structure

- `server.ts` - Bun web server with API routes
- `scraper.ts` - Auction data scraping logic
- `index.html` - Web interface HTML
- `frontend.ts` - Client-side JavaScript for data display

## How It Works

1. Server fetches the main auction page to identify individual property auctions
2. For each property, it scrapes the current price and status
3. Data is cached and served via API endpoint
4. Frontend displays the data in a formatted table with automatic refresh

## Monitored Auctions

The app tracks 8 properties from auction lot #5812149:
- Property 444-519-3-28 (Item #5811936)
- Property 444-519-2-104 (Item #5811954)
- Property 444-519-2-154 (Item #5811984)
- Property 444-519-2-155 (Item #5812020)
- Property 444-519-2-165 (Item #5812050)
- Property 444-519-2-168 (Item #5812083)
- Property 444-519-3-29 (Item #5812101)
- Property 444-519-3-18 (Item #5812110)

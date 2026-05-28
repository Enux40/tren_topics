# Trendy Topics

A real-time dashboard that tracks trending topics across the internet by aggregating data from multiple sources.

🌐 **Live demo:** [trendy-topics.vercel.app](https://trendy-topics.vercel.app)

## Features

- **Multi-source aggregation** — Combines trends from Reddit, GitHub, and HackerNews
- **Real-time updates** — Auto-refreshes every 2 minutes on the frontend
- **Filter & search** — Filter by source or search across all trends
- **Score-based ranking** — Each trend is scored by engagement metrics
- **Responsive design** — Works on desktop and mobile

## Data Sources

| Source | Method | API Key Required? |
|--------|--------|-------------------|
| Reddit | Official JSON API (`/r/popular`, `/r/all`, `/r/news`) | No |
| GitHub | Scraped from `github.com/trending` | No |
| HackerNews | Firebase API for top stories | No |

## Quick Start (Local)

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Visit `http://localhost:3000` in your browser.

## Deploy to Vercel

The easiest way to deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FEnux40%2Ftren_topics)

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

The project is already configured with:
- **`vercel.json`** — Routing, cron jobs, and function settings
- **`api/index.js`** — Express app adapted for serverless runtime
- **Vercel Cron Job** — Automatically refreshes trends every 10 minutes (via `POST /api/refresh`)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEWS_API_KEY` | No | NewsAPI.org key for enhanced news coverage |

Get a free key at [newsapi.org/register](https://newsapi.org/register).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/trends` | Get cached trending topics |
| `POST` | `/api/refresh` | Force refresh all sources (used by Vercel Cron) |
| `GET` | `/api/health` | Health check and stats |

## Tech Stack

- **Backend:** Node.js, Express
- **Data:** Axios, Cheerio
- **Frontend:** Vanilla JS, CSS with dark theme
- **Hosting:** Vercel (serverless + cron jobs)

## License

MIT

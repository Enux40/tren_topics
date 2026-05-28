# Trendy Topics

A real-time dashboard that tracks trending topics across the internet by aggregating data from multiple sources.

🌐 **Live demo:** [trendy-topics.netlify.app](https://trendy-topics.netlify.app)

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

## Deploy to Netlify

The easiest way to deploy:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Enux40/tren_topics)

### Manual Deploy

1. Push the repo to GitHub
2. Log in to [Netlify](https://app.netlify.com)
3. Click **"Add new site" → "Import an existing project"**
4. Connect your GitHub repo
5. Netlify auto-detects the config from `netlify.toml` — just click **"Deploy"**

The project is already configured with:
- **`netlify.toml`** — Build settings, redirects, and function routing
- **`netlify/functions/api.js`** — Express app wrapped with `serverless-http`
- **Netlify Functions** — API routes run as serverless functions

### Scheduled Refresh

To keep the cache warm, set up a Netlify scheduled function or use a free cron service (like cron-job.org) to hit `POST https://your-site.netlify.app/api/refresh` every 10 minutes.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEWS_API_KEY` | No | NewsAPI.org key for enhanced news coverage |

Get a free key at [newsapi.org/register](https://newsapi.org/register).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/trends` | Get cached trending topics |
| `POST` | `/api/refresh` | Force refresh all sources |
| `GET` | `/api/health` | Health check and stats |

## Tech Stack

- **Backend:** Node.js, Express
- **Data:** Axios, Cheerio
- **Frontend:** Vanilla JS, CSS with dark theme
- **Hosting:** Netlify (serverless functions + static hosting)

## License

MIT

# Trendy Topics

A real-time dashboard that tracks trending topics across the internet by aggregating data from multiple sources.

## Features

- **Multi-source aggregation**: Combines trends from Reddit, GitHub, and News sources
- **Real-time updates**: Auto-refreshes every 2 minutes
- **Filter & search**: Filter by source or search across all trends
- **Score-based ranking**: Each trend is scored by engagement metrics
- **Responsive design**: Works on desktop and mobile

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Visit `http://localhost:3000` in your browser.

## Data Sources

| Source | Method | Requires API Key? |
|--------|--------|-------------------|
| Reddit | Official JSON API | No |
| GitHub | Scraped from github.com/trending | No |
| News | RSS feeds (BBC, HackerNews, Reuters) | No |

For enhanced news coverage, optionally set a NewsAPI key:

```bash
cp .env.example .env
# Edit .env and add your NEWS_API_KEY
```

Get a free API key at [newsapi.org/register](https://newsapi.org/register).

## API Endpoints

- `GET /api/trends` — Get cached trending topics
- `POST /api/refresh` — Force refresh all sources
- `GET /api/health` — Health check and stats

## Tech Stack

- **Backend**: Node.js, Express
- **Data**: Axios, Cheerio (for scraping)
- **Frontend**: Vanilla JS, CSS with modern dark theme
- **Scheduling**: node-cron (auto-refresh every 10 minutes)

## License

MIT

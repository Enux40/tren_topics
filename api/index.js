const express = require('express');
const cors = require('cors');
const path = require('path');

const redditService = require('../services/reddit');
const githubService = require('../services/github');
const newsService = require('../services/news');

const app = express();

// Cache for storing trending data (lives within warm serverless instance)
let cache = {
  data: null,
  lastUpdated: null,
  isUpdating: false
};

app.use(cors());
app.use(express.json());

// Serve static files from public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// Aggregate all trending sources
async function fetchAllTrends() {
  if (cache.isUpdating) return cache.data;
  cache.isUpdating = true;

  try {
    const [reddit, github, news] = await Promise.allSettled([
      redditService.fetchTrending(),
      githubService.fetchTrending(),
      newsService.fetchTrending()
    ]);

    const allTrends = [];

    if (reddit.status === 'fulfilled' && reddit.value) {
      allTrends.push(...reddit.value);
    }
    if (github.status === 'fulfilled' && github.value) {
      allTrends.push(...github.value);
    }
    if (news.status === 'fulfilled' && news.value) {
      allTrends.push(...news.value);
    }

    // Deduplicate by normalizing topic names
    const seen = new Set();
    const deduped = [];
    for (const item of allTrends) {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }

    // Sort by trend score (descending)
    deduped.sort((a, b) => (b.score || 0) - (a.score || 0));

    cache.data = {
      trends: deduped.slice(0, 100),
      sources: {
        reddit: reddit.status === 'fulfilled',
        github: github.status === 'fulfilled',
        news: news.status === 'fulfilled'
      },
      totalFetched: allTrends.length,
      errors: [
        reddit.status === 'rejected' ? 'Reddit: ' + (reddit.reason?.message || 'Failed') : null,
        github.status === 'rejected' ? 'GitHub: ' + (github.reason?.message || 'Failed') : null,
        news.status === 'rejected' ? 'News: ' + (news.reason?.message || 'Failed') : null,
      ].filter(Boolean)
    };
    cache.lastUpdated = new Date().toISOString();
  } catch (err) {
    console.error('Fatal error fetching trends:', err);
  } finally {
    cache.isUpdating = false;
  }

  return cache.data;
}

// API endpoint to get trending topics
app.get('/api/trends', async (req, res) => {
  try {
    if (cache.data && cache.lastUpdated) {
      const age = Date.now() - new Date(cache.lastUpdated).getTime();
      if (age < 5 * 60 * 1000) {
        return res.json({
          ...cache.data,
          lastUpdated: cache.lastUpdated,
          cached: true
        });
      }
    }

    const data = await fetchAllTrends();
    res.json({
      ...data,
      lastUpdated: cache.lastUpdated,
      cached: false
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch trends',
      message: err.message
    });
  }
});

// Force refresh endpoint (called by Vercel Cron Jobs)
app.post('/api/refresh', async (req, res) => {
  const data = await fetchAllTrends();
  res.json({
    ...data,
    lastUpdated: cache.lastUpdated,
    cached: false
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    lastUpdated: cache.lastUpdated,
    trendCount: cache.data?.trends?.length || 0,
    sources: cache.data?.sources || {}
  });
});

// Warm the cache on first invocation (won't slow the response)
app.use((req, res, next) => {
  if (!cache.lastUpdated) {
    fetchAllTrends().catch(err => console.error('Warm fetch error:', err));
  }
  next();
});

// Export for Vercel serverless runtime
module.exports = app;

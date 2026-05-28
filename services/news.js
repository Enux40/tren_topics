const axios = require('axios');

let cachedData = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchTrending() {
  const now = Date.now();
  if (cachedData && (now - lastFetch) < CACHE_TTL) {
    return cachedData;
  }

  try {
    const results = [];

    // HackerNews: uses a simple JSON API, no parsing needed
    try {
      // Get top stories IDs
      const topRes = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json', {
        timeout: 8000
      });
      const topIds = topRes.data.slice(0, 15);
      
      // Fetch details for each story
      const storyPromises = topIds.map(id =>
        axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          timeout: 5000
        }).then(r => r.data).catch(() => null)
      );
      const stories = (await Promise.all(storyPromises)).filter(Boolean);

      for (const story of stories) {
        if (story && story.title) {
          results.push({
            id: `hn-${story.id}`,
            title: story.title,
            description: story.url 
              ? `Score: ${story.score || 0} | Comments: ${story.descendants || 0}`
              : 'Discussion on Hacker News',
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            source: 'news',
            sourceLabel: 'HackerNews',
            score: (story.score || 0) + (story.descendants || 0) * 2,
            metadata: {
              sourceName: 'HackerNews',
              score: story.score,
              comments: story.descendants
            },
            trendingAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('HackerNews fetch error:', err.message);
    }

    cachedData = results;
    lastFetch = Date.now();
    return results;
  } catch (err) {
    console.error('News fetch error:', err.message);
    if (cachedData) return cachedData;
    return [];
  }
}

module.exports = { fetchTrending };

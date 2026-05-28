const axios = require('axios');

// Cache for reddit data
let cachedData = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchTrending() {
  const now = Date.now();
  if (cachedData && (now - lastFetch) < CACHE_TTL) {
    return cachedData;
  }

  try {
    // Fetch trending from multiple subreddits
    const subreddits = ['popular', 'all', 'news'];
    const requests = subreddits.map(sub =>
      axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=25`, {
        headers: {
          'User-Agent': 'TrendyTopics/1.0 (global trend tracker)',
          'Accept': 'application/json'
        },
        timeout: 10000
      }).then(res => res.data.data.children.map(child => child.data))
    );

    const results = await Promise.allSettled(requests);
    const posts = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        posts.push(...result.value);
      }
    }

    // Deduplicate by post ID
    const seen = new Set();
    const uniquePosts = [];
    for (const post of posts) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        uniquePosts.push(post);
      }
    }

    // Transform to common format
    const trends = uniquePosts
      .filter(post => !post.stickied && post.title)
      .map(post => ({
        id: `reddit-${post.id}`,
        title: post.title,
        description: post.selftext ? post.selftext.slice(0, 200) : `Posted by u/${post.author} in r/${post.subreddit}`,
        url: `https://reddit.com${post.permalink}`,
        source: 'reddit',
        sourceLabel: `r/${post.subreddit}`,
        score: Math.round((post.ups || 0) + (post.num_comments || 0) * 2),
        metadata: {
          upvotes: post.ups || 0,
          comments: post.num_comments || 0,
          subreddit: post.subreddit,
          author: post.author,
          created: new Date(post.created_utc * 1000).toISOString()
        },
        trendingAt: new Date().toISOString()
      }));

    cachedData = trends;
    lastFetch = Date.now();
    return trends;
  } catch (err) {
    console.error('Reddit fetch error:', err.message);
    // Return stale cache if available
    if (cachedData) return cachedData;
    throw err;
  }
}

module.exports = { fetchTrending };

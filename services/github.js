const axios = require('axios');
const cheerio = require('cheerio');

let cachedData = null;
let lastFetch = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchTrending() {
  const now = Date.now();
  if (cachedData && (now - lastFetch) < CACHE_TTL) {
    return cachedData;
  }

  try {
    const response = await axios.get('https://github.com/trending', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrendyTopics/1.0)',
        'Accept': 'text/html'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const repos = [];

    $('article.Box-row').each((i, el) => {
      const $el = $(el);
      const titleEl = $el.find('h2 a');
      const fullName = titleEl.text().trim().replace(/\s+/g, '');
      const [owner, repo] = fullName.split('/').map(s => s.trim());
      
      const description = $el.find('p').text().trim();
      const language = $el.find('[itemprop="programmingLanguage"]').text().trim();
      const stars = parseInt($el.find('.octicon-star').parent().text().trim().replace(/,/g, '')) || 0;
      const forks = parseInt($el.find('.octicon-repo-forked').parent().text().trim().replace(/,/g, '')) || 0;
      const todayStarsText = $el.find('.float-sm-right').text().trim();
      const todayStars = parseInt(todayStarsText.match(/(\d+)/)?.[1] || '0');

      if (fullName) {
        repos.push({
          id: `github-${fullName}`,
          title: `${owner}/${repo}`,
          description: description || `${repo} - A trending repository on GitHub`,
          url: `https://github.com/${fullName}`,
          source: 'github',
          sourceLabel: `GitHub ${language ? '(' + language + ')' : ''}`,
          score: stars + todayStars * 100,
          metadata: {
            owner,
            repo,
            stars,
            forks,
            todayStars,
            language: language || 'Unknown'
          },
          trendingAt: new Date().toISOString()
        });
      }
    });

    cachedData = repos;
    lastFetch = Date.now();
    return repos;
  } catch (err) {
    console.error('GitHub fetch error:', err.message);
    if (cachedData) return cachedData;
    throw err;
  }
}

module.exports = { fetchTrending };

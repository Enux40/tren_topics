require('dotenv').config();
const { app, fetchAllTrends, cache } = require('./app');

const PORT = process.env.PORT || 3000;

// Auto-refresh every 10 minutes (local only)
setInterval(() => {
  console.log('[Auto-refresh] Refreshing trends...');
  fetchAllTrends().then(() => console.log('[Auto-refresh] Done at', cache.lastUpdated));
}, 10 * 60 * 1000);

// Initial fetch
console.log('[Startup] Fetching initial trends...');
fetchAllTrends().then(() => {
  console.log('[Startup] Initial trends loaded at', cache.lastUpdated);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Trendy Topics running at http://0.0.0.0:${PORT}`);
});

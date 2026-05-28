(function() {
  'use strict';

  const state = {
    trends: [],
    filter: 'all',
    search: '',
    loading: false
  };

  const elements = {
    trendsGrid: document.getElementById('trendsGrid'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    errorsSection: document.getElementById('errorsSection'),
    errorDetails: document.getElementById('errorDetails'),
    statusText: document.getElementById('statusText'),
    statusBadge: document.getElementById('statusBadge'),
    refreshBtn: document.getElementById('refreshBtn'),
    searchInput: document.getElementById('searchInput'),
    statTotal: document.getElementById('statTotal'),
    statSources: document.getElementById('statSources'),
    statUpdated: document.getElementById('statUpdated'),
    filterBtns: document.querySelectorAll('.filter-btn'),
  };

  // === Helpers ===
  function formatTimeAgo(dateStr) {
    const now = Date.now();
    const date = new Date(dateStr);
    const diff = now - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function getSourceColor(source) {
    switch (source) {
      case 'reddit': return 'var(--accent-reddit)';
      case 'github': return 'var(--accent-github)';
      case 'news': return 'var(--accent-news)';
      default: return 'var(--accent-default)';
    }
  }

  function getSourceLabel(item) {
    return item.sourceLabel || item.source.charAt(0).toUpperCase() + item.source.slice(1);
  }

  function getScorePercent(score) {
    const maxScore = Math.max(...state.trends.map(t => t.score || 0), 1);
    return Math.max(3, (score / maxScore) * 100);
  }

  // === Rendering ===
  function renderTrends() {
    const { trends, filter, search } = state;

    let filtered = trends;

    if (filter !== 'all') {
      filtered = filtered.filter(t => t.source === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.sourceLabel || '').toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      elements.trendsGrid.innerHTML = '';
      elements.loadingState.style.display = 'none';
      elements.emptyState.style.display = 'flex';
      return;
    }

    elements.emptyState.style.display = 'none';
    elements.trendsGrid.innerHTML = filtered.map((item, index) => {
      const scorePct = getScorePercent(item.score || 0);
      const sourceColor = getSourceColor(item.source);
      const sourceLabel = getSourceLabel(item);

      let metaHtml = '';
      if (item.source === 'reddit') {
        metaHtml = `
          <span>&#9650; ${formatNumber(item.metadata?.upvotes)}</span>
          <span>&#128172; ${formatNumber(item.metadata?.comments)}</span>
        `;
      } else if (item.source === 'github') {
        metaHtml = `
          <span>&#9733; ${formatNumber(item.metadata?.stars)}</span>
          <span>&#128196; ${item.metadata?.language || ''}</span>
        `;
      } else if (item.source === 'news') {
        metaHtml = `
          <span>&#128240; ${item.metadata?.sourceName || ''}</span>
        `;
      }

      return `
        <div class="trend-card source-${item.source}" style="animation-delay: ${(index % 12) * 0.03}s"
             onclick="window.open('${item.url}', '_blank')" title="${item.title.replace(/"/g, '&quot;')}">
          <div class="trend-card-header">
            <div class="trend-card-title">${item.title}</div>
            <span class="trend-card-source">${sourceLabel}</span>
          </div>
          ${item.description ? `<div class="trend-card-description">${item.description}</div>` : ''}
          <div class="trend-card-footer">
            <div class="trend-card-meta">${metaHtml}</div>
            <div class="trend-card-score" style="color: ${sourceColor}">
              ${item.score || 0}
              <div class="score-bar">
                <div class="score-bar-fill" style="width: ${scorePct}%; background: ${sourceColor}"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // === Data Fetching ===
  async function fetchTrends(isRefresh = false) {
    if (state.loading) return;
    state.loading = true;

    elements.loadingState.style.display = 'flex';
    elements.loadingState.querySelector('p').textContent = isRefresh
      ? 'Refreshing trends...'
      : 'Fetching global trending topics...';
    elements.trendsGrid.innerHTML = '';
    elements.emptyState.style.display = 'none';
    elements.errorsSection.style.display = 'none';
    elements.refreshBtn.classList.add('loading');
    elements.statusText.textContent = 'Updating...';

    try {
      const url = isRefresh ? '/api/refresh' : '/api/trends';
      const res = await fetch(url, {
        method: isRefresh ? 'POST' : 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data = await res.json();

      // Update state
      state.trends = data.trends || [];

      // Update stats
      const sourceCount = Object.values(data.sources || {}).filter(Boolean).length;
      elements.statTotal.querySelector('.stat-value').textContent = state.trends.length;
      elements.statSources.querySelector('.stat-value').textContent = sourceCount;
      elements.statUpdated.querySelector('.stat-value').textContent = data.lastUpdated
        ? formatTimeAgo(data.lastUpdated)
        : '--';

      // Update status
      elements.statusText.textContent = data.lastUpdated
        ? `Updated ${formatTimeAgo(data.lastUpdated)}`
        : 'Ready';

      // Show errors
      if (data.errors && data.errors.length > 0) {
        elements.errorsSection.style.display = 'block';
        elements.errorDetails.textContent = data.errors.join(' • ');
      } else {
        elements.errorsSection.style.display = 'none';
      }

      renderTrends();
    } catch (err) {
      console.error('Fetch error:', err);
      elements.statusText.textContent = 'Error';
      elements.statusText.style.color = '#ef4444';

      // Show error in grid
      elements.loadingState.style.display = 'none';
      elements.trendsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">&#9888;</div>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Failed to load trends</h3>
          <p>${err.message}. Make sure the server is running.</p>
          <button class="btn" style="margin-top: 1rem;" onclick="location.reload()">Retry</button>
        </div>
      `;
    } finally {
      state.loading = false;
      elements.loadingState.style.display = 'none';
      elements.refreshBtn.classList.remove('loading');
    }
  }

  // === Event Handlers ===
  elements.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderTrends();
    });
  });

  elements.searchInput.addEventListener('input', (e) => {
    state.search = e.target.value;
    renderTrends();
  });

  elements.refreshBtn.addEventListener('click', () => fetchTrends(true));

  // Auto-refresh every 2 minutes
  setInterval(() => fetchTrends(false), 120000);

  // Initial load
  fetchTrends(false);
})();

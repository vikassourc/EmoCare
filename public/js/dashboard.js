/**
 * EmoCare Dashboard Module
 * Fetches real data from backend API endpoints
 * Renders stats, mood chart, triggers, insights, recommendations
 */

const Dashboard = (() => {
  // ── DOM Helpers ───────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    const authed = await Auth.requireAuth();
    if (!authed) return;

    // Set date
    const now = new Date();
    const dateEl = el('dashDate');
    if (dateEl) {
      dateEl.textContent = 'Week of ' + now.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    // Show loading skeletons
    showSkeletons();

    // Fetch all data in parallel
    await fetchAllData();

    // Bind AI analysis button
    const analysisBtn = document.querySelector('[onclick="generateAIAnalysis()"]');
    if (analysisBtn) {
      analysisBtn.removeAttribute('onclick');
      analysisBtn.addEventListener('click', generateAIAnalysis);
    }

    // Also try a more generic selector
    document.querySelectorAll('.btn-primary.btn-lg').forEach(btn => {
      if (btn.textContent.includes('AI Emotional Analysis')) {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', generateAIAnalysis);
      }
    });
  }

  // ── Fetch All Data ────────────────────────────────────────
  async function fetchAllData() {
    try {
      const [statsRes, chartRes, triggersRes, recsRes] = await Promise.allSettled([
        API.getDashboardStats(),
        API.getMoodChart(),
        API.getTriggers(),
        API.getRecommendations()
      ]);

      if (statsRes.status === 'fulfilled') {
        renderStats(statsRes.value);
      } else {
        renderStatsEmpty();
      }

      if (chartRes.status === 'fulfilled') {
        renderMoodChart(chartRes.value);
      } else {
        renderMoodChartEmpty();
      }

      if (triggersRes.status === 'fulfilled') {
        renderTriggers(triggersRes.value);
      } else {
        renderTriggersEmpty();
      }

      if (recsRes.status === 'fulfilled') {
        renderRecommendations(recsRes.value);
      } else {
        renderRecommendationsDefault();
      }

      // Fetch recent insights from mood entries
      try {
        const moodData = await API.getMoodStats();
        renderInsights(moodData);
      } catch {
        renderInsightsEmpty();
      }

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      if (typeof showError === 'function') showError('Failed to load dashboard data');
    }
  }

  // ── Loading Skeletons ─────────────────────────────────────
  function showSkeletons() {
    // Stat cards
    ['statSessions', 'statMood', 'statStreak', 'statJournal'].forEach(id => {
      const card = el(id);
      if (card) card.innerHTML = '<div class="skeleton skeleton-text" style="width:60px;height:36px;"></div>';
    });

    // Chart
    const chart = el('moodChart');
    if (chart) {
      chart.innerHTML = Array(7).fill('').map(() =>
        '<div class="mood-bar-wrap"><div class="skeleton" style="width:100%;height:60px;border-radius:6px;"></div><span class="mood-bar-label">—</span></div>'
      ).join('');
    }

    // Triggers
    const triggers = el('triggerList');
    if (triggers) {
      triggers.innerHTML = Array(4).fill('').map(() =>
        '<div class="trigger-item"><span class="skeleton skeleton-text" style="width:80px;"></span><div class="trigger-bar-bg"><div class="skeleton" style="width:60%;height:100%;"></div></div></div>'
      ).join('');
    }

    // Insights
    const insights = el('insightList');
    if (insights) {
      insights.innerHTML = Array(3).fill('').map(() =>
        '<div class="insight-item"><div class="skeleton skeleton-text" style="width:80%;"></div><div class="skeleton skeleton-text" style="width:60%;"></div></div>'
      ).join('');
    }

    // Recommendations
    const recs = el('recGrid');
    if (recs) {
      recs.innerHTML = Array(4).fill('').map(() =>
        '<div class="skeleton skeleton-card"></div>'
      ).join('');
    }
  }

  // ── Render Stats ──────────────────────────────────────────
  function renderStats(data) {
    const stats = data.stats || data;

    const sessionsEl = el('statSessions');
    if (sessionsEl) sessionsEl.textContent = stats.sessionsThisWeek ?? stats.sessions ?? '0';

    const moodEl = el('statMood');
    if (moodEl) moodEl.textContent = stats.avgMood ?? stats.averageMood ?? '—';

    const streakEl = el('statStreak');
    if (streakEl) streakEl.textContent = stats.streak ?? stats.dayStreak ?? '0';

    const journalEl = el('statJournal');
    if (journalEl) journalEl.textContent = stats.journalEntries ?? stats.journals ?? '0';

    // Update sub-text if available
    if (stats.sessionChange !== undefined) {
      const sub = sessionsEl?.closest('.dash-card')?.querySelector('.dash-card-sub');
      if (sub) sub.textContent = `${stats.sessionChange >= 0 ? '+' : ''}${stats.sessionChange} from last week`;
    }
  }

  function renderStatsEmpty() {
    ['statSessions', 'statMood', 'statStreak', 'statJournal'].forEach(id => {
      const card = el(id);
      if (card) card.textContent = '0';
    });
  }

  // ── Render Mood Chart ─────────────────────────────────────
  function renderMoodChart(data) {
    const chartData = data.chart || data.data || data;
    const container = el('moodChart');
    if (!container) return;
    container.innerHTML = '';

    if (!chartData || !chartData.length) {
      renderMoodChartEmpty();
      return;
    }

    const maxScore = 10;
    const maxHeight = 100;

    chartData.forEach(item => {
      const day = item.day || item.label || item.date;
      const score = item.score || item.value || item.mood || 0;
      const height = Math.round((score / maxScore) * maxHeight);
      const cls = score >= 7 ? 'good' : score >= 5 ? 'medium' : 'low';

      const wrap = document.createElement('div');
      wrap.className = 'mood-bar-wrap';
      wrap.innerHTML = `
        <div class="mood-bar-fill ${cls}" style="height:${height}px;" title="${day}: ${score}/10"></div>
        <span class="mood-bar-label">${day}</span>`;
      container.appendChild(wrap);
    });
  }

  function renderMoodChartEmpty() {
    const container = el('moodChart');
    if (!container) return;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    container.innerHTML = days.map(day =>
      `<div class="mood-bar-wrap">
        <div class="mood-bar-fill" style="height:10px;background:var(--cream-dark);"></div>
        <span class="mood-bar-label">${day}</span>
      </div>`
    ).join('');
  }

  // ── Render Triggers ───────────────────────────────────────
  function renderTriggers(data) {
    const triggers = data.triggers || data || [];
    const list = el('triggerList');
    if (!list) return;

    if (!triggers.length) {
      renderTriggersEmpty();
      return;
    }

    list.innerHTML = triggers.map(t => `
      <div class="trigger-item">
        <span class="trigger-name">${escapeHtml(t.name || t.trigger)}</span>
        <div class="trigger-bar-bg">
          <div class="trigger-bar-fill" style="width:${t.pct || t.percentage || 0}%"></div>
        </div>
        <span class="trigger-pct">${t.pct || t.percentage || 0}%</span>
      </div>`).join('');
  }

  function renderTriggersEmpty() {
    const list = el('triggerList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-soft);font-size:13px;">No triggers detected yet. Keep chatting to build insights.</div>';
  }

  // ── Render Insights ───────────────────────────────────────
  function renderInsights(data) {
    const insights = data.insights || data.recentMoods || data.moods || [];
    const container = el('insightList');
    if (!container) return;

    if (!insights || !insights.length) {
      renderInsightsEmpty();
      return;
    }

    const items = Array.isArray(insights) ? insights.slice(0, 5) : [];
    container.innerHTML = items.map(item => `
      <div class="insight-item">
        <div class="insight-item-title">${escapeHtml(item.title || item.emotion || 'Insight')}</div>
        <div class="insight-item-sub">${escapeHtml(item.sub || item.description || item.date || '')}</div>
      </div>`).join('');
  }

  function renderInsightsEmpty() {
    const container = el('insightList');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-soft);font-size:13px;">No insights yet. Log some moods to see patterns.</div>';
  }

  // ── Render Recommendations ────────────────────────────────
  function renderRecommendations(data) {
    const recs = data.recommendations || data || [];
    const grid = el('recGrid');
    if (!grid) return;

    if (!recs.length) {
      renderRecommendationsDefault();
      return;
    }

    grid.innerHTML = recs.map(r => `
      <div class="rec-card">
        <div class="rec-card-icon">${r.icon || '🌱'}</div>
        <div class="rec-card-title">${escapeHtml(r.title || r.name)}</div>
        <div class="rec-card-desc">${escapeHtml(r.desc || r.description)}</div>
      </div>`).join('');
  }

  function renderRecommendationsDefault() {
    const recs = [
      { icon: '🧘', title: '5-min breathing', desc: 'Box breathing for 5 minutes each morning to reduce anxiety.' },
      { icon: '📓', title: 'Evening journal', desc: 'Write 3 things you\'re grateful for before sleep.' },
      { icon: '🚶', title: '20-min walk', desc: 'A daily walk reduces cortisol and improves mood significantly.' },
      { icon: '📵', title: 'Phone-free hour', desc: 'Disconnect for 1 hour before bed to improve sleep quality.' },
    ];
    const grid = el('recGrid');
    if (!grid) return;
    grid.innerHTML = recs.map(r => `
      <div class="rec-card">
        <div class="rec-card-icon">${r.icon}</div>
        <div class="rec-card-title">${r.title}</div>
        <div class="rec-card-desc">${r.desc}</div>
      </div>`).join('');
  }

  // ── AI Analysis ───────────────────────────────────────────
  async function generateAIAnalysis() {
    const card = el('aiAnalysisCard');
    const content = el('aiAnalysisContent');
    if (!card || !content) return;

    card.classList.remove('hidden');
    content.innerHTML = '<div class="skeleton skeleton-text" style="width:100%;"></div><div class="skeleton skeleton-text" style="width:90%;"></div><div class="skeleton skeleton-text" style="width:95%;"></div><div class="skeleton skeleton-text" style="width:80%;"></div>';
    card.scrollIntoView({ behavior: 'smooth' });

    try {
      const data = await API.generateAnalysis();
      const text = data.analysis || data.content || data.text || 'Analysis complete.';
      content.innerHTML = text.replace(/\n\n/g, '</p><p style="margin-top:14px;">').replace(/^/, '<p>').replace(/$/, '</p>');
      if (typeof showSuccess === 'function') showSuccess('Analysis generated');
    } catch (err) {
      content.textContent = 'Unable to generate analysis right now. Please try again later.';
      if (typeof showError === 'function') showError(err.message || 'Analysis failed');
    }
  }

  // ── Utilities ─────────────────────────────────────────────
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Auto-init ─────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose globally for inline onclick fallback
  window.generateAIAnalysis = generateAIAnalysis;

  return {
    fetchAllData,
    generateAIAnalysis
  };
})();

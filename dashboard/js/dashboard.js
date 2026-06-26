const BUDGET_BY_CATEGORY = {
  all: { label: 'All categories', spent: 349132, limit: 450000 },
  food: { label: 'Food & groceries', spent: 4888, limit: 25000 },
  transport: { label: 'Transport', spent: 3200, limit: 12000 },
  bills: { label: 'Bills & utilities', spent: 6972, limit: 15000 },
  entertainment: { label: 'Entertainment', spent: 895, limit: 5000 },
  health: { label: 'Health', spent: 2100, limit: 8000 },
  savings: { label: 'Savings & investments', spent: 62000, limit: 80000 },
};

function formatPeso(n) {
  return (
    '₱' +
    Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

function applyBudgetCategory(key) {
  const data = BUDGET_BY_CATEGORY[key] || BUDGET_BY_CATEGORY.all;
  const spent = data.spent;
  const limit = data.limit;
  const remaining = Math.max(0, limit - spent);
  const pctRaw = limit > 0 ? (spent / limit) * 100 : 0;
  const pct = Math.min(100, Math.round(pctRaw * 10) / 10);

  const labelEl = document.getElementById('dash-budget-cat-label');
  const spentEl = document.getElementById('dash-budget-spent');
  const limitEl = document.getElementById('dash-budget-limit');
  const remEl = document.getElementById('dash-budget-remaining');
  const footEl = document.getElementById('dash-budget-pct');
  const barEl = document.getElementById('dash-budget-bar');

  if (labelEl) labelEl.textContent = data.label;
  if (spentEl) spentEl.textContent = formatPeso(spent);
  if (limitEl) limitEl.textContent = formatPeso(limit);
  if (remEl) remEl.textContent = formatPeso(remaining);

  if (footEl) {
    if (pctRaw >= 100) {
      footEl.textContent = "You've reached or exceeded this category's budget for the month.";
    } else {
      footEl.textContent = `You've used ${pct}% of this month's budget for this view.`;
    }
  }

  if (barEl) {
    barEl.style.width = `${Math.min(pctRaw, 100)}%`;
    barEl.classList.remove('dash-budget-bar--warn', 'dash-budget-bar--over');
    if (pctRaw >= 100) barEl.classList.add('dash-budget-bar--over');
    else if (pctRaw >= 85) barEl.classList.add('dash-budget-bar--warn');
  }
}

function initCategoryTabs() {
  const tabs = document.querySelectorAll('.dash-cat-tab');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-category') || 'all';
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      applyBudgetCategory(key);
    });
  });

  applyBudgetCategory('all');
}

function initPageTabs() {
  const tabs = document.querySelectorAll('.dash-page-tab[data-page]');
  const panels = document.querySelectorAll('.dash-page-panel[data-page]');
  if (!tabs.length || !panels.length) return;

  const showPage = (page) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.page === page;
      tab.classList.toggle('active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    panels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.page === page);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.page) showPage(tab.dataset.page);
    });
  });

  showPage('overview');
}

function buildMarketChart() {
  const ctx = document.getElementById('chart-market');
  if (!ctx || typeof Chart === 'undefined') return;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const portfolioK = [1800, 1860, 1920, 2000, 2080, 2150, 2220, 2310, 2380, 2480, 2620, 2780];
  const marketK = [1550, 1600, 1680, 1740, 1810, 1880, 1950, 2020, 2100, 2180, 2240, 2320];

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Portfolio',
          data: portfolioK,
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74, 222, 128, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Market',
          data: marketK,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.parsed.y;
              return `${ctx.dataset.label}: ₱${v}k`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(74, 222, 128, 0.08)' },
          ticks: { color: 'rgba(255,255,255,0.55)', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(74, 222, 128, 0.08)' },
          ticks: {
            color: 'rgba(255,255,255,0.55)',
            font: { size: 11 },
            callback(value) {
              return `₱${value}k`;
            },
          },
        },
      },
    },
  });
}

function buildExpenseChart() {
  const ctx = document.getElementById('chart-expenses');
  if (!ctx || typeof Chart === 'undefined') return;

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Housing', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Other'],
      datasets: [
        {
          data: [12000, 8500, 5000, 4000, 3500, 3000, 2500],
          backgroundColor: ['#4ade80', '#22c55e', '#16a34a', '#bef264', '#86efac', '#4d7c0f', '#a3e635'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const label = ctx.label || '';
              const value = ctx.parsed || 0;
              return `${label}: ₱${value.toLocaleString()}`;
            },
          },
        },
      },
    },
  });
}

function buildSpendingChart() {
  const ctx = document.getElementById('chart-spending');
  if (!ctx || typeof Chart === 'undefined') return;

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Monthly spending',
          data: [34000, 36500, 33000, 38500, 37200, 38500],
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const value = ctx.parsed.y;
              return `Spending: ₱${value.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(74, 222, 128, 0.08)' },
          ticks: { color: 'rgba(255,255,255,0.55)', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(74, 222, 128, 0.08)' },
          ticks: {
            color: 'rgba(255,255,255,0.55)',
            font: { size: 11 },
            callback(value) {
              return `₱${value / 1000}k`;
            },
          },
        },
      },
    },
  });
}

function setActiveSidebarLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.dash-nav-link[href$=".html"]').forEach((link) => {
    const href = link.getAttribute('href');
    const active = href === currentPage;
    link.classList.toggle('active', active);
    if (active) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

const ALERTS_READ_STORAGE_KEY = 'finovate_alerts_read';
let DASH_SESSION = null;

function getAccountStorageKey(base) {
  const identifier = DASH_SESSION?.user?.id || DASH_SESSION?.user?.email || 'guest';
  return `${base}_${identifier}`;
}

function initAlertReadState() {
  const items = Array.from(document.querySelectorAll('.dash-notification-item'));
  const button = document.getElementById('mark-read-btn');
  const allRead = localStorage.getItem(getAccountStorageKey(ALERTS_READ_STORAGE_KEY)) === 'true';

  if (allRead) {
    items.forEach((item) => item.classList.remove('dash-notification-item--unread'));
  }

  if (button) {
    button.addEventListener('click', () => {
      items.forEach((item) => item.classList.remove('dash-notification-item--unread'));
      localStorage.setItem(getAccountStorageKey(ALERTS_READ_STORAGE_KEY), 'true');
    });
  }
}

function buildPortfolioChart() {
  const targetIds = ['chart-portfolio', 'chart-portfolio-donut'];
  if (typeof Chart === 'undefined') return;

  targetIds.forEach((targetId) => {
    const ctx = document.getElementById(targetId);
    if (!ctx) return;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Stocks', 'Crypto', 'Bonds', 'Real Estate', 'Cash'],
        datasets: [
          {
            data: [45, 20, 15, 12, 8],
            backgroundColor: ['#4ade80', '#60a5fa', '#facc15', '#a78bfa', '#9ca3af'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'rgba(255,255,255,0.85)',
              padding: 12,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label(ctx) {
                const label = ctx.label || '';
                const value = ctx.parsed || 0;
                return `${label}: ${value}%`;
              },
            },
          },
        },
      },
    });
  });
}

const PORTFOLIO_LINE_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const PORTFOLIO_LINE_VALUES = [180, 188, 195, 205, 218, 230, 245, 262, 280, 301, 320, 342];

let portfolioLineChartInstance = null;

function formatPortfolioPctChange(value, base) {
  if (base == null || base === 0) return null;
  const pct = ((value - base) / base) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function portfolioLineDetailLines(index) {
  const value = PORTFOLIO_LINE_VALUES[index];
  const baseline = PORTFOLIO_LINE_VALUES[0];
  const prev = index > 0 ? PORTFOLIO_LINE_VALUES[index - 1] : null;
  const lines = [`Value: ₱${value}k`];
  const ytd = formatPortfolioPctChange(value, baseline);
  if (ytd) lines.push(`Since Jan: ${ytd}`);
  if (prev != null) {
    const mom = formatPortfolioPctChange(value, prev);
    if (mom) lines.push(`vs prior month: ${mom}`);
  }
  return lines;
}

function updatePortfolioChartDetail(index) {
  const el = document.getElementById('portfolio-chart-detail');
  if (!el || index < 0 || index >= PORTFOLIO_LINE_VALUES.length) return;
  const label = PORTFOLIO_LINE_LABELS[index];
  const value = PORTFOLIO_LINE_VALUES[index];
  const baseline = PORTFOLIO_LINE_VALUES[0];
  const prev = index > 0 ? PORTFOLIO_LINE_VALUES[index - 1] : null;
  const ytd = formatPortfolioPctChange(value, baseline) || '—';
  const mom = prev != null ? formatPortfolioPctChange(value, prev) : '—';
  el.innerHTML =
    `<strong>${label}</strong> · ₱${value}k · ` +
    `<span class="portfolio-chart-detail-pct">${ytd} since Jan</span>` +
    (prev != null ? ` · <span class="portfolio-chart-detail-pct">${mom} vs prior month</span>` : '');
}

function activatePortfolioChartPoint(chart, index, pointer) {
  if (!chart || index < 0) return;
  const active = [{ datasetIndex: 0, index }];
  chart.setActiveElements(active);
  if (chart.tooltip && pointer) {
    chart.tooltip.setActiveElements(active, { x: pointer.x, y: pointer.y });
  }
  chart.update();
  updatePortfolioChartDetail(index);
}

function buildPortfolioLineChart() {
  const ctx = document.getElementById('chart-portfolio-line');
  if (!ctx || typeof Chart === 'undefined') return;

  if (portfolioLineChartInstance) {
    portfolioLineChartInstance.destroy();
    portfolioLineChartInstance = null;
  }

  portfolioLineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: PORTFOLIO_LINE_LABELS,
      datasets: [
        {
          label: 'Portfolio value',
          data: PORTFOLIO_LINE_VALUES,
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74, 222, 128, 0.16)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHitRadius: 14,
          pointBackgroundColor: '#4ade80',
          pointBorderColor: '#052e16',
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      onHover(event, elements) {
        const target = event.native?.target;
        if (target) target.style.cursor = elements.length ? 'pointer' : 'default';
        if (elements.length) updatePortfolioChartDetail(elements[0].index);
      },
      onClick(event, elements, chart) {
        if (!elements.length) return;
        activatePortfolioChartPoint(chart, elements[0].index, event);
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          backgroundColor: 'rgba(5, 46, 22, 0.95)',
          titleColor: '#bbf7d0',
          bodyColor: '#eaffea',
          borderColor: 'rgba(74, 222, 128, 0.45)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            title(items) {
              return items[0]?.label ? `${items[0].label} performance` : '';
            },
            label(ctx) {
              return portfolioLineDetailLines(ctx.dataIndex);
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(74, 222, 128, 0.08)' },
          ticks: { color: 'rgba(255,255,255,0.65)', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(74, 222, 128, 0.08)' },
          ticks: {
            color: 'rgba(255,255,255,0.65)',
            font: { size: 11 },
            callback(value) {
              return `₱${value}k`;
            },
          },
        },
      },
    },
  });

  const lastIndex = PORTFOLIO_LINE_VALUES.length - 1;
  updatePortfolioChartDetail(lastIndex);
}

const FINOVATE_GOALS_KEY = 'finovate_goals';
const DEFAULT_GOALS = [
  { title: 'Emergency Fund', current: 78000, target: 100000 },
  { title: 'New Car Downpayment', current: 45000, target: 200000 },
  { title: 'Vacation Fund', current: 38000, target: 50000 },
];

function getStoredGoals() {
  try {
    const raw = localStorage.getItem(getAccountStorageKey(FINOVATE_GOALS_KEY));
    if (!raw) return DEFAULT_GOALS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_GOALS;
    return parsed.map((goal) => ({
      title: String(goal.title || '').trim() || 'New goal',
      current: Number(goal.current) || 0,
      target: Number(goal.target) || 0,
    }));
  } catch {
    return DEFAULT_GOALS;
  }
}

function saveGoals(goals) {
  try {
    localStorage.setItem(getAccountStorageKey(FINOVATE_GOALS_KEY), JSON.stringify(goals));
    return true;
  } catch {
    return false;
  }
}

function createGoalCard(goal, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'dash-goal-card';
  wrapper.dataset.goalIndex = String(index);
  const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const currentLabel = formatPeso(goal.current);
  const targetLabel = goal.target > 0 ? formatPeso(goal.target) : '—';

  wrapper.innerHTML = `
    <div class="dash-goal-card-header">
      <label class="dash-goal-name-label">
        Goal name
        <input class="dash-goal-input dash-goal-input--title" type="text" value="${goal.title}" placeholder="Goal name" />
      </label>
    </div>
    <div class="dash-goal-fields">
      <label>
        Current amount
        <input class="dash-goal-input" type="number" min="0" step="100" value="${goal.current}" />
      </label>
      <label>
        Target amount
        <input class="dash-goal-input" type="number" min="0" step="100" value="${goal.target}" />
      </label>
      <div class="dash-goal-track">
        <div class="dash-goal-track-inner" style="width:${progress}%"></div>
      </div>
      <p class="dash-goal-meta">${currentLabel} / ${targetLabel} · ${progress}%</p>
    </div>
    <div class="dash-goal-card-footer">
      <button type="button" class="dash-action-button dash-action-button--secondary dash-goal-remove-btn" aria-label="Remove goal">Remove</button>
    </div>
  `;
  return wrapper;
}

function renderSavedGoalsList(goals) {
  const savedList = document.getElementById('saved-goals-list');
  if (!savedList) return;
  if (!Array.isArray(goals) || goals.length === 0) {
    savedList.innerHTML = '<li class="saved-goals-item saved-goals-item--empty">No saved goals yet. Add one and click Save goals.</li>';
    return;
  }

  savedList.innerHTML = '';
  goals.forEach((goal) => {
    const item = document.createElement('li');
    item.className = 'saved-goals-item';
    item.innerHTML = `
      <div class="saved-goals-item-heading">
        <strong>${escapeHtml(goal.title)}</strong>
        <span>${formatPeso(goal.current)} / ${goal.target > 0 ? formatPeso(goal.target) : '—'}</span>
      </div>
      <div class="saved-goals-item-progress">
        <div class="saved-goals-item-progress-inner" style="width:${goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0}%"></div>
      </div>
    `;
    savedList.appendChild(item);
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderGoals() {
  const container = document.getElementById('goals-list');
  if (!container) return;
  const goals = getStoredGoals();
  container.innerHTML = '';
  goals.forEach((goal, idx) => container.appendChild(createGoalCard(goal, idx)));
  renderSavedGoalsList(goals);
}

function getGoalsFromForm() {
  const container = document.getElementById('goals-list');
  if (!container) return [];
  return Array.from(container.querySelectorAll('.dash-goal-card')).map((card) => {
    const title = card.querySelector('.dash-goal-input--title')?.value.trim() || 'New goal';
    const current = Number(card.querySelector('.dash-goal-fields input[type="number"]')?.value || 0);
    const target = Number(card.querySelectorAll('.dash-goal-fields input[type="number"]')[1]?.value || 0);
    return { title, current, target };
  });
}

function addNewGoal() {
  const container = document.getElementById('goals-list');
  if (!container) return;
  const goals = getGoalsFromForm();
  goals.push({ title: 'New goal', current: 0, target: 0 });
  saveGoals(goals);
  renderGoals();
}

function initGoalsEditor() {
  const container = document.getElementById('goals-list');
  const addBtn = document.getElementById('goals-add-btn');
  const saveBtn = document.getElementById('goals-save-btn');
  const status = document.getElementById('goals-status');
  if (!container || !addBtn || !saveBtn) return;

  const refresh = () => {
    renderGoals();
    container.querySelectorAll('.dash-goal-remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.dash-goal-card');
        if (!card) return;
        card.remove();
      });
    });
  };

  addBtn.addEventListener('click', () => {
    const goals = getGoalsFromForm();
    goals.push({ title: 'New goal', current: 0, target: 0 });
    saveGoals(goals);
    refresh();
    if (status) status.textContent = 'A new goal was added. Remember to save your changes.';
  });

  saveBtn.addEventListener('click', () => {
    const goals = getGoalsFromForm();
    if (goals.length === 0) {
      if (status) status.textContent = 'Add at least one goal before saving.';
      return;
    }
    saveGoals(goals);
    refresh();
    if (status) status.textContent = 'Goals saved.';
  });

  refresh();
}

function buildInsightsChart() {
  const ctx = document.getElementById('chart-insights');
  if (!ctx || typeof Chart === 'undefined') return;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Growth',
          data: [12, 15, 13, 18, 20, 24],
          backgroundColor: 'rgba(74, 222, 128, 0.7)',
          borderRadius: 10,
          barThickness: 20,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255,255,255,0.75)', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(74, 222, 128, 0.08)' },
          ticks: {
            color: 'rgba(255,255,255,0.75)',
            font: { size: 11 },
            callback(value) {
              return `${value}%`;
            },
          },
        },
      },
    },
  });
}

const FINOVATE_TX_KEY = 'finovate_transactions';
const FINOVATE_TX_SEEDED_AT = 'finovate_tx_seeded_at';

function transactionAccountExists() {
  const raw = localStorage.getItem(getAccountStorageKey(FINOVATE_TX_KEY));
  return raw != null && raw !== '';
}

function getSampleTransactions() {
  return [
    { id: 'seed-1', date: '2026-04-11', description: 'Salary Deposit', category: 'Income', type: 'income', amount: 45000 },
    { id: 'seed-2', date: '2026-04-10', description: 'Grocery Shopping', category: 'Food', type: 'expense', amount: 3200 },
    { id: 'seed-3', date: '2026-04-09', description: 'Stock Purchase - AAPL', category: 'Investment', type: 'investment', amount: 15000 },
    { id: 'seed-4', date: '2026-04-08', description: 'Electric Bill', category: 'Utilities', type: 'expense', amount: 2800 },
    { id: 'seed-5', date: '2026-04-07', description: 'Freelance Payment', category: 'Income', type: 'income', amount: 12000 },
    { id: 'seed-6', date: '2026-04-05', description: 'Crypto Purchase - BTC', category: 'Investment', type: 'investment', amount: 8000 },
    { id: 'seed-7', date: '2026-04-04', description: 'Restaurant Dinner', category: 'Food', type: 'expense', amount: 1500 },
    { id: 'seed-8', date: '2026-04-01', description: 'Received dividends', category: 'Income', type: 'income', amount: 3200 },
  ];
}

function ensureStarterTransactionsIfNeeded() {
  if (!transactionAccountExists()) return;
  if (localStorage.getItem(getAccountStorageKey(FINOVATE_TX_SEEDED_AT))) return;
  const cur = getTransactionsRaw();
  if (cur.length > 0) {
    localStorage.setItem(getAccountStorageKey(FINOVATE_TX_SEEDED_AT), '1');
    return;
  }
  try {
    saveTransactions(getSampleTransactions());
    localStorage.setItem(getAccountStorageKey(FINOVATE_TX_SEEDED_AT), '1');
  } catch (_) {}
}

function getTransactionsRaw() {
  const raw = localStorage.getItem(getAccountStorageKey(FINOVATE_TX_KEY));
  if (raw == null || raw === '') return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function migrateTransactionIds(list) {
  let changed = false;
  const next = list.map((tx, i) => {
    if (!tx || typeof tx !== 'object') return tx;
    if (tx.id != null && String(tx.id) !== '') return tx;
    changed = true;
    return { ...tx, id: `mig-${i}` };
  });
  if (changed) {
    try {
      saveTransactions(next);
    } catch (_) {}
  }
  return next;
}

function getTransactions() {
  return migrateTransactionIds(getTransactionsRaw());
}

function saveTransactions(list) {
  localStorage.setItem(getAccountStorageKey(FINOVATE_TX_KEY), JSON.stringify(list));
}

function newTransactionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTransactionAmountCell(type, amountNum) {
  const n = Math.abs(Number(amountNum) || 0);
  const formatted = formatPeso(n);
  if (type === 'income') {
    return { className: 'dash-amt-positive', text: `+${formatted}` };
  }
  return { className: 'dash-amt-negative', text: `-${formatted}` };
}

function buildTransactionRowElement(tx) {
  const tr = document.createElement('tr');
  tr.className = 'dash-tx-row';
  const type = tx.type === 'investment' ? 'investment' : tx.type === 'income' ? 'income' : 'expense';
  tr.dataset.type = type;
  const id = tx.id != null && String(tx.id) !== '' ? String(tx.id) : newTransactionId();
  tr.dataset.txId = id;
  const { className, text } = formatTransactionAmountCell(type, tx.amount);
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const cells = [tx.date, tx.description, tx.category, typeLabel, text];
  cells.forEach((val, i) => {
    const td = document.createElement('td');
    if (i === 4) td.className = className;
    td.textContent = String(val ?? '');
    tr.appendChild(td);
  });
  const actionsTd = document.createElement('td');
  actionsTd.className = 'dash-tx-actions';
  const rm = document.createElement('button');
  rm.type = 'button';
  rm.className = 'dash-action-button dash-action-button--secondary tx-remove-btn';
  rm.dataset.removeTx = id;
  rm.setAttribute('aria-label', 'Remove transaction');
  rm.textContent = 'Remove';
  actionsTd.appendChild(rm);
  tr.appendChild(actionsTd);
  return tr;
}

function renderTransactionsIntoTbody(tbody, list) {
  if (!tbody) return;
  tbody.innerHTML = '';
  list.forEach((tx) => {
    if (!tx || typeof tx !== 'object') return;
    tbody.appendChild(buildTransactionRowElement(tx));
  });
}

function initTransactionFilters() {
  const searchInput = document.getElementById('tx-search-input');
  if (!searchInput) return;

  const pills = document.querySelectorAll('.dash-pill[data-filter]');
  const tbody = document.getElementById('tx-tbody');
  const emptySearchEl = document.getElementById('tx-empty-search');
  const emptyAccountEl = document.getElementById('tx-empty-account');
  const emptyListEl = document.getElementById('tx-empty-list');
  const tableBlock = document.getElementById('tx-table-block');
  const addWrap = document.getElementById('tx-add-form-wrap');
  const addForm = document.getElementById('tx-add-form');
  const dateInput = document.getElementById('tx-add-date');

  const accountOk = transactionAccountExists();
  if (accountOk) ensureStarterTransactionsIfNeeded();

  if (tbody) {
    if (!accountOk) {
      tbody.innerHTML = '';
    } else {
      renderTransactionsIntoTbody(tbody, getTransactions());
    }
  }

  if (accountOk && tbody && !tbody.dataset.txRemoveBound) {
    tbody.dataset.txRemoveBound = '1';
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-tx]');
      if (!btn || !tbody.contains(btn)) return;
      const rid = btn.getAttribute('data-remove-tx');
      const cur = getTransactions().filter((t) => String(t.id) !== String(rid));
      try {
        saveTransactions(cur);
      } catch (_) {
        return;
      }
      renderTransactionsIntoTbody(tbody, cur);
      filterRows();
    });
  }

  if (accountOk && dateInput && !dateInput.value) {
    const d = new Date();
    dateInput.value = d.toISOString().slice(0, 10);
  }

  if (addWrap) addWrap.hidden = !accountOk;

  const filterRows = () => {
    const rows = document.querySelectorAll('.dash-tx-row');
    const query = (searchInput?.value || '').trim().toLowerCase();
    const activeType = document.querySelector('.dash-pill.active[data-filter]')?.dataset.filter || 'all';

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      const type = row.dataset.type || 'all';
      const matchesQuery = !query || text.includes(query);
      const matchesType = activeType === 'all' || type === activeType;
      row.hidden = !(matchesQuery && matchesType);
    });

    const visible = Array.from(rows).filter((r) => !r.hidden).length;
    const hasAnyRows = rows.length > 0;
    const filterActive = Boolean(query) || activeType !== 'all';

    if (emptyAccountEl) emptyAccountEl.hidden = accountOk;
    if (emptyListEl) emptyListEl.hidden = !accountOk || hasAnyRows;
    if (emptySearchEl) emptySearchEl.hidden = !hasAnyRows || visible > 0 || !filterActive;
    if (tableBlock) tableBlock.hidden = !accountOk;
  };

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((button) => button.classList.toggle('active', button === pill));
      filterRows();
    });
  });

  searchInput.addEventListener('input', filterRows);
  searchInput.addEventListener('search', filterRows);

  if (addForm && accountOk) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const desc = document.getElementById('tx-add-desc')?.value.trim() ?? '';
      const category = document.getElementById('tx-add-category')?.value.trim() ?? '';
      const typeRaw = document.getElementById('tx-add-type')?.value || 'expense';
      const type = ['income', 'expense', 'investment'].includes(typeRaw) ? typeRaw : 'expense';
      const dateVal = document.getElementById('tx-add-date')?.value || '';
      const amountRaw = document.getElementById('tx-add-amount')?.value;
      const amount = Number(amountRaw);
      if (!desc || !category || !dateVal || !(amount > 0)) return;
      const next = getTransactions().concat([
        { id: newTransactionId(), date: dateVal, description: desc, category, type, amount },
      ]);
      try {
        saveTransactions(next);
      } catch (_) {
        return;
      }
      renderTransactionsIntoTbody(tbody, next);
      addForm.reset();
      if (dateInput) dateInput.value = dateVal;
      filterRows();
    });
  }

  filterRows();
}

const FINOVATE_ASSETS_KEY = 'finovate_portfolio_assets';
const FINOVATE_ASSETS_SEEDED_AT = 'finovate_portfolio_assets_seeded_at';

function getSamplePortfolioAssets() {
  return [
    { id: 'asset-seed-1', name: 'AAPL Stock', type: 'Stocks', value: 85000, gainPct: 12.4 },
    { id: 'asset-seed-2', name: 'Bitcoin', type: 'Crypto', value: 62000, gainPct: -3.2 },
    { id: 'asset-seed-3', name: 'BDO Savings', type: 'Savings', value: 78000, gainPct: 2.1 },
    { id: 'asset-seed-4', name: 'Gov Bonds T10', type: 'Bonds', value: 31000, gainPct: 5.8 },
    { id: 'asset-seed-5', name: 'Ethereum', type: 'Crypto', value: 24000, gainPct: 8.6 },
    { id: 'asset-seed-6', name: 'TSLA Stock', type: 'Stocks', value: 32000, gainPct: -1.5 },
  ];
}

function getPortfolioAssetsRaw() {
  const raw = localStorage.getItem(getAccountStorageKey(FINOVATE_ASSETS_KEY));
  if (raw == null || raw === '') return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function savePortfolioAssets(list) {
  localStorage.setItem(getAccountStorageKey(FINOVATE_ASSETS_KEY), JSON.stringify(list));
}

function ensureStarterPortfolioAssetsIfNeeded() {
  if (localStorage.getItem(getAccountStorageKey(FINOVATE_ASSETS_SEEDED_AT))) return;
  const cur = getPortfolioAssetsRaw();
  if (cur.length > 0) {
    localStorage.setItem(getAccountStorageKey(FINOVATE_ASSETS_SEEDED_AT), '1');
    return;
  }
  try {
    savePortfolioAssets(getSamplePortfolioAssets());
    localStorage.setItem(getAccountStorageKey(FINOVATE_ASSETS_SEEDED_AT), '1');
  } catch (_) {}
}

function newPortfolioAssetId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatGainLossCell(gainPct) {
  const n = Number(gainPct) || 0;
  const sign = n >= 0 ? '+' : '';
  const text = `${sign}${n.toFixed(1)}%`;
  const className = n >= 0 ? 'dash-amt-positive' : 'dash-amt-negative';
  return { className, text };
}

function buildPortfolioAssetRowElement(asset) {
  const tr = document.createElement('tr');
  tr.className = 'dash-portfolio-asset-row';
  const id = asset.id != null && String(asset.id) !== '' ? String(asset.id) : newPortfolioAssetId();
  tr.dataset.assetId = id;
  const { className, text } = formatGainLossCell(asset.gainPct);
  [asset.name, asset.type, formatPeso(asset.value)].forEach((val) => {
    const td = document.createElement('td');
    td.textContent = String(val ?? '');
    tr.appendChild(td);
  });
  const gainTd = document.createElement('td');
  gainTd.className = className;
  gainTd.textContent = text;
  tr.appendChild(gainTd);
  const actionsTd = document.createElement('td');
  actionsTd.className = 'dash-tx-actions';
  const rm = document.createElement('button');
  rm.type = 'button';
  rm.className = 'dash-action-button dash-action-button--secondary portfolio-asset-remove-btn';
  rm.dataset.removeAsset = id;
  rm.setAttribute('aria-label', 'Remove asset');
  rm.textContent = 'Remove';
  actionsTd.appendChild(rm);
  tr.appendChild(actionsTd);
  return tr;
}

function renderPortfolioAssetsIntoTbody(tbody, list) {
  if (!tbody) return;
  tbody.innerHTML = '';
  list.forEach((asset) => {
    if (!asset || typeof asset !== 'object') return;
    tbody.appendChild(buildPortfolioAssetRowElement(asset));
  });
}

function showPortfolioAddForm() {
  const wrap = document.getElementById('portfolio-add-form-wrap');
  const nameInput = document.getElementById('portfolio-add-name');
  if (!wrap) return;
  wrap.hidden = false;
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  nameInput?.focus();
}

function hidePortfolioAddForm() {
  const wrap = document.getElementById('portfolio-add-form-wrap');
  const form = document.getElementById('portfolio-add-form');
  if (wrap) wrap.hidden = true;
  form?.reset();
}

function initPortfolioAssets() {
  const addBtn = document.getElementById('portfolio-add-btn');
  const tbody = document.getElementById('portfolio-assets-tbody');
  const addWrap = document.getElementById('portfolio-add-form-wrap');
  const addForm = document.getElementById('portfolio-add-form');
  const cancelBtn = document.getElementById('portfolio-add-cancel');
  if (!addBtn && !tbody) return;

  ensureStarterPortfolioAssetsIfNeeded();

  if (tbody) {
    renderPortfolioAssetsIntoTbody(tbody, getPortfolioAssetsRaw());
    if (!tbody.dataset.portfolioRemoveBound) {
      tbody.dataset.portfolioRemoveBound = '1';
      tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-asset]');
        if (!btn || !tbody.contains(btn)) return;
        const rid = btn.getAttribute('data-remove-asset');
        const cur = getPortfolioAssetsRaw().filter((a) => String(a.id) !== String(rid));
        try {
          savePortfolioAssets(cur);
        } catch (_) {
          return;
        }
        renderPortfolioAssetsIntoTbody(tbody, cur);
      });
    }
  }

  addBtn?.addEventListener('click', () => {
    showPortfolioAddForm();
  });

  cancelBtn?.addEventListener('click', () => {
    hidePortfolioAddForm();
  });

  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('portfolio-add-name')?.value.trim() ?? '';
      const type = document.getElementById('portfolio-add-type')?.value.trim() ?? 'Other';
      const value = Number(document.getElementById('portfolio-add-value')?.value);
      const gainPct = Number(document.getElementById('portfolio-add-gain')?.value);
      if (!name || !(value >= 0) || Number.isNaN(gainPct)) return;
      const next = getPortfolioAssetsRaw().concat([
        { id: newPortfolioAssetId(), name, type, value, gainPct },
      ]);
      try {
        savePortfolioAssets(next);
      } catch (_) {
        return;
      }
      if (tbody) renderPortfolioAssetsIntoTbody(tbody, next);
      hidePortfolioAddForm();
    });
  }

}

function wireTopbarActions() {
  const bell = document.querySelector('.dash-icon-btn[aria-label="Notifications"]');
  if (bell) {
    bell.addEventListener('click', () => {
      window.location.href = 'alerts.html';
    });
  }
}

async function bootDashboard() {
  const session = await window.DashAuth.requireSession();
  if (!session) return;
  DASH_SESSION = session;
  if (window.DashProfile) {
    window.DashProfile.rememberSession(session);
    window.DashProfile.bindProfileListeners(() => DASH_SESSION);
    window.DashProfile.applyHeaderAvatar(session);
  }

  try {
    if (localStorage.getItem(getAccountStorageKey(FINOVATE_TX_KEY)) == null) {
      localStorage.setItem(getAccountStorageKey(FINOVATE_TX_KEY), '[]');
    }
    if (localStorage.getItem(getAccountStorageKey(FINOVATE_ASSETS_KEY)) == null) {
      localStorage.setItem(getAccountStorageKey(FINOVATE_ASSETS_KEY), '[]');
    }
  } catch (_) {}

  const greet = document.getElementById('dash-user-name');
  if (greet) greet.textContent = window.DashAuth.displayNameFromSession(session);
  if (window.DashProfile) window.DashProfile.applyHeaderAvatar(session);
  else window.DashAuth.setAvatarInitials(session, document.getElementById('dash-profile-link'));

  try {
    setActiveSidebarLink();
    initCategoryTabs();
    initPageTabs();
    buildMarketChart();
    buildExpenseChart();
    buildSpendingChart();
    buildPortfolioChart();
    buildPortfolioLineChart();
    buildInsightsChart();
    initGoalsEditor();
    initAlertReadState();
    initTransactionFilters();
    initPortfolioAssets();
    wireTopbarActions();
  } finally {
    window.DashAuth?.wireDashLogout?.();
    window.DashAuth?.wireMobileNav?.();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootDashboard);
} else {
  bootDashboard();
}

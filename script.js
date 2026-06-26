const navLinks = document.querySelectorAll('header nav a');
const searchInput = document.querySelector('.search-bar input');

const CATEGORY_COPY = {
  budgeting:
    'Track spending, set limits per category, and get alerts before you overspend.',
  investing:
    'See portfolio-style summaries, risk hints, and ideas tailored to your timeline.',
  savings:
    'Automate savings rules, round-ups, and goal-based transfers you can stick to.',
  debt:
    'Prioritize paydown plans, see interest impact, and stay motivated with milestones.',
};

function setActiveNavLink(clickedLink) {
  navLinks.forEach((link) => link.classList.toggle('active', link === clickedLink));
}

function openAuthPage(mode) {
  const url = new URL('auth.html', window.location.href);
  url.hash = mode === 'signup' ? '#signup' : '#login';
  window.location.href = url.toString();
}

function initAuthOpen() {
  document.querySelectorAll('[data-auth-open]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = el.getAttribute('data-auth-open');
      if (mode === 'login' || mode === 'signup') openAuthPage(mode);
    });
  });
}

function initCategoryTabs() {
  const tabs = document.querySelectorAll('.category-tab');
  const descEl = document.querySelector('[data-category-desc]');
  if (!tabs.length || !descEl) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-category');
      const text = (key && CATEGORY_COPY[key]) || '';

      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      descEl.textContent = text;
    });
  });
}

async function waitForSupabaseOnLanding(timeoutMs = 8000) {
  const start = Date.now();
  while (!window.supabaseClient && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 40));
  }
}

async function applyLandingSessionVisibility() {
  await waitForSupabaseOnLanding();
  const client = window.supabaseClient;
  if (!client) return;
  const { data: { session } } = await client.auth.getSession();
  if (session) {
    document.body.classList.add('landing-has-session');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initCategoryTabs();
  initAuthOpen();
  applyLandingSessionVisibility();
  initDashboardRedirects();

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      setActiveNavLink(event.currentTarget);
    });
  });

  if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const query = searchInput.value.trim();
        alert(query ? `Searching for "${query}"...` : 'Please enter a search term.');
      }
    });
  }
});

async function initDashboardRedirects() {
  const dashboardLinks = document.querySelectorAll('a[href="dashboard/dashboard.html"]');
  if (!dashboardLinks.length) return;
  await waitForSupabaseOnLanding();
  const client = window.supabaseClient;
  if (!client) return;
  const { data: { session } } = await client.auth.getSession();

  dashboardLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!session) {
        event.preventDefault();
        openAuthPage('login');
      }
    });
  });
}

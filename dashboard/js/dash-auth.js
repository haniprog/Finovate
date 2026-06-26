/**
 * Supports PHP/mock login (localStorage) and Supabase sessions.
 */
(function initDashAuth() {
  const LOCAL_USER_KEY = 'finovate_user';

  function getLocalUser() {
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function sessionFromLocalUser(user) {
    if (!user || user.id == null) return null;
    const fullName = user.full_name || user.username || '';
    return {
      source: 'local',
      user: {
        id: String(user.id),
        email: user.email || '',
        created_at: user.created_at || null,
        user_metadata: {
          full_name: fullName,
          name: fullName,
          username: user.username || '',
        },
      },
    };
  }

  function getSupabase() {
    return window.supabaseClient;
  }

  async function waitForSupabaseClient(timeoutMs) {
    const t = timeoutMs == null ? 8000 : timeoutMs;
    const start = Date.now();
    while (!window.supabaseClient && Date.now() - start < t) {
      await new Promise((r) => setTimeout(r, 40));
    }
    return window.supabaseClient;
  }

  function authPageUrl() {
    return window.location.pathname.includes('/dashboard/') ? '../auth.html' : 'auth.html';
  }

  function wireDashLogout() {
    const btn = document.getElementById('dash-logout-btn');
    if (!btn || btn.dataset.logoutBound === '1') return;
    btn.dataset.logoutBound = '1';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await signOut();
      } catch (_) {}
      window.location.href = authPageUrl();
    });
  }

  function wireMobileNav() {
    const toggle = document.getElementById('dash-sidebar-toggle');
    const sidebar = document.getElementById('dash-sidebar');
    if (!toggle || !sidebar || toggle.dataset.navBound === '1') return;
    toggle.dataset.navBound = '1';
    toggle.addEventListener('click', () => {
      const open = sidebar.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    sidebar.querySelectorAll('a.dash-nav-link').forEach((a) => {
      a.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 900px)').matches) {
          sidebar.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function scrollToPageHash() {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const scroll = () => {
      const target = document.querySelector(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (document.readyState === 'complete') scroll();
    else window.addEventListener('load', scroll, { once: true });
  }

  function wireQuickAccessCards() {
    document.querySelectorAll('.dash-quick-link-card, .dash-metric-card--link').forEach((el) => {
      if (el.dataset.quickBound === '1') return;
      const href = el.getAttribute('href');
      if (!href) return;
      el.dataset.quickBound = '1';
      el.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        window.location.href = href;
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = href;
        }
      });
    });

    document.querySelectorAll('a.dash-pill--link').forEach((link) => {
      if (link.dataset.pillBound === '1') return;
      link.dataset.pillBound = '1';
    });
  }

  function revealDashboard() {
    document.body.classList.remove('dash-gate-pending');
    document.body.classList.add('dash-gate-ready');
    wireDashLogout();
    wireMobileNav();
    wireQuickAccessCards();
    scrollToPageHash();
  }

  async function requireSession() {
    const localUser = getLocalUser();
    if (localUser) {
      const localSession = sessionFromLocalUser(localUser);
      if (localSession) {
        revealDashboard();
        return localSession;
      }
    }

    const client = await waitForSupabaseClient();
    if (!client) {
      window.location.href = '../auth.html';
      return null;
    }
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) {
      window.location.href = '../auth.html';
      return null;
    }
    revealDashboard();
    return { ...session, source: 'supabase' };
  }

  async function signOut() {
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
    } catch (_) {}
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (_) {}
    }
  }

  function displayNameFromSession(session) {
    const meta = session.user?.user_metadata;
    const name = meta?.full_name || meta?.name;
    if (name && String(name).trim()) return String(name).split(' ')[0];
    const email = session.user?.email || '';
    return email.split('@')[0] || 'there';
  }

  function fullDisplayNameFromSession(session) {
    const meta = session.user?.user_metadata;
    const full = (meta?.full_name || meta?.name || '').trim();
    if (full) return full;
    const email = session.user?.email || '';
    return email.split('@')[0] || 'Member';
  }

  function initialsFromSession(session) {
    const meta = session.user?.user_metadata;
    const name = meta?.full_name || meta?.name || session.user?.email || 'U';
    const parts = String(name).trim().split(/\s+/);
    let initials = parts[0]?.[0] || 'U';
    if (parts.length > 1) initials += parts[1][0];
    else if (parts[0]?.length > 1) initials = parts[0].slice(0, 2);
    return initials.toUpperCase().slice(0, 2);
  }

  function setAvatarInitials(session, el) {
    if (window.DashProfile?.applyHeaderAvatar && el?.id === 'dash-profile-link') {
      window.DashProfile.applyHeaderAvatar(session);
      return;
    }
    if (!el) return;
    el.textContent = initialsFromSession(session);
  }

  function formatJoinedDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return `Joined ${d.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    } catch (_) {
      return '—';
    }
  }

  async function fetchDashApi(path, options = {}) {
    const bases = [];
    try {
      const stored = sessionStorage.getItem('finovate_server_base');
      if (stored) bases.push(stored);
    } catch (_) {}
    if (typeof window !== 'undefined' && window.location?.origin?.startsWith('http')) {
      const origin = window.location.origin;
      if (!bases.includes(origin)) bases.push(origin);
    }

    const route = path.startsWith('/') ? path : `/${path}`;
    const timeoutMs = options.timeout || 5000;
    const fetchOpts = { cache: 'no-store', ...options };
    delete fetchOpts.timeout;

    for (const base of bases) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(`${base}${route}`, { ...fetchOpts, signal: controller.signal });
        clearTimeout(timer);
        const text = await res.text();
        let data = null;
        const jsonStart = text.indexOf('{');
        if (jsonStart >= 0) {
          try {
            data = JSON.parse(text.slice(jsonStart));
          } catch (_) {}
        }
        return { res, data, base };
      } catch (_) {
        // try next base
      }
    }
    return null;
  }

  if (document.body.classList.contains('dashboard-body')) {
    const bindLayout = () => {
      wireDashLogout();
      wireMobileNav();
      wireQuickAccessCards();
      scrollToPageHash();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindLayout);
    } else {
      bindLayout();
    }
  }

  window.DashAuth = {
    getSupabase,
    waitForSupabaseClient,
    requireSession,
    signOut,
    fetchDashApi,
    wireDashLogout,
    wireMobileNav,
    getLocalUser,
    displayNameFromSession,
    fullDisplayNameFromSession,
    initialsFromSession,
    setAvatarInitials,
    formatJoinedDate,
  };
})();

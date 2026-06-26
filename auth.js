function setAuthTab(mode) {
  const isSignup = mode === 'signup';
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const panelLogin = document.getElementById('panel-login');
  const panelSignup = document.getElementById('panel-signup');

  if (!tabLogin || !tabSignup || !panelLogin || !panelSignup) return;

  tabLogin.classList.toggle('active', !isSignup);
  tabSignup.classList.toggle('active', isSignup);
  tabLogin.setAttribute('aria-selected', !isSignup ? 'true' : 'false');
  tabSignup.setAttribute('aria-selected', isSignup ? 'true' : 'false');

  panelLogin.hidden = isSignup;
  panelSignup.hidden = !isSignup;
}

function applyHashAuthTab() {
  const raw = window.location.hash.replace(/^#+/, '');
  const hash = raw.split('&')[0].trim().toLowerCase();
  if (hash === 'signup' || hash === 'sign-up') setAuthTab('signup');
  else setAuthTab('login');
}

function syncPasswordToggleButton(btn, input) {
  const revealed = input.type === 'text';
  btn.classList.toggle('is-revealed', revealed);
  btn.setAttribute('aria-pressed', revealed ? 'true' : 'false');
  btn.setAttribute('aria-label', revealed ? 'Hide password' : 'Show password');
}

function initPasswordToggles() {
  const root = document.querySelector('.auth-box');
  if (!root) return;

  root.querySelectorAll('.password-toggle').forEach((btn) => {
    const controlId = btn.getAttribute('aria-controls');
    const input = controlId ? document.getElementById(controlId) : null;
    if (input) syncPasswordToggleButton(btn, input);
  });

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.password-toggle');
    if (!btn || !root.contains(btn)) return;
    e.preventDefault();
    const controlId = btn.getAttribute('aria-controls');
    const input = controlId ? document.getElementById(controlId) : null;
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    syncPasswordToggleButton(btn, input);
  });
}

function initAuthTabs() {
  document.querySelectorAll('[data-auth-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-auth-tab') === 'signup' ? 'signup' : 'login';
      setAuthTab(tab);
      history.replaceState(null, '', `#${tab}`);
    });
  });

  document.querySelectorAll('.switch-to-signup').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthTab('signup');
      history.replaceState(null, '', '#signup');
    });
  });

  document.querySelectorAll('.switch-to-login').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthTab('login');
      history.replaceState(null, '', '#login');
    });
  });

  window.addEventListener('hashchange', applyHashAuthTab);
  applyHashAuthTab();
}

function getStoredUsernameMap() {
  try {
    const raw = localStorage.getItem('finovate_usernames');
    const parsed = raw ? JSON.parse(raw) : {};
    if (Array.isArray(parsed)) {
      const map = {};
      parsed.forEach((username) => {
        if (typeof username === 'string') map[username] = '';
      });
      return map;
    }
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

const EMAIL_THROTTLE_KEY = 'finovate_auth_email_throttle';
const EMAIL_THROTTLE_WINDOW_MS = 60 * 1000;
const CLIENT_SIGNUP_PENDING_KEY = 'finovate_signup_pending';
const CLIENT_SIGNUP_CODE_KEY = 'finovate_signup_code_display';

let pendingSignupPayload = null;

function saveStoredUsername(username, email) {
  try {
    const map = getStoredUsernameMap();
    if (!map[username] || (email && !map[username])) {
      map[username] = email || '';
      localStorage.setItem('finovate_usernames', JSON.stringify(map));
    }
  } catch (_) {}
}

function getEmailThrottleData() {
  try {
    const raw = localStorage.getItem(EMAIL_THROTTLE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function canSendAuthEmail(email) {
  if (!email) return false;
  const data = getEmailThrottleData();
  const next = Number(data[email] || 0);
  return Date.now() >= next;
}

function recordAuthEmailSend(email) {
  if (!email) return;
  const data = getEmailThrottleData();
  data[email] = Date.now() + EMAIL_THROTTLE_WINDOW_MS;
  try {
    localStorage.setItem(EMAIL_THROTTLE_KEY, JSON.stringify(data));
  } catch (_) {}
}

function getAuthEmailWaitSeconds(email) {
  const data = getEmailThrottleData();
  const next = Number(data[email] || 0);
  const msLeft = Math.max(0, next - Date.now());
  return Math.ceil(msLeft / 1000);
}

function resolveLoginIdentifier(identifier) {
  const trimmed = String(identifier || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return trimmed;
  const map = getStoredUsernameMap();
  return map[trimmed] || '';
}

function validateSignupUsername(username) {
  const trimmed = String(username || '').trim();
  const rule = /^[A-Za-z0-9_-]{3,15}$/;
  const allOk = rule.test(trimmed);
  const message = !trimmed
    ? 'Username is required.'
    : trimmed.length < 3 || trimmed.length > 15
    ? 'Username must be 3 to 15 characters.'
    : !/^[A-Za-z0-9_-]+$/.test(trimmed)
    ? 'Your username can contain letters, numbers, underscores, and hyphens only.'
    : '';

  return { valid: allOk, trimmed, message };
}

function isUsernameTaken(username) {
  const map = getStoredUsernameMap();
  return Boolean(map[username]);
}

function validateSignupPasswordRules(pw) {
  const lenOk = pw.length >= 10 && pw.length <= 12;
  const hasNum = /\d/.test(pw);
  const hasSym = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw);
  const numSymOk = hasNum && hasSym;
  const caseOk = /[a-z]/.test(pw) && /[A-Z]/.test(pw);

  return {
    length: lenOk,
    numsym: numSymOk,
    case: caseOk,
    allOk: lenOk && numSymOk && caseOk,
  };
}

function updatePasswordRuleUI(pw) {
  const rules = validateSignupPasswordRules(pw);
  document.querySelectorAll('#signup-password-rules .password-rule').forEach((li) => {
    const key = li.getAttribute('data-rule');
    const ok = key && rules[key];
    li.classList.toggle('is-met', Boolean(ok));
  });
}

function getSupabaseClient() {
  return window.supabaseClient;
}

const AUTH_API_URL = new URL('php/api/users.php', window.location.href).href;
const CLIENT_RESET_TOKENS_KEY = 'finovate_reset_tokens';
const LOCAL_SERVER_PORTS = [3000, 3001, 3002, 3003, 8080];

function getServerApiBases() {
  const bases = new Set();
  if (window.location.protocol.startsWith('http')) {
    bases.add(window.location.origin);
  }
  LOCAL_SERVER_PORTS.forEach((p) => {
    bases.add(`http://127.0.0.1:${p}`);
    bases.add(`http://localhost:${p}`);
  });
  return [...bases];
}

let cachedServerBase = null;

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Cache for whether backend is available
let serverCheckCache = { checked: false, available: false, timestamp: 0 };
const SERVER_CHECK_CACHE_TTL = 30000; // 30 seconds

async function discoverFinovateServer() {
  if (cachedServerBase) return cachedServerBase;
  
  // Check cache first (avoid repeated checks)
  const now = Date.now();
  if (serverCheckCache.checked && (now - serverCheckCache.timestamp) < SERVER_CHECK_CACHE_TTL) {
    return serverCheckCache.available ? cachedServerBase : null;
  }

  try {
    const stored = sessionStorage.getItem('finovate_server_base');
    if (stored) {
      try {
        const ping = await fetchWithTimeout(`${stored}/api/health`, { cache: 'no-store' }, 1500);
        if (ping.ok) {
          cachedServerBase = stored;
          serverCheckCache = { checked: true, available: true, timestamp: now };
          return stored;
        }
      } catch (_) {}
    }
  } catch (_) {}

  // Try to find server with parallel requests (much faster)
  const baseUrls = [];
  for (const p of LOCAL_SERVER_PORTS) {
    baseUrls.push(`http://127.0.0.1:${p}`);
    baseUrls.push(`http://localhost:${p}`);
  }

  // Check all in parallel
  const results = await Promise.allSettled(
    baseUrls.map(base =>
      fetchWithTimeout(`${base}/api/health`, { cache: 'no-store' }, 800)
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            return data?.ok ? base : null;
          }
          return null;
        })
        .catch(() => null)
    )
  );

  // Find first successful result
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      cachedServerBase = result.value;
      try {
        sessionStorage.setItem('finovate_server_base', result.value);
      } catch (_) {}
      serverCheckCache = { checked: true, available: true, timestamp: now };
      return result.value;
    }
  }

  serverCheckCache = { checked: true, available: false, timestamp: now };
  return null;
}

async function fetchFromFinovateServer(path, options = {}) {
  const bases = [];
  const discovered = await discoverFinovateServer();
  if (discovered) bases.push(discovered);
  getServerApiBases().forEach((b) => {
    if (!bases.includes(b)) bases.push(b);
  });

  const route = path.startsWith('/') ? path : `/${path}`;
  const timeoutMs = options.timeout || 3000; // Default 3 second timeout
  delete options.timeout; // Remove custom timeout from options

  for (const base of bases) {
    try {
      const res = await fetchWithTimeout(`${base}${route}`, { ...options, cache: 'no-store' }, timeoutMs);
      const text = await res.text();
      const data = parseAuthResponseText(text);
      if (data !== null && typeof data === 'object') {
        return { res, data, base };
      }
    } catch (_) {
      // try next port
    }
  }
  return null;
}

function findLocalAccount(identifier) {
  const trimmed = String(identifier || '').trim();
  if (!trimmed) return null;

  if (typeof findMockUser === 'function') {
    const mock = findMockUser(trimmed);
    if (mock) {
      return {
        email: mock.email,
        fullName: mock.full_name || mock.username,
        username: mock.username,
        source: 'mock',
      };
    }
  }

  try {
    const raw = localStorage.getItem('finovate_user');
    if (raw) {
      const user = JSON.parse(raw);
      const match =
        user &&
        (String(user.email || '').toLowerCase() === trimmed.toLowerCase() ||
          String(user.username || '').toLowerCase() === trimmed.toLowerCase());
      if (match) {
        return {
          email: user.email,
          fullName: user.full_name || user.username,
          username: user.username,
          source: 'session',
        };
      }
    }
  } catch (_) {}

  const mappedEmail = resolveLoginIdentifier(trimmed);
  if (mappedEmail) {
    return { email: mappedEmail, fullName: trimmed, username: trimmed, source: 'map' };
  }

  return null;
}

function createClientResetToken(email) {
  const token =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : `t${Date.now()}${Math.random().toString(36).slice(2)}`;
  try {
    const raw = localStorage.getItem(CLIENT_RESET_TOKENS_KEY);
    const tokens = raw ? JSON.parse(raw) : {};
    tokens[token] = {
      email: String(email).trim().toLowerCase(),
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
    localStorage.setItem(CLIENT_RESET_TOKENS_KEY, JSON.stringify(tokens));
  } catch (_) {}
  return token;
}

async function sendPasswordResetEmailViaServer({ to, resetUrl, fullName }) {
  const result = await fetchFromFinovateServer('/api/email/password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, resetUrl, fullName }),
  });
  return Boolean(result?.data?.success);
}

function isPhpInfrastructureError(data) {
  if (!data || typeof data !== 'object') return true;
  const msg = String(data.message || '').toLowerCase();
  return (
    msg.includes('connection') ||
    msg.includes('database') ||
    msg.includes('query preparation') ||
    msg.includes('query execution') ||
    msg.includes('server error') ||
    msg.includes('php error')
  );
}

function parseAuthResponseText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('<?php') || trimmed.startsWith('<!')) return null;
  const jsonStart = trimmed.indexOf('{');
  if (jsonStart < 0) return null;
  try {
    return JSON.parse(trimmed.slice(jsonStart));
  } catch (_) {
    return null;
  }
}

async function callAuthApi(payload) {
  const result = await fetchFromFinovateServer('/php/api/users.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: cachedServerBase ? 2500 : 4000,
  });
  if (result?.data && typeof result.data === 'object') {
    return { data: result.data, usedPhp: true, base: result.base };
  }
  return { data: null, usedPhp: false };
}

function isDemoIdentifier(identifier) {
  const key = String(identifier || '').trim().toLowerCase();
  return key === 'demo' || key === 'test';
}

/** Synchronous local mock check — no network wait. */
function tryInstantMockLogin(identifier, password) {
  if (typeof ensureDemoUsers === 'function') ensureDemoUsers();
  if (typeof findMockUser !== 'function') return null;
  const user = findMockUser(identifier);
  if (!user || btoa(String(password)) !== user.password) return null;
  if (user.status !== 'active') {
    return { success: false, message: 'User account is not active' };
  }
  return {
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      status: user.status,
      two_factor_enabled: user.two_factor_enabled,
    },
  };
}

/** Login via mock + server in parallel; instant path when credentials match local storage. */
async function runLoginFast(identifier, password) {
  if (typeof ensureDemoUsers === 'function') ensureDemoUsers();

  const instant = tryInstantMockLogin(identifier, password);
  if (instant) return instant;

  if (isDemoIdentifier(identifier)) {
    return (
      (await mockLogin(identifier, password)) || {
        success: false,
        message:
          'Invalid demo credentials. Use username demo and password Demo@1234 (or test / Test@1234).',
      }
    );
  }

  const payload = { action: 'login', username: identifier, password };
  const mockFn = () => mockLogin(identifier, password);

  const [mockResult, serverResult] = await Promise.all([mockFn(), callAuthApi(payload)]);
  const phpData = serverResult?.data;

  if (mockResult?.success) return mockResult;
  if (phpData?.success) return phpData;

  if (phpData && !phpData.success && !isPhpInfrastructureError(phpData)) {
    return phpData;
  }

  return mockResult || phpData || { success: false, message: 'Invalid credentials' };
}

function persistLoginSession(data, identifier) {
  if (!data?.user) return;
  saveStoredUsername(data.user.username || identifier, data.user.email);
  try {
    if (localStorage.getItem('finovate_transactions') == null) {
      localStorage.setItem('finovate_transactions', '[]');
    }
    localStorage.setItem('finovate_user', JSON.stringify(data.user));
    seedProfileFromUser(data.user);
  } catch (_) {}
}

async function runAuthAction(phpPayload, mockFn) {
  if (phpPayload.action === 'login') {
    const identifier = phpPayload.username || phpPayload.email || '';
    return runLoginFast(identifier, phpPayload.password);
  }

  const { data: phpData } = await callAuthApi(phpPayload);

  if (phpData && phpData.success) {
    return phpData;
  }

  if (phpData && !isPhpInfrastructureError(phpData)) {
    return phpData;
  }

  const mockData = await mockFn();
  if (mockData.success && phpData && isPhpInfrastructureError(phpData)) {
    console.info('Using local demo auth (server unavailable).');
  }
  return mockData;
}

function setAuthButtonBusy(btn, busy, label) {
  if (!btn) return;
  btn.disabled = busy;
  if (label) btn.textContent = label;
}

async function sendEmail(to, subject, message) {
  const result = await fetchFromFinovateServer('/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, message }),
  });
  if (result?.data?.success) return { data: true, error: null };

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: { message: 'Email service is not available.' } };
  }
  const payload = { to, subject, message };
  const attempt = await supabase.functions.invoke('bright-action', { body: payload });
  if (!attempt.error) return { data: attempt.data, error: null };
  const attempt2 = await supabase.functions.invoke('bright-action', {
    body: JSON.stringify(payload),
  });
  return { data: attempt2.data, error: attempt2.error };
}

async function requestPasswordReset(identifier) {
  const trimmed = String(identifier || '').trim();
  if (!trimmed) {
    return { error: { message: 'Please enter your email or username.' } };
  }

  const account = findLocalAccount(trimmed);
  const throttleEmail =
    account?.email ||
    (trimmed.includes('@') ? trimmed : resolveLoginIdentifier(trimmed) || '');

  if (throttleEmail && !canSendAuthEmail(throttleEmail)) {
    const wait = getAuthEmailWaitSeconds(throttleEmail);
    return { error: { message: `Please wait ${wait} seconds before requesting another reset email.` } };
  }

  const serverResult = await fetchFromFinovateServer('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: trimmed }),
  });

  if (serverResult?.data?.success) {
    const sentTo = serverResult.data.email || throttleEmail || trimmed;
    recordAuthEmailSend(sentTo);
    const resetUrl = serverResult.data.resetUrl
      ? normalizeResetUrl(serverResult.data.resetUrl)
      : null;
    if (serverResult.data.emailSent === false && resetUrl) {
      return { ok: true, email: sentTo, emailPending: true, resetUrl };
    }
    return {
      ok: true,
      email: sentTo,
      emailSent: true,
      message: serverResult.data.message,
    };
  }

  if (serverResult?.data?.message && serverResult.res?.status !== 404) {
    return { error: { message: serverResult.data.message } };
  }

  if (!account) {
    return {
      error: {
        message:
          'No account found with that email or username. Please sign up first.',
      },
    };
  }

  const serverBase = serverResult?.base || getServerApiBases()[0] || window.location.origin;
  const token = createClientResetToken(account.email);
  const resetUrl = normalizeResetUrl(
    `${serverBase}/reset-password.html?token=${encodeURIComponent(token)}`
  );
  const sent = await sendPasswordResetEmailViaServer({
    to: account.email,
    resetUrl,
    fullName: account.fullName,
  });

  if (!sent) {
    const subject = 'Reset your Finovate password';
    const message =
      `Hi ${account.fullName || 'there'},\n\n` +
      `Reset your password using this link (valid for 1 hour):\n${resetUrl}\n\n` +
      `— Finovate`;
    const mail = await sendEmail(account.email, subject, message);
    if (mail.error) {
      recordAuthEmailSend(account.email);
      return {
        ok: true,
        email: account.email,
        resetUrl: normalizeResetUrl(resetUrl),
        emailPending: true,
      };
    }
  }

  recordAuthEmailSend(account.email);
  return { ok: true, email: account.email };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeResetUrl(url) {
  try {
    const parsed = new URL(String(url), window.location.origin);
    if (
      window.location.hostname === 'localhost' &&
      parsed.hostname === '127.0.0.1' &&
      parsed.port === window.location.port
    ) {
      parsed.hostname = 'localhost';
    }
    return parsed.href;
  } catch {
    return String(url || '');
  }
}

function clearResetLinkFallback() {
  const box = document.getElementById('forgot-password-reset-box');
  if (box) {
    box.innerHTML = '';
    box.hidden = true;
  }
}

function showResetLinkFallback(resetUrl, email) {
  const box = document.getElementById('forgot-password-reset-box');
  if (!box) return;
  const safeUrl = normalizeResetUrl(resetUrl);
  const safeEmail = email ? escapeHtml(email) : '';
  box.innerHTML = `
    <p class="auth-reset-fallback-title">We could not send the reset email${safeEmail ? ` to <strong>${safeEmail}</strong>` : ''}.</p>
    <p class="auth-reset-fallback-hint">Use this link to reset your password (valid for 1 hour):</p>
    <a href="${escapeHtml(safeUrl)}" class="auth-reset-fallback-link">Reset my password</a>
  `;
  box.hidden = false;
}

function setForgotPasswordStatus(message, tone) {
  const status = document.getElementById('forgot-password-status');
  if (!status) return;
  status.textContent = message || '';
  status.classList.remove('form-feedback--success', 'form-feedback--warn');
  if (tone === 'success') status.classList.add('form-feedback--success');
  if (tone === 'warn') status.classList.add('form-feedback--warn');
  status.hidden = !message;
}

function setForgotPasswordBusy(busy, message, tone) {
  const link = document.getElementById('forgot-password-link');
  if (link) link.disabled = busy;
  if (message !== undefined) setForgotPasswordStatus(message, tone);
}

function showSignupStep(step) {
  const form = document.getElementById('signup-step-form');
  const verify = document.getElementById('signup-step-verify');
  if (form) form.hidden = step !== 'form';
  if (verify) verify.hidden = step !== 'verify';
}

function setSignupVerifyStatus(message, tone) {
  const status = document.getElementById('signup-verify-status');
  if (!status) return;
  status.textContent = message || '';
  status.classList.remove('form-feedback--success', 'form-feedback--warn');
  if (tone === 'success') status.classList.add('form-feedback--success');
  if (tone === 'warn') status.classList.add('form-feedback--warn');
  status.hidden = !message;
}

function stashSignupVerificationCode(code, email) {
  if (!code) return;
  try {
    sessionStorage.setItem(
      CLIENT_SIGNUP_CODE_KEY,
      JSON.stringify({
        code: String(code),
        email: String(email || '').toLowerCase(),
        expiresAt: Date.now() + 15 * 60 * 1000,
      })
    );
  } catch (_) {}
}

function readStashedSignupVerificationCode(email) {
  try {
    const raw = sessionStorage.getItem(CLIENT_SIGNUP_CODE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Number(data.expiresAt) < Date.now()) return null;
    const wanted = String(email || '').toLowerCase();
    if (wanted && data.email && data.email !== wanted) return null;
    return data.code || null;
  } catch (_) {
    return null;
  }
}

function showSignupVerificationCodeFallback(code) {
  const box = document.getElementById('signup-verify-code-display');
  if (!box) return;
  if (!code) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  box.innerHTML =
    `<p class="auth-reset-fallback-hint">Did not get the email? Use this code:</p>` +
    `<p class="auth-verify-code-value">${escapeHtml(String(code))}</p>`;
  box.hidden = false;
}

function revealSignupVerificationCode(email) {
  const code = readStashedSignupVerificationCode(email);
  if (!code) {
    setSignupVerifyStatus(
      'No code saved yet. Tap Resend code to generate a new verification code.',
      'warn'
    );
    return;
  }
  showSignupVerificationCodeFallback(code);
  setSignupVerifyStatus('Your verification code is shown below.', 'warn');
}

async function checkSignupAvailability(payload) {
  if (typeof mockSignupConflictMessage === 'function') {
    const mockMsg = mockSignupConflictMessage(payload);
    if (mockMsg) return { ok: false, message: mockMsg };
  }

  const result = await fetchFromFinovateServer('/api/auth/signup/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: payload.username,
      email: payload.email,
    }),
    timeout: 4000,
  });

  if (result?.data?.success === false) {
    return { ok: false, message: result.data.message || 'Account already exists.' };
  }

  return { ok: true };
}

function seedTwoFactorSettings(user) {
  try {
    const id = user?.id || user?.email || 'guest';
    const key = `finovate_settings_${id}`;
    const raw = localStorage.getItem(key);
    const stored = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      key,
      JSON.stringify({
        ...stored,
        twoFa: 'enabled',
        fullName: user?.full_name || stored.fullName || '',
        email: user?.email || stored.email || '',
      })
    );
  } catch (_) {}
}

function collectSignupForm() {
  const name = document.getElementById('signup-name')?.value.trim() ?? '';
  const username = document.getElementById('signup-username')?.value.trim() ?? '';
  const email = document.getElementById('signup-email')?.value.trim() ?? '';
  const pw = document.getElementById('signup-password')?.value ?? '';
  const pw2 = document.getElementById('signup-password-confirm')?.value ?? '';

  if (!name || !username || !email) {
    return { error: 'Please enter your name, username, and email.' };
  }
  const usernameRule = validateSignupUsername(username);
  if (!usernameRule.valid) {
    return { error: usernameRule.message };
  }
  const rules = validateSignupPasswordRules(pw);
  if (!rules.allOk) {
    const parts = [];
    if (!rules.length) parts.push('Use 10–12 characters.');
    if (!rules.numsym) parts.push('Include at least one number and one symbol.');
    if (!rules.case) parts.push('Include uppercase and lowercase letters.');
    return { error: `Password requirements:\n• ${parts.join('\n• ')}` };
  }
  if (pw !== pw2) {
    return { error: 'Passwords do not match.' };
  }

  return {
    payload: {
      username: usernameRule.trimmed,
      email,
      password: pw,
      full_name: name,
    },
  };
}

async function sendSignupVerificationCode(payload) {
  const result = await fetchFromFinovateServer('/api/auth/signup/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (result?.data?.success) {
    const verificationCode = result.data.verificationCode;
    if (verificationCode) {
      stashSignupVerificationCode(verificationCode, payload.email);
    }
    return {
      ok: true,
      email: result.data.email || payload.email,
      emailSent: Boolean(result.data.emailSent),
      message: result.data.message,
      verificationCode,
    };
  }

  if (result?.data?.message) {
    return { ok: false, message: result.data.message };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  stashSignupVerificationCode(code, payload.email);
  sessionStorage.setItem(
    CLIENT_SIGNUP_PENDING_KEY,
    JSON.stringify({
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
      payload,
    })
  );
  return {
    ok: true,
    email: payload.email,
    emailSent: false,
    verificationCode: code,
  };
}

async function verifySignupCode(email, code) {
  const result = await fetchFromFinovateServer('/api/auth/signup/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  if (result?.data?.success) {
    sessionStorage.removeItem(CLIENT_SIGNUP_PENDING_KEY);
    return { ok: true, data: result.data };
  }

  const raw = sessionStorage.getItem(CLIENT_SIGNUP_PENDING_KEY);
  if (raw && pendingSignupPayload) {
    try {
      const pending = JSON.parse(raw);
      if (
        String(pending.payload?.email || '').toLowerCase() === String(email).toLowerCase() &&
        String(pending.code) === String(code).trim() &&
        Number(pending.expiresAt) > Date.now()
      ) {
        sessionStorage.removeItem(CLIENT_SIGNUP_PENDING_KEY);
        const data = await runAuthAction(
          { action: 'register', ...pending.payload },
          () => mockRegister(pending.payload)
        );
        if (data.success) return { ok: true, data };
        return { ok: false, message: data.message || 'Registration failed.' };
      }
    } catch (_) {}
  }

  return {
    ok: false,
    message: result?.data?.message || 'Invalid or expired verification code.',
  };
}

function finishSignup(data, payload) {
  const username = payload.username;
  const email = payload.email;
  const name = payload.full_name;

  saveStoredUsername(username, email);

  const userRecord = data.user || {
    id: data.user_id || Date.now(),
    username,
    email,
    full_name: name,
    status: 'active',
    two_factor_enabled: true,
    created_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem('finovate_transactions', '[]');
    localStorage.setItem('finovate_user', JSON.stringify(userRecord));
    seedProfileFromUser(userRecord);
    seedTwoFactorSettings(userRecord);
  } catch (_) {}

  pendingSignupPayload = null;
  showSignupStep('form');
  document.getElementById('signup-verify-code').value = '';
  showSignupVerificationCodeFallback(null);

  sendWelcomeEmail({ email, fullName: name, username }).then((result) => {
    if (result.ok) {
      alert(
        'Account created with 2FA enabled! A welcome email was sent to ' +
          email +
          '. You can now log in.'
      );
    } else {
      alert('Account created with 2FA enabled! You can now log in.');
    }
  });

  setAuthTab('login');
  document.getElementById('login-email').value = username;
  document.getElementById('login-password').value = '';
}

function warnIfOpenedAsFile() {
  if (window.location.protocol !== 'file:') return;
  let bar = document.getElementById('finovate-file-protocol-warning');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'finovate-file-protocol-warning';
    bar.style.cssText =
      'background:#7f1d1d;color:#fecaca;padding:14px 16px;text-align:center;font-size:0.95rem;border-bottom:2px solid #f87171;';
    document.body.prepend(bar);
  }
  const url = 'http://localhost:3000/auth.html';
  bar.innerHTML = `Double-click <strong>START.bat</strong>, then open <a href="${url}" style="color:#fef08a;font-weight:700">${url}</a>`;
}

async function redirectIfFileProtocol() {
  if (window.location.protocol !== 'file:') return false;
  const base = await discoverFinovateServer();
  if (base) {
    window.location.replace(`${base}/auth.html${window.location.hash || '#login'}`);
    return true;
  }
  return false;
}

function seedProfileFromUser(user) {
  if (!user || user.id == null) return;
  const key = `finovate_profile_data_${user.id}`;
  try {
    let stored = {};
    const raw = localStorage.getItem(key);
    if (raw) stored = JSON.parse(raw);
    localStorage.setItem(
      key,
      JSON.stringify({
        fullName: stored.fullName || user.full_name || '',
        username: stored.username || user.username || '',
        email: stored.email || user.email || '',
        bio: stored.bio || '',
        phone: stored.phone || '',
        location: stored.location || '',
        occupation: stored.occupation || '',
        photoUrl: stored.photoUrl || '',
        joined: stored.joined || '',
      })
    );
  } catch (_) {}
}

async function sendWelcomeEmail({ email, fullName, username }) {
  const base = (await discoverFinovateServer()) || window.location.origin;
  const origin = base.startsWith('http') ? base : window.location.origin;
  const payload = { to: email, fullName, username };
  const welcome = await fetchFromFinovateServer('/api/email/welcome', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (welcome?.data?.success) return { ok: true };

  const displayName = fullName || username;
  const subject = 'Welcome to Finovate — you have been signed up';
  const message =
    `Hi ${displayName},\n\n` +
    `You have been automatically signed up for Finovate.\n\n` +
    `Your username: @${username}\n` +
    `Email: ${email}\n\n` +
    `Log in anytime at ${origin}/auth.html\n\n` +
    `— The Finovate Team`;

  const { error } = await sendEmail(email, subject, message);
  return { ok: !error };
}

async function completePasswordReset(newPassword, accessToken) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: { message: 'Supabase client not available.' } };
  }
  const { data, error } = await supabase.auth.updateUser(accessToken, {
    password: newPassword,
  });
  return { data, error };
}

// ============================================================================
// OPTIMIZED REAL-TIME VALIDATION & FEEDBACK SYSTEM
// ============================================================================

// Debounced duplicate detection timers
let signupUsernameDuplicateTimer = null;
let signupEmailDuplicateTimer = null;

// Real-time validation for login
function validateLoginEmail(email) {
  const trimmed = String(email || '').trim();
  if (!trimmed) return { valid: false, message: '' };
  if (trimmed.length < 3) return { valid: false, message: 'Email or username is too short.' };
  return { valid: true, message: '' };
}

function validateLoginPassword(password) {
  const trimmed = String(password || '').trim();
  if (!trimmed) return { valid: false, message: '' };
  if (trimmed.length < 4) return { valid: false, message: 'Password must be at least 4 characters.' };
  return { valid: true, message: '' };
}

// Set inline feedback for form fields
function setFieldFeedback(fieldId, message, tone = '') {
  const feedbackId = `${fieldId}-feedback`;
  const feedback = document.getElementById(feedbackId);
  if (!feedback) return;
  
  feedback.textContent = message || '';
  feedback.classList.remove('form-feedback--success', 'form-feedback--warn');
  if (tone === 'success') feedback.classList.add('form-feedback--success');
  if (tone === 'warn') feedback.classList.add('form-feedback--warn');
  feedback.hidden = !message;
}

function setGeneralFeedback(formId, message, tone = '') {
  const feedbackId = `${formId}-general-feedback`;
  const feedback = document.getElementById(feedbackId);
  if (!feedback) return;
  
  feedback.textContent = message || '';
  feedback.classList.remove('form-feedback--success', 'form-feedback--warn');
  if (tone === 'success') feedback.classList.add('form-feedback--success');
  if (tone === 'warn') feedback.classList.add('form-feedback--warn');
  feedback.hidden = !message;
}

// Real-time email/username validation for signup with debounced duplicate detection
async function validateSignupEmailRealTime(email) {
  const trimmed = String(email || '').trim();
  
  if (!trimmed) {
    setFieldFeedback('signup-email', '');
    return { valid: false };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    setFieldFeedback('signup-email', 'Please enter a valid email address.', 'warn');
    return { valid: false };
  }
  
  // Debounced duplicate check (300ms delay)
  return new Promise((resolve) => {
    clearTimeout(signupEmailDuplicateTimer);
    signupEmailDuplicateTimer = setTimeout(async () => {
      try {
        const available = await checkSignupAvailability({
          username: document.getElementById('signup-username')?.value.trim() || '',
          email: trimmed,
        });
        
        if (!available.ok) {
          setFieldFeedback('signup-email', '❌ ' + available.message, 'warn');
          resolve({ valid: false, duplicate: true });
        } else {
          setFieldFeedback('signup-email', '✓ Email is available', 'success');
          resolve({ valid: true });
        }
      } catch (err) {
        setFieldFeedback('signup-email', '');
        resolve({ valid: true });
      }
    }, 300);
  });
}

// Real-time username validation for signup with debounced duplicate detection
async function validateSignupUsernameRealTime(username) {
  const result = validateSignupUsername(username);
  
  if (!result.valid) {
    setFieldFeedback('signup-username', result.message, 'warn');
    return { valid: false };
  }
  
  // Debounced duplicate check (300ms delay)
  return new Promise((resolve) => {
    clearTimeout(signupUsernameDuplicateTimer);
    signupUsernameDuplicateTimer = setTimeout(async () => {
      try {
        const available = await checkSignupAvailability({
          username: result.trimmed,
          email: document.getElementById('signup-email')?.value.trim() || '',
        });
        
        if (!available.ok) {
          setFieldFeedback('signup-username', '❌ ' + available.message, 'warn');
          resolve({ valid: false, duplicate: true });
        } else {
          setFieldFeedback('signup-username', '✓ Username is available', 'success');
          resolve({ valid: true });
        }
      } catch (err) {
        setFieldFeedback('signup-username', '✓ Username looks good', 'success');
        resolve({ valid: true });
      }
    }, 300);
  });
}

// Real-time password validation
function validateSignupPasswordRealTime(password, confirmPassword) {
  const rules = validateSignupPasswordRules(password);
  
  if (!password) {
    setFieldFeedback('signup-password', '');
    setFieldFeedback('signup-password-confirm', '');
    return { valid: false };
  }
  
  let message = '';
  if (!rules.length) message = 'Password must be 10–12 characters.';
  else if (!rules.numsym) message = 'Include at least one number and one symbol (e.g., !@#).';
  else if (!rules.case) message = 'Include both uppercase and lowercase letters.';
  
  if (message) {
    setFieldFeedback('signup-password', message, 'warn');
    setFieldFeedback('signup-password-confirm', '');
    return { valid: false };
  }
  
  // Check confirm password match
  if (confirmPassword && confirmPassword !== password) {
    setFieldFeedback('signup-password', '✓ Password is valid', 'success');
    setFieldFeedback('signup-password-confirm', 'Passwords do not match.', 'warn');
    return { valid: false };
  }
  
  if (confirmPassword === password) {
    setFieldFeedback('signup-password', '✓ Password is valid', 'success');
    setFieldFeedback('signup-password-confirm', '✓ Passwords match', 'success');
    return { valid: true };
  }
  
  setFieldFeedback('signup-password', '✓ Password is valid', 'success');
  if (confirmPassword) setFieldFeedback('signup-password-confirm', 'Confirm your password.', '');
  return { valid: rules.allOk };
}

// Check if all signup fields are valid
function isSignupFormValid() {
  const nameEl = document.getElementById('signup-name');
  const usernameEl = document.getElementById('signup-username');
  const emailEl = document.getElementById('signup-email');
  const pwEl = document.getElementById('signup-password');
  const pw2El = document.getElementById('signup-password-confirm');
  
  const name = nameEl?.value.trim() ?? '';
  const username = usernameEl?.value.trim() ?? '';
  const email = emailEl?.value.trim() ?? '';
  const pw = pwEl?.value ?? '';
  const pw2 = pw2El?.value ?? '';
  
  if (!name || !username || !email || !pw || !pw2) return false;
  
  const usernameValid = validateSignupUsername(username).valid;
  const pwValid = validateSignupPasswordRules(pw).allOk;
  const matchesValid = pw === pw2;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = emailRegex.test(email);
  
  return usernameValid && pwValid && matchesValid && emailValid;
}

// Check if login form is valid
function isLoginFormValid() {
  const emailEl = document.getElementById('login-email');
  const pwEl = document.getElementById('login-password');
  
  const email = emailEl?.value.trim() ?? '';
  const pw = pwEl?.value.trim() ?? '';
  
  return email.length >= 3 && pw.length >= 4;
}

function bootAuthPage() {
  initAuthTabs();
  initPasswordToggles();

  const loginSubmitBtn = document.querySelector('.login-submit-btn');
  const signupSubmitBtn = document.querySelector('.signup-submit-btn');

  if (loginSubmitBtn) {
    const submitLogin = async () => {
      setGeneralFeedback('login', '');
      const identifier = document.getElementById('login-email')?.value.trim() ?? '';
      const password = document.getElementById('login-password')?.value ?? '';
      
      // Validate before submission
      if (!identifier || !password) {
        setGeneralFeedback('login', 'Please enter your username/email and password.', 'warn');
        return;
      }

      setAuthButtonBusy(loginSubmitBtn, true, 'Logging in…');
      try {
        const loginPromise = runLoginFast(identifier, password);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Login took too long. Please try again.')), 6000)
        );

        const data = await Promise.race([loginPromise, timeoutPromise]);

        if (!data || !data.success) {
          const errorMsg = data?.message || 'Login failed. Please check your username and password. If you don\'t have an account, please Sign Up.';
          setGeneralFeedback('login', errorMsg, 'warn');
          return;
        }

        setGeneralFeedback('login', '✓ Login successful! Redirecting…', 'success');
        persistLoginSession(data, identifier);
        setTimeout(() => {
          window.location.href = 'dashboard/dashboard.html';
        }, 300);
      } catch (err) {
        const errorMsg = err?.message || 'Something went wrong. Please try again.';
        setGeneralFeedback('login', errorMsg, 'warn');
        console.error(err);
      } finally {
        setAuthButtonBusy(loginSubmitBtn, false, 'Log In');
      }
    };
    
    loginSubmitBtn.addEventListener('click', submitLogin);
    
    // Add Enter key support for login form
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    if (loginEmailInput) {
      loginEmailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !loginSubmitBtn.disabled) submitLogin();
      });
    }
    if (loginPasswordInput) {
      loginPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !loginSubmitBtn.disabled) submitLogin();
      });
    }
  }

  const signupPwInput = document.getElementById('signup-password');
  if (signupPwInput) {
    const syncRules = () => updatePasswordRuleUI(signupPwInput.value);
    signupPwInput.addEventListener('input', syncRules);
    signupPwInput.addEventListener('change', syncRules);
    syncRules();
  }

  const forgotPasswordBtn = document.getElementById('forgot-password-link');
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async () => {
      const loginField = document.getElementById('login-email');
      const defaultId = loginField?.value?.trim() ?? '';
      const identifier = prompt(
        'Enter your registered email or username to reset your password:',
        defaultId
      );
      if (!identifier) return;
      const resolvedId = identifier.trim();

      clearResetLinkFallback();
      setForgotPasswordBusy(true, 'Sending reset email…');
      try {
        const result = await requestPasswordReset(resolvedId);
        if (result.error) {
          clearResetLinkFallback();
          setForgotPasswordBusy(false, result.error.message || 'Unable to send password reset email.');
          return;
        }
        if (result.emailPending && result.resetUrl) {
          showResetLinkFallback(result.resetUrl, result.email);
          setForgotPasswordBusy(
            false,
            'Email could not be delivered. Click the reset link below.',
            'warn'
          );
          return;
        }
        clearResetLinkFallback();
        setForgotPasswordBusy(
          false,
          result.message ||
            `Password reset email sent to ${result.email}. Check your inbox and spam folder.`,
          'success'
        );
      } finally {
        if (document.getElementById('forgot-password-link')?.disabled) {
          setForgotPasswordBusy(false, '');
        }
      }
    });
  }

  const signupUsernameInput = document.getElementById('signup-username');
  const signupUsernameFeedback = document.getElementById('signup-username-feedback');
  if (signupUsernameInput && signupUsernameFeedback) {
    const syncUsernameFeedback = async () => {
      const value = signupUsernameInput.value;
      if (!value) {
        setFieldFeedback('signup-username', '');
        return;
      }
      await validateSignupUsernameRealTime(value);
    };
    signupUsernameInput.addEventListener('input', syncUsernameFeedback);
    signupUsernameInput.addEventListener('change', syncUsernameFeedback);
    syncUsernameFeedback();
  }
  
  // Real-time email validation
  const signupEmailInput = document.getElementById('signup-email');
  if (signupEmailInput) {
    signupEmailInput.addEventListener('input', () => validateSignupEmailRealTime(signupEmailInput.value));
    signupEmailInput.addEventListener('change', () => validateSignupEmailRealTime(signupEmailInput.value));
  }
  
  // Real-time password validation
  const signupPwConfirmInput = document.getElementById('signup-password-confirm');
  if (signupPwConfirmInput) {
    signupPwConfirmInput.addEventListener('input', () => {
      validateSignupPasswordRealTime(
        document.getElementById('signup-password')?.value || '',
        signupPwConfirmInput.value
      );
    });
    signupPwConfirmInput.addEventListener('change', () => {
      validateSignupPasswordRealTime(
        document.getElementById('signup-password')?.value || '',
        signupPwConfirmInput.value
      );
    });
  }
  
  // Full name validation
  const signupNameInput = document.getElementById('signup-name');
  if (signupNameInput) {
    signupNameInput.addEventListener('input', () => {
      const name = signupNameInput.value.trim();
      if (!name) {
        setFieldFeedback('signup-name', '');
      } else if (name.length < 2) {
        setFieldFeedback('signup-name', 'Please enter your full name.', 'warn');
      } else {
        setFieldFeedback('signup-name', '✓ Name looks good', 'success');
      }
    });
  }

  if (signupSubmitBtn) {
    signupSubmitBtn.addEventListener('click', async () => {
      setGeneralFeedback('signup', '');
      const collected = collectSignupForm();
      if (collected.error) {
        setGeneralFeedback('signup', collected.error, 'warn');
        return;
      }

      setAuthButtonBusy(signupSubmitBtn, true, 'Checking account…');
      try {
        const available = await checkSignupAvailability(collected.payload);
        if (!available.ok) {
          setGeneralFeedback('signup', available.message, 'warn');
          setAuthButtonBusy(signupSubmitBtn, false, 'Continue');
          return;
        }

        setAuthButtonBusy(signupSubmitBtn, true, 'Sending code…');
        pendingSignupPayload = collected.payload;
        const sent = await sendSignupVerificationCode(collected.payload);
        if (!sent.ok) {
          setGeneralFeedback('signup', sent.message || 'Could not start verification. Please try again.', 'warn');
          setAuthButtonBusy(signupSubmitBtn, false, 'Continue');
          return;
        }

        const hint = document.getElementById('signup-verify-email-hint');
        if (hint) {
          hint.textContent = sent.emailSent
            ? `Enter the 6-digit code we sent to ${sent.email}. Did not receive it? Click “Show verification code”.`
            : `Enter the 6-digit code for ${sent.email} (shown below).`;
        }

        if (sent.verificationCode) {
          stashSignupVerificationCode(sent.verificationCode, sent.email);
        }
        showSignupVerificationCodeFallback(
          sent.emailSent ? null : sent.verificationCode
        );
        setSignupVerifyStatus(
          sent.message ||
            (sent.emailSent
              ? '✓ Check your inbox and spam folder for the 6-digit code.'
              : '✓ Email could not be sent — use the code shown below.'),
          sent.emailSent ? 'success' : 'warn'
        );
        document.getElementById('signup-verify-code').value = '';
        showSignupStep('verify');
        setGeneralFeedback('signup', '');
      } catch (err) {
        setGeneralFeedback('signup', 'Something went wrong. Please try again.', 'warn');
        console.error(err);
      } finally {
        setAuthButtonBusy(signupSubmitBtn, false, 'Continue');
      }
    });
  }

  const signupVerifyBtn = document.querySelector('.signup-verify-btn');
  if (signupVerifyBtn) {
    signupVerifyBtn.addEventListener('click', async () => {
      if (!pendingSignupPayload) {
        setSignupVerifyStatus('Please complete the sign-up form first.', 'warn');
        showSignupStep('form');
        return;
      }
      const code = document.getElementById('signup-verify-code')?.value.trim() ?? '';
      if (!/^\d{6}$/.test(code)) {
        setSignupVerifyStatus('Enter the 6-digit code from your email.', 'warn');
        return;
      }

      setAuthButtonBusy(signupVerifyBtn, true, 'Verifying…');
      try {
        const verified = await verifySignupCode(pendingSignupPayload.email, code);
        if (!verified.ok) {
          setSignupVerifyStatus(verified.message || 'Invalid code.', 'warn');
          return;
        }
        finishSignup(verified.data, pendingSignupPayload);
      } catch (err) {
        alert('Something went wrong. Please try again.');
        console.error(err);
      } finally {
        setAuthButtonBusy(signupVerifyBtn, false, 'Verify and create account');
      }
    });
  }

  const signupShowCodeBtn = document.getElementById('signup-show-code-btn');
  if (signupShowCodeBtn) {
    signupShowCodeBtn.addEventListener('click', () => {
      if (!pendingSignupPayload?.email) {
        setSignupVerifyStatus('Complete step 1 first.', 'warn');
        showSignupStep('form');
        return;
      }
      revealSignupVerificationCode(pendingSignupPayload.email);
    });
  }

  const signupResendBtn = document.querySelector('.signup-resend-code-btn');
  if (signupResendBtn) {
    signupResendBtn.addEventListener('click', async () => {
      if (!pendingSignupPayload) {
        showSignupStep('form');
        return;
      }
      setAuthButtonBusy(signupResendBtn, true, 'Resending…');
      try {
        const sent = await sendSignupVerificationCode(pendingSignupPayload);
        if (!sent.ok) {
          setSignupVerifyStatus(sent.message || 'Could not resend code.', 'warn');
          return;
        }
        if (sent.verificationCode) {
          stashSignupVerificationCode(sent.verificationCode, sent.email);
        }
        showSignupVerificationCodeFallback(
          sent.emailSent ? null : sent.verificationCode
        );
        setSignupVerifyStatus(
          sent.message ||
            (sent.emailSent
              ? 'A new code was sent to your email. You can also click Show verification code.'
              : 'New code shown below.'),
          sent.emailSent ? 'success' : 'warn'
        );
      } finally {
        setAuthButtonBusy(signupResendBtn, false, 'Resend code');
      }
    });
  }
}

async function initAuthPage() {
  if (typeof ensureDemoUsers === 'function') ensureDemoUsers();
  discoverFinovateServer().catch(() => {});

  if (window.location.protocol === 'file:') {
    const redirected = await redirectIfFileProtocol();
    if (redirected) return;
    warnIfOpenedAsFile();
  }
  bootAuthPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthPage);
} else {
  initAuthPage();
}
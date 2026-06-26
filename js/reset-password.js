function getSupabaseClient() {
  return window.supabaseClient;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  let value = params.get(name);
  if (value) return value;
  const hash = window.location.hash.replace(/^#/, '');
  const hashParams = new URLSearchParams(hash);
  value = hashParams.get(name);
  return value || '';
}

function parseResetTokens() {
  const params = new URLSearchParams(window.location.search);
  const rawHash = window.location.hash.replace(/^#/, '');
  const hash = rawHash.startsWith('/') ? rawHash.slice(1) : rawHash;
  const hashParams = new URLSearchParams(hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : hash);

  const accessToken =
    params.get('access_token') ||
    params.get('accessToken') ||
    hashParams.get('access_token') ||
    hashParams.get('accessToken') ||
    '';
  const refreshToken =
    params.get('refresh_token') ||
    params.get('refreshToken') ||
    hashParams.get('refresh_token') ||
    hashParams.get('refreshToken') ||
    '';

  return { accessToken, refreshToken };
}

const CLIENT_RESET_TOKENS_KEY = 'finovate_reset_tokens';
const MOCK_USERS_KEY = 'finovate_mock_users';
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

function getClientResetEntry(token) {
  try {
    const raw = localStorage.getItem(CLIENT_RESET_TOKENS_KEY);
    const tokens = raw ? JSON.parse(raw) : {};
    const entry = tokens[token];
    if (!entry || Number(entry.expiresAt) <= Date.now()) return null;
    return entry;
  } catch {
    return null;
  }
}

function consumeClientResetToken(token) {
  try {
    const raw = localStorage.getItem(CLIENT_RESET_TOKENS_KEY);
    const tokens = raw ? JSON.parse(raw) : {};
    const entry = tokens[token];
    if (!entry || Number(entry.expiresAt) <= Date.now()) return null;
    delete tokens[token];
    localStorage.setItem(CLIENT_RESET_TOKENS_KEY, JSON.stringify(tokens));
    return entry;
  } catch {
    return null;
  }
}

function saveMockUserRecord(username, userData) {
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY);
    const users = raw ? JSON.parse(raw) : {};
    users[username] = userData;
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  } catch (_) {}
}

function updateLocalPassword(email, newPassword) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return;

  let changed = false;
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY);
    if (raw) {
      const users = JSON.parse(raw);
      Object.keys(users).forEach((key) => {
        const u = users[key];
        if (u && String(u.email || '').toLowerCase() === normalized) {
          u.password = btoa(newPassword);
          changed = true;
        }
      });
      if (changed) localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    }
  } catch (_) {}

  if (changed) return;

  let username = '';
  let fullName = normalized.split('@')[0];
  try {
    const sessionRaw = localStorage.getItem('finovate_user');
    if (sessionRaw) {
      const sessionUser = JSON.parse(sessionRaw);
      if (sessionUser && String(sessionUser.email || '').toLowerCase() === normalized) {
        username = String(sessionUser.username || '').trim();
        fullName = sessionUser.full_name || sessionUser.username || fullName;
      }
    }
  } catch (_) {}

  if (!username) username = fullName || `user_${Date.now()}`;

  saveMockUserRecord(username, {
    id: Date.now(),
    username,
    email: normalized,
    password: btoa(newPassword),
    full_name: fullName,
    status: 'active',
    created_at: new Date().toISOString(),
  });
}

async function verifyAppResetToken(token) {
  if (getClientResetEntry(token)) return true;

  const bases = getServerApiBases();
  for (const base of bases) {
    try {
      const url = `${base}/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data?.success) return true;
    } catch (_) {}
  }
  return false;
}

async function resetPasswordWithAppToken(token, password) {
  const bases = getServerApiBases();
  for (const base of bases) {
    try {
      const res = await fetch(`${base}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
        cache: 'no-store',
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return { success: false, message: 'Invalid server response.' };
      }
      if (data?.success) {
        if (data.email) updateLocalPassword(data.email, password);
        return data;
      }
    } catch (_) {}
  }

  const clientEntry = getClientResetEntry(token);
  if (clientEntry) {
    const consumed = consumeClientResetToken(token);
    if (!consumed) {
      return { success: false, message: 'This reset link has expired. Request a new one.' };
    }
    updateLocalPassword(consumed.email, password);
    return { success: true, message: 'Password updated', email: consumed.email };
  }

  return { success: false, message: 'Could not reach the server. Start the app with npm start.' };
}

async function restoreResetSession() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: { message: 'Supabase client not available.' }, session: null };
  }

  const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
  if (!error && data?.session) {
    return { error: null, session: data.session };
  }

  const { accessToken, refreshToken } = parseResetTokens();
  if (accessToken && refreshToken) {
    const restore = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    return { error: restore.error, session: restore.data?.session ?? null };
  }

  return { error, session: null };
}

async function completePasswordResetSupabase(newPassword) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: { message: 'Supabase client not available.' } };
  }
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}

function wirePasswordToggle() {
  const toggles = [
    { inputId: 'reset-password', buttonId: 'toggle-reset-password' },
    { inputId: 'reset-password-confirm', buttonId: 'toggle-reset-password-confirm' },
  ];

  toggles.forEach(({ inputId, buttonId }) => {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(buttonId);
    if (!input || !btn) return;
    btn.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', show ? 'true' : 'false');
    });
  });
}

function showStatus(message, isError = false) {
  const status = document.getElementById('reset-status');
  if (!status) return;
  status.textContent = message;
  status.className = isError ? 'auth-status auth-status--error' : 'auth-status auth-status--success';
}

function validatePassword(password, confirm) {
  if (!password || !confirm) return 'Please enter and confirm your new password.';
  if (password !== confirm) return 'Passwords do not match.';
  if (password.length < 10 || password.length > 64) return 'Password must be 10 to 64 characters.';
  return '';
}

async function bootResetPasswordPage() {
  wirePasswordToggle();

  const appToken = getQueryParam('token');
  let session = null;
  let useAppToken = false;

  if (appToken) {
    const valid = await verifyAppResetToken(appToken);
    if (valid) {
      useAppToken = true;
      showStatus('Reset link recognized. Enter your new password below.', false);
    } else {
      showStatus(
        'This reset link is invalid or has expired. Please request a new reset email from the login page.',
        true
      );
    }
  } else {
    const restored = await restoreResetSession();
    session = restored.session;
    if (restored.error || !session) {
      const hasToken = Boolean(
        getQueryParam('access_token') ||
          getQueryParam('accessToken') ||
          window.location.hash.includes('access_token')
      );
      showStatus(
        hasToken
          ? 'The reset link was not recognized. Please click the link in your reset email again.'
          : 'The password reset link is missing or invalid. Please request a new reset email from login.',
        true
      );
    } else {
      showStatus('Reset link recognized. Enter your new password below.', false);
    }
  }

  document.getElementById('reset-password-btn')?.addEventListener('click', async () => {
    const password = document.getElementById('reset-password')?.value || '';
    const confirm = document.getElementById('reset-password-confirm')?.value || '';
    const errorMessage = validatePassword(password, confirm);
    if (errorMessage) {
      showStatus(errorMessage, true);
      return;
    }

    if (useAppToken) {
      if (!appToken) {
        showStatus('Reset link is missing. Please open the link from your email again.', true);
        return;
      }
      showStatus('Saving password...', false);
      const result = await resetPasswordWithAppToken(appToken, password);
      if (!result.success) {
        showStatus(result.message || 'Unable to reset password. Please try again.', true);
        return;
      }
      showStatus('Password was reset successfully. You may now sign in with your new password.');
      return;
    }

    if (!session) {
      showStatus(
        'Unable to complete reset without a valid reset session. Please reopen the link from your email.',
        true
      );
      return;
    }
    showStatus('Saving password...', false);
    const { error: updateError } = await completePasswordResetSupabase(password);
    if (updateError) {
      showStatus(updateError.message || 'Unable to reset password. Please try again.', true);
      return;
    }
    showStatus('Password was reset successfully. You may now sign in with your new password.');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootResetPasswordPage);
} else {
  bootResetPasswordPage();
}

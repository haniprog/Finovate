/**
 * Shared profile storage and header avatar across dashboard pages.
 */
(function initDashProfile() {
  const PROFILE_STORAGE_PREFIX = 'finovate_profile_data';
  const LOCAL_USER_KEY = 'finovate_user';

  const DEFAULT_PROFILE = {
    fullName: '',
    username: '',
    email: '',
    bio: '',
    phone: '',
    location: '',
    occupation: '',
    photoUrl: '',
    bankName: '',
    bankLast4: '',
    ewalletProvider: '',
    ewalletRef: '',
  };

  function getProfileStorageKey(session) {
    const id = session?.user?.id || session?.user?.email || 'guest';
    return `${PROFILE_STORAGE_PREFIX}_${id}`;
  }

  function usernameFromSession(session) {
    const meta = session?.user?.user_metadata?.username;
    if (meta && String(meta).trim()) return String(meta).trim();
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.username) return String(user.username).trim();
      }
    } catch (_) {}
    return '';
  }

  function initialsFromProfile(profile, session) {
    const name = profile?.fullName || window.DashAuth?.fullDisplayNameFromSession(session) || 'U';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    let initials = parts[0]?.[0] || 'U';
    if (parts.length > 1) initials += parts[1][0];
    else if (parts[0]?.length > 1) initials = parts[0].slice(0, 2);
    return initials.toUpperCase().slice(0, 2);
  }

  function loadProfile(session) {
    const storageKey = getProfileStorageKey(session);
    let storedData = {};
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) storedData = JSON.parse(saved);
    } catch {
      storedData = {};
    }

    const sessionName = window.DashAuth?.fullDisplayNameFromSession(session) || '';
    const sessionEmail = session?.user?.email || '';
    const sessionUsername = usernameFromSession(session);
    const joined =
      storedData.joined ||
      window.DashAuth?.formatJoinedDate(session?.user?.created_at) ||
      'Joined recently';

    return {
      profile: {
        ...DEFAULT_PROFILE,
        ...storedData,
        fullName: storedData.fullName || sessionName,
        username: storedData.username || sessionUsername,
        email: storedData.email || sessionEmail,
        photoUrl: storedData.photoUrl || '',
        joined,
      },
      storageKey,
    };
  }

  function saveProfile(session, profile) {
    const storageKey = getProfileStorageKey(session);
    localStorage.setItem(storageKey, JSON.stringify(profile));
    syncUsernameToUserRecord(profile.username);
    window.dispatchEvent(
      new CustomEvent('finovate-profile-updated', { detail: { session, profile } })
    );
  }

  function syncUsernameToUserRecord(username) {
    const trimmed = String(username || '').trim();
    if (!trimmed) return;
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (!raw) return;
      const user = JSON.parse(raw);
      user.username = trimmed;
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } catch (_) {}
  }

  /** Keep display name + email in sync across profile, settings, and login session. */
  function syncAccountFields(session, fields) {
    const fullName = String(fields?.fullName || '').trim();
    const email = String(fields?.email || '').trim();

    if (session?.user) {
      if (email) session.user.email = email;
      session.user.user_metadata = session.user.user_metadata || {};
      if (fullName) {
        session.user.user_metadata.full_name = fullName;
        session.user.user_metadata.name = fullName;
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (raw) {
        const user = JSON.parse(raw);
        if (fullName) user.full_name = fullName;
        if (email) user.email = email;
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
      }
    } catch (_) {}

    const id = session?.user?.id || session?.user?.email || 'guest';
    const settingsKey = `finovate_settings_${id}`;
    try {
      let stored = {};
      const settingsRaw = localStorage.getItem(settingsKey);
      if (settingsRaw) stored = JSON.parse(settingsRaw);
      if (fullName) stored.fullName = fullName;
      if (email) stored.email = email;
      localStorage.setItem(settingsKey, JSON.stringify(stored));
    } catch (_) {}

    const welcome = document.getElementById('dash-user-name');
    if (welcome && fullName) {
      welcome.textContent = fullName.split(/\s+/)[0] || fullName;
    }
  }

  function seedProfileFromUser(user) {
    if (!user || user.id == null) return;
    const storageKey = `${PROFILE_STORAGE_PREFIX}_${user.id}`;
    try {
      let storedData = {};
      const saved = localStorage.getItem(storageKey);
      if (saved) storedData = JSON.parse(saved);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...DEFAULT_PROFILE,
          ...storedData,
          fullName: storedData.fullName || user.full_name || '',
          username: storedData.username || user.username || '',
          email: storedData.email || user.email || '',
          photoUrl: storedData.photoUrl || '',
        })
      );
    } catch (_) {}
  }

  function setAvatarElement(el, photoUrl, initials) {
    if (!el) return;
    el.classList.add('dash-avatar');
    if (photoUrl) {
      el.innerHTML = '';
      const im = document.createElement('img');
      im.src = photoUrl;
      im.alt = `${initials} profile photo`;
      el.appendChild(im);
    } else {
      el.textContent = initials;
    }
  }

  function applyHeaderAvatar(session) {
    const el = document.getElementById('dash-profile-link');
    if (!el || !session) return;
    const { profile } = loadProfile(session);
    const initials = initialsFromProfile(profile, session);
    setAvatarElement(el, profile.photoUrl, initials);
  }

  let lastSession = null;

  function bindProfileListeners(getSession) {
    window.addEventListener('finovate-profile-updated', () => {
      const session = getSession?.() || lastSession;
      if (session) applyHeaderAvatar(session);
    });
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith(PROFILE_STORAGE_PREFIX)) {
        const session = getSession?.() || lastSession;
        if (session) applyHeaderAvatar(session);
      }
    });
  }

  function rememberSession(session) {
    lastSession = session;
  }

  window.DashProfile = {
    DEFAULT_PROFILE,
    getProfileStorageKey,
    usernameFromSession,
    loadProfile,
    saveProfile,
    seedProfileFromUser,
    syncUsernameToUserRecord,
    syncAccountFields,
    applyHeaderAvatar,
    setAvatarElement,
    initialsFromProfile,
    bindProfileListeners,
    rememberSession,
  };
})();

const PROFILE_STORAGE_PREFIX = 'finovate_profile_data';
const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_PHOTO_MSG_INVALID_TYPE =
  'Invalid file type. Please upload an image file (JPEG, PNG, GIF).';
const PROFILE_PHOTO_MSG_GENERIC = 'There was an error processing your request. Please try again.';
const PROFILE_PHOTO_MSG_MAX_SIZE = 'The maximum file size for the profile picture is 5MB.';

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif']);

function isAllowedProfileImageFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const extOk = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
  if (!extOk) return false;
  const mime = (file.type || '').toLowerCase();
  if (mime && !ALLOWED_IMAGE_MIMES.has(mime)) return false;
  return true;
}

function setPhotoFeedback(el, message, isError) {
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = '';
    el.removeAttribute('aria-live');
    el.classList.remove('profile-photo-feedback--error');
    return;
  }
  el.hidden = false;
  el.setAttribute('aria-live', 'polite');
  el.textContent = message;
  el.classList.toggle('profile-photo-feedback--error', Boolean(isError));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(file);
  });
}

function compressImageDataUrl(dataUrl, maxSide = 720, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxSide / Math.max(width, height, 1));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('img'));
    img.src = dataUrl;
  });
}

const TX_STORAGE_KEY = 'finovate_transactions';

function getTransactionStorageKey(session) {
  const identifier = session?.user?.id || session?.user?.email || 'guest';
  return `${TX_STORAGE_KEY}_${identifier}`;
}

const DEFAULT_PROFILE = window.DashProfile?.DEFAULT_PROFILE || {
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

function formatActivityDate(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderProfileActivityFromTransactions(session) {
  const ul = document.getElementById('profile-activity-list');
  if (!ul) return;
  let raw = [];
  try {
    const s = localStorage.getItem(getTransactionStorageKey(session));
    if (s) raw = JSON.parse(s);
  } catch {
    raw = [];
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    ul.innerHTML =
      '<li class="dash-activity-item dash-activity-item--empty"><div><p class="dash-activity-title">No saved transactions yet</p><p class="dash-activity-date">Add entries on the Transactions page.</p></div></li>';
    return;
  }
  const sorted = [...raw].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const top = sorted.slice(0, 8);
  ul.innerHTML = '';
  top.forEach((tx) => {
    if (!tx || typeof tx !== 'object') return;
    const type = tx.type === 'investment' ? 'investment' : tx.type === 'income' ? 'income' : 'expense';
    const tagClass =
      type === 'income' ? 'dash-activity-tag--income' : type === 'expense' ? 'dash-activity-tag--expense' : 'dash-activity-tag--invest';
    const li = document.createElement('li');
    li.className = 'dash-activity-item';
    const wrap = document.createElement('div');
    const title = document.createElement('p');
    title.className = 'dash-activity-title';
    title.textContent = tx.description || 'Transaction';
    const dateEl = document.createElement('p');
    dateEl.className = 'dash-activity-date';
    dateEl.textContent = formatActivityDate(tx.date);
    wrap.appendChild(title);
    wrap.appendChild(dateEl);
    const tag = document.createElement('span');
    tag.className = `dash-activity-tag ${tagClass}`;
    tag.textContent = type;
    li.appendChild(wrap);
    li.appendChild(tag);
    ul.appendChild(li);
  });
}

function fillLinkedForm(profile) {
  const b = document.getElementById('link-bank-name');
  const l4 = document.getElementById('link-bank-last4');
  const ew = document.getElementById('link-ewallet-provider');
  const ref = document.getElementById('link-ewallet-ref');
  if (b) b.value = profile.bankName || '';
  if (l4) l4.value = profile.bankLast4 || '';
  if (ew) ew.value = profile.ewalletProvider || '';
  if (ref) ref.value = profile.ewalletRef || '';
}

function readLinkedForm() {
  const last4 = (document.getElementById('link-bank-last4')?.value || '').replace(/\D/g, '').slice(0, 4);
  return {
    bankName: document.getElementById('link-bank-name')?.value.trim() || '',
    bankLast4: last4,
    ewalletProvider: document.getElementById('link-ewallet-provider')?.value.trim() || '',
    ewalletRef: document.getElementById('link-ewallet-ref')?.value.trim() || '',
  };
}

function initLinkedSection(session, profile) {
  const btn = document.getElementById('profile-linked-save');
  fillLinkedForm(profile);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const linked = readLinkedForm();
    Object.assign(profile, linked);
    try {
      saveProfileData(session, profile);
    } catch (_) {
      return;
    }
  });
}

function wireTopbarActions() {
  const bell = document.querySelector('.dash-icon-btn[aria-label="Notifications"]');
  if (bell) {
    bell.addEventListener('click', () => {
      window.location.href = 'alerts.html';
    });
  }
}

function loadProfileData(session) {
  if (window.DashProfile) return window.DashProfile.loadProfile(session).profile;
  return { ...DEFAULT_PROFILE };
}

function saveProfileData(session, profile) {
  if (window.DashProfile) {
    window.DashProfile.saveProfile(session, profile);
    return;
  }
  const id = session?.user?.id || session?.user?.email || 'guest';
  localStorage.setItem(`${PROFILE_STORAGE_PREFIX}_${id}`, JSON.stringify(profile));
}

function applyProfileData(profile, session) {
  const nameEl = document.getElementById('profile-display-name');
  const usernameEl = document.getElementById('profile-display-username');
  const emailRow = document.getElementById('profile-row-email');
  const phoneEl = document.getElementById('profile-row-phone');
  const locEl = document.getElementById('profile-row-location');
  const jobEl = document.getElementById('profile-row-job');
  const joinedEl = document.getElementById('profile-row-joined');
  const bioEl = document.getElementById('profile-bio-text');
  const avatarEl = document.getElementById('profile-hero-avatar');
  const headerAvatar = document.getElementById('dash-profile-link');

  if (nameEl) nameEl.textContent = profile.fullName || '—';
  if (usernameEl) usernameEl.textContent = profile.username ? `@${profile.username}` : '@username';
  if (emailRow) emailRow.textContent = profile.email || '—';
  if (phoneEl) phoneEl.textContent = profile.phone || '—';
  if (locEl) locEl.textContent = profile.location || '—';
  if (jobEl) jobEl.textContent = profile.occupation || '—';
  if (bioEl) bioEl.textContent = profile.bio || '—';
  if (joinedEl) joinedEl.textContent = profile.joined || 'Joined recently';

  const initials = window.DashProfile
    ? window.DashProfile.initialsFromProfile(profile, session)
    : profile.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || 'JD';

  if (window.DashProfile) {
    window.DashProfile.setAvatarElement(avatarEl, profile.photoUrl, initials);
    if (session) window.DashProfile.applyHeaderAvatar(session);
  } else if (avatarEl) {
    avatarEl.textContent = initials;
  }
}

function fillEditForm(profile) {
  const fields = {
    fullName: document.getElementById('profile-full-name'),
    username: document.getElementById('profile-username'),
    email: document.getElementById('profile-email'),
    phone: document.getElementById('profile-phone'),
    location: document.getElementById('profile-location'),
    occupation: document.getElementById('profile-occupation'),
    bio: document.getElementById('profile-bio'),
    photoUrl: document.getElementById('profile-photo-url'),
  };

  Object.entries(fields).forEach(([key, el]) => {
    if (!el) return;
    el.value = profile[key] || '';
  });

  const preview = document.getElementById('profile-photo-preview');
  const previewRow = document.getElementById('profile-photo-preview-row');
  if (preview) {
    preview.src = profile.photoUrl || '';
    if (previewRow) previewRow.classList.toggle('hidden', !profile.photoUrl);
    preview.classList.toggle('hidden', !profile.photoUrl);
  }
}

function readEditForm() {
  return {
    fullName: document.getElementById('profile-full-name')?.value.trim() || DEFAULT_PROFILE.fullName,
    username: document.getElementById('profile-username')?.value.trim() || DEFAULT_PROFILE.username,
    email: document.getElementById('profile-email')?.value.trim() || DEFAULT_PROFILE.email || '',
    phone: document.getElementById('profile-phone')?.value.trim() || DEFAULT_PROFILE.phone,
    location: document.getElementById('profile-location')?.value.trim() || DEFAULT_PROFILE.location,
    occupation: document.getElementById('profile-occupation')?.value.trim() || DEFAULT_PROFILE.occupation,
    bio: document.getElementById('profile-bio')?.value.trim() || DEFAULT_PROFILE.bio,
    photoUrl: document.getElementById('profile-photo-url')?.value.trim() || '',
  };
}

function handlePhotoUpload(session, profile) {
  const fileInput = document.getElementById('profile-photo-upload');
  const previewRow = document.getElementById('profile-photo-preview-row');
  const preview = document.getElementById('profile-photo-preview');
  const photoUrlField = document.getElementById('profile-photo-url');
  const feedback = document.getElementById('profile-photo-feedback');

  if (!fileInput || !preview || !photoUrlField) return;

  photoUrlField.addEventListener('change', () => {
    const url = photoUrlField.value.trim();
    if (!url) return;
    profile.photoUrl = url;
    preview.src = url;
    previewRow?.classList.remove('hidden');
    saveProfileData(session, profile);
    applyProfileData(profile, session);
  });

  fileInput.addEventListener('change', async () => {
    setPhotoFeedback(feedback, '', false);
    const file = fileInput.files?.[0];
    if (!file) {
      if (previewRow) previewRow.classList.add('hidden');
      return;
    }

    if (!isAllowedProfileImageFile(file)) {
      setPhotoFeedback(feedback, PROFILE_PHOTO_MSG_INVALID_TYPE, true);
      fileInput.value = '';
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      setPhotoFeedback(feedback, PROFILE_PHOTO_MSG_MAX_SIZE, true);
      fileInput.value = '';
      return;
    }

    try {
      const rawDataUrl = await readFileAsDataUrl(file);
      if (typeof rawDataUrl !== 'string') throw new Error('data');
      const dataUrl = await compressImageDataUrl(rawDataUrl);
      profile.photoUrl = dataUrl;
      photoUrlField.value = dataUrl;
      preview.src = dataUrl;
      previewRow?.classList.remove('hidden');
      setPhotoFeedback(feedback, '', false);
      saveProfileData(session, profile);
      applyProfileData(profile, session);
    } catch {
      setPhotoFeedback(feedback, PROFILE_PHOTO_MSG_GENERIC, true);
      fileInput.value = '';
    }
  });
}

function validateProfileBio(bio) {
  const text = String(bio || '').trim();
  return text.length === 0 || (text.length >= 30 && text.length <= 150);
}

function toggleEditSection(show) {
  const section = document.getElementById('profile-edit-section');
  const editBtn = document.getElementById('profile-edit-btn');
  if (!section || !editBtn) return;
  section.classList.toggle('hidden', !show);
  editBtn.disabled = show;
}

function initProfileEditor(session, profile) {
  const editBtn = document.getElementById('profile-edit-btn');
  const saveBtn = document.getElementById('profile-save-btn');
  const cancelBtn = document.getElementById('profile-cancel-btn');
  const section = document.getElementById('profile-edit-section');
  const feedback = document.getElementById('profile-photo-feedback');

  if (!editBtn || !saveBtn || !cancelBtn || !section) return;

  editBtn.addEventListener('click', () => {
    setPhotoFeedback(feedback, '', false);
    fillEditForm(profile);
    toggleEditSection(true);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  saveBtn.addEventListener('click', () => {
    setPhotoFeedback(feedback, '', false);
    const updated = { ...profile, ...readEditForm(), joined: profile.joined };
    if (!validateProfileBio(updated.bio)) {
      alert('Your bio must be between 30 and 150 characters.');
      return;
    }
    try {
      saveProfileData(session, updated);
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        setPhotoFeedback(feedback, PROFILE_PHOTO_MSG_GENERIC, true);
      } else {
        setPhotoFeedback(feedback, PROFILE_PHOTO_MSG_GENERIC, true);
      }
      return;
    }
    Object.assign(profile, updated);
    if (window.DashProfile?.syncAccountFields) {
      window.DashProfile.syncAccountFields(session, {
        fullName: updated.fullName,
        email: updated.email,
      });
    }
    applyProfileData(updated, session);
    toggleEditSection(false);
    alert('Profile updated. Your display name and email are saved.');
  });

  cancelBtn.addEventListener('click', () => {
    setPhotoFeedback(feedback, '', false);
    toggleEditSection(false);
  });

  handlePhotoUpload(session, profile);
}

async function bootProfile() {
  const session = await window.DashAuth.requireSession();
  if (!session) return;

  if (window.DashProfile) {
    window.DashProfile.rememberSession(session);
    window.DashProfile.bindProfileListeners(() => session);
  }

  const profile = loadProfileData(session);
  applyProfileData(profile, session);
  initProfileEditor(session, profile);
  initLinkedSection(session, profile);
  renderProfileActivityFromTransactions(session);
  wireTopbarActions();
  window.DashAuth?.wireDashLogout?.();
  window.DashAuth?.wireMobileNav?.();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootProfile);
} else {
  bootProfile();
}

const SETTINGS_STORAGE_PREFIX = 'finovate_settings';

const CURRENCY_OPTIONS = [
  { value: 'PHP', label: 'PHP (₱)' },
  { value: 'AED', label: 'AED (د.إ)' },
  { value: 'AFN', label: 'AFN (؋)' },
  { value: 'ALL', label: 'ALL (L)' },
  { value: 'AMD', label: 'AMD (֏)' },
  { value: 'ANG', label: 'ANG (ƒ)' },
  { value: 'AOA', label: 'AOA (Kz)' },
  { value: 'ARS', label: 'ARS ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'AWG', label: 'AWG (ƒ)' },
  { value: 'AZN', label: 'AZN (₼)' },
  { value: 'BAM', label: 'BAM (KM)' },
  { value: 'BBD', label: 'BBD ($)' },
  { value: 'BDT', label: 'BDT (৳)' },
  { value: 'BGN', label: 'BGN (лв)' },
  { value: 'BHD', label: 'BHD (.د.ب)' },
  { value: 'BIF', label: 'BIF (Fr)' },
  { value: 'BMD', label: 'BMD ($)' },
  { value: 'BND', label: 'BND ($)' },
  { value: 'BOB', label: 'BOB ($b)' },
  { value: 'BRL', label: 'BRL (R$)' },
  { value: 'BSD', label: 'BSD ($)' },
  { value: 'BTN', label: 'BTN (Nu.)' },
  { value: 'BWP', label: 'BWP (P)' },
  { value: 'BYN', label: 'BYN (Br)' },
  { value: 'BZD', label: 'BZD ($)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'CDF', label: 'CDF (Fr)' },
  { value: 'CHF', label: 'CHF (Fr)' },
  { value: 'CLP', label: 'CLP ($)' },
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'COP', label: 'COP ($)' },
  { value: 'CRC', label: 'CRC (₡)' },
  { value: 'CUP', label: 'CUP ($)' },
  { value: 'CVE', label: 'CVE ($)' },
  { value: 'CZK', label: 'CZK (Kč)' },
  { value: 'DJF', label: 'DJF (Fr)' },
  { value: 'DKK', label: 'DKK (kr)' },
  { value: 'DOP', label: 'DOP ($)' },
  { value: 'DZD', label: 'DZD (دج)' },
  { value: 'EGP', label: 'EGP (£)' },
  { value: 'ERN', label: 'ERN (Nfk)' },
  { value: 'ETB', label: 'ETB (Br)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'FJD', label: 'FJD ($)' },
  { value: 'FKP', label: 'FKP (£)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'GEL', label: 'GEL (₾)' },
  { value: 'GHS', label: 'GHS (¢)' },
  { value: 'GIP', label: 'GIP (£)' },
  { value: 'GMD', label: 'GMD (D)' },
  { value: 'GNF', label: 'GNF (Fr)' },
  { value: 'GTQ', label: 'GTQ (Q)' },
  { value: 'GYD', label: 'GYD ($)' },
  { value: 'HKD', label: 'HKD ($)' },
  { value: 'HNL', label: 'HNL (L)' },
  { value: 'HRK', label: 'HRK (kn)' },
  { value: 'HTG', label: 'HTG (G)' },
  { value: 'HUF', label: 'HUF (Ft)' },
  { value: 'IDR', label: 'IDR (Rp)' },
  { value: 'ILS', label: 'ILS (₪)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'IQD', label: 'IQD (ع.د)' },
  { value: 'IRR', label: 'IRR (﷼)' },
  { value: 'ISK', label: 'ISK (kr)' },
  { value: 'JMD', label: 'JMD ($)' },
  { value: 'JOD', label: 'JOD (د.ا)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'KES', label: 'KES (Sh)' },
  { value: 'KGS', label: 'KGS (сом)' },
  { value: 'KHR', label: 'KHR (៛)' },
  { value: 'KWD', label: 'KWD (د.ك)' },
  { value: 'KYD', label: 'KYD ($)' },
  { value: 'KZT', label: 'KZT (₸)' },
  { value: 'LAK', label: 'LAK (₭)' },
  { value: 'LBP', label: 'LBP (ل.ل)' },
  { value: 'LKR', label: 'LKR (₨)' },
  { value: 'LRD', label: 'LRD ($)' },
  { value: 'LSL', label: 'LSL (L)' },
  { value: 'LYD', label: 'LYD (ل.د)' },
  { value: 'MAD', label: 'MAD (د.م.)' },
  { value: 'MDL', label: 'MDL (L)' },
  { value: 'MGA', label: 'MGA (Ar)' },
  { value: 'MKD', label: 'MKD (ден)' },
  { value: 'MMK', label: 'MMK (K)' },
  { value: 'MNT', label: 'MNT (₮)' },
  { value: 'MOP', label: 'MOP (P)' },
  { value: 'MRU', label: 'MRU (UM)' },
  { value: 'MUR', label: 'MUR (₨)' },
  { value: 'MVR', label: 'MVR (Rf)' },
  { value: 'MWK', label: 'MWK (MK)' },
  { value: 'MXN', label: 'MXN ($)' },
  { value: 'MYR', label: 'MYR (RM)' },
  { value: 'MZN', label: 'MZN (MT)' },
  { value: 'NAD', label: 'NAD ($)' },
  { value: 'NGN', label: 'NGN (₦)' },
  { value: 'NIO', label: 'NIO (C$)' },
  { value: 'NOK', label: 'NOK (kr)' },
  { value: 'NPR', label: 'NPR (₨)' },
  { value: 'NZD', label: 'NZD ($)' },
  { value: 'OMR', label: 'OMR (﷼)' },
  { value: 'PAB', label: 'PAB (B/.)' },
  { value: 'PEN', label: 'PEN (S/.)' },
  { value: 'PGK', label: 'PGK (K)' },
  { value: 'PHP', label: 'PHP (₱)' },
  { value: 'PKR', label: 'PKR (₨)' },
  { value: 'PLN', label: 'PLN (zł)' },
  { value: 'PYG', label: 'PYG (₲)' },
  { value: 'QAR', label: 'QAR (﷼)' },
  { value: 'RON', label: 'RON (lei)' },
  { value: 'RSD', label: 'RSD (дин)' },
  { value: 'RUB', label: 'RUB (₽)' },
  { value: 'RWF', label: 'RWF (FRw)' },
  { value: 'SAR', label: 'SAR (﷼)' },
  { value: 'SBD', label: 'SBD ($)' },
  { value: 'SCR', label: 'SCR (₨)' },
  { value: 'SDG', label: 'SDG (ج.س.)' },
  { value: 'SEK', label: 'SEK (kr)' },
  { value: 'SGD', label: 'SGD ($)' },
  { value: 'SHP', label: 'SHP (£)' },
  { value: 'SLL', label: 'SLL (Le)' },
  { value: 'SOS', label: 'SOS (Sh)' },
  { value: 'SRD', label: 'SRD ($)' },
  { value: 'SSP', label: 'SSP (£)' },
  { value: 'STN', label: 'STN (Db)' },
  { value: 'SVC', label: 'SVC ($)' },
  { value: 'SYP', label: 'SYP (£)' },
  { value: 'SZL', label: 'SZL (E)' },
  { value: 'THB', label: 'THB (฿)' },
  { value: 'TJS', label: 'TJS (ЅМ)' },
  { value: 'TMT', label: 'TMT (m)' },
  { value: 'TND', label: 'TND (د.ت)' },
  { value: 'TOP', label: 'TOP (T$)' },
  { value: 'TRY', label: 'TRY (₺)' },
  { value: 'TTD', label: 'TTD ($)' },
  { value: 'TWD', label: 'TWD (NT$)' },
  { value: 'TZS', label: 'TZS (Sh)' },
  { value: 'UAH', label: 'UAH (₴)' },
  { value: 'UGX', label: 'UGX (Sh)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'UYU', label: 'UYU ($)' },
  { value: 'UZS', label: 'UZS (лв)' },
  { value: 'VES', label: 'VES (Bs.S)' },
  { value: 'VND', label: 'VND (₫)' },
  { value: 'VUV', label: 'VUV (VT)' },
  { value: 'WST', label: 'WST (T)' },
  { value: 'XAF', label: 'XAF (Fr)' },
  { value: 'XCD', label: 'XCD ($)' },
  { value: 'XOF', label: 'XOF (Fr)' },
  { value: 'XPF', label: 'XPF (Fr)' },
  { value: 'YER', label: 'YER (﷼)' },
  { value: 'ZAR', label: 'ZAR (R)' },
  { value: 'ZMW', label: 'ZMW (ZK)' },
  { value: 'ZWL', label: 'ZWL ($)' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fil', label: 'Filipino' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'sq', label: 'Albanian' },
  { value: 'am', label: 'Amharic' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hy', label: 'Armenian' },
  { value: 'az', label: 'Azerbaijani' },
  { value: 'eu', label: 'Basque' },
  { value: 'be', label: 'Belarusian' },
  { value: 'bn', label: 'Bengali' },
  { value: 'bs', label: 'Bosnian' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'ca', label: 'Catalan' },
  { value: 'ceb', label: 'Cebuano' },
  { value: 'zh', label: 'Chinese (Simplified)' },
  { value: 'zh-Hant', label: 'Chinese (Traditional)' },
  { value: 'co', label: 'Corsican' },
  { value: 'hr', label: 'Croatian' },
  { value: 'cs', label: 'Czech' },
  { value: 'da', label: 'Danish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'eo', label: 'Esperanto' },
  { value: 'et', label: 'Estonian' },
  { value: 'fi', label: 'Finnish' },
  { value: 'fr', label: 'French' },
  { value: 'fy', label: 'Frisian' },
  { value: 'gl', label: 'Galician' },
  { value: 'ka', label: 'Georgian' },
  { value: 'de', label: 'German' },
  { value: 'el', label: 'Greek' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'ht', label: 'Haitian Creole' },
  { value: 'ha', label: 'Hausa' },
  { value: 'haw', label: 'Hawaiian' },
  { value: 'he', label: 'Hebrew' },
  { value: 'hi', label: 'Hindi' },
  { value: 'hmn', label: 'Hmong' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'is', label: 'Icelandic' },
  { value: 'ig', label: 'Igbo' },
  { value: 'id', label: 'Indonesian' },
  { value: 'ga', label: 'Irish' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'jv', label: 'Javanese' },
  { value: 'kn', label: 'Kannada' },
  { value: 'kk', label: 'Kazakh' },
  { value: 'km', label: 'Khmer' },
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'ko', label: 'Korean' },
  { value: 'ku', label: 'Kurdish' },
  { value: 'ky', label: 'Kyrgyz' },
  { value: 'lo', label: 'Lao' },
  { value: 'la', label: 'Latin' },
  { value: 'lv', label: 'Latvian' },
  { value: 'lt', label: 'Lithuanian' },
  { value: 'lb', label: 'Luxembourgish' },
  { value: 'mk', label: 'Macedonian' },
  { value: 'mg', label: 'Malagasy' },
  { value: 'ms', label: 'Malay' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'mt', label: 'Maltese' },
  { value: 'mi', label: 'Maori' },
  { value: 'mr', label: 'Marathi' },
  { value: 'mn', label: 'Mongolian' },
  { value: 'my', label: 'Myanmar (Burmese)' },
  { value: 'ne', label: 'Nepali' },
  { value: 'no', label: 'Norwegian' },
  { value: 'ny', label: 'Nyanja (Chichewa)' },
  { value: 'or', label: 'Odia (Oriya)' },
  { value: 'ps', label: 'Pashto' },
  { value: 'fa', label: 'Persian' },
  { value: 'pl', label: 'Polish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ro', label: 'Romanian' },
  { value: 'ru', label: 'Russian' },
  { value: 'sm', label: 'Samoan' },
  { value: 'gd', label: 'Scots Gaelic' },
  { value: 'sr', label: 'Serbian' },
  { value: 'st', label: 'Sesotho' },
  { value: 'sn', label: 'Shona' },
  { value: 'sd', label: 'Sindhi' },
  { value: 'si', label: 'Sinhala' },
  { value: 'sk', label: 'Slovak' },
  { value: 'sl', label: 'Slovenian' },
  { value: 'so', label: 'Somali' },
  { value: 'su', label: 'Sundanese' },
  { value: 'sw', label: 'Swahili' },
  { value: 'sv', label: 'Swedish' },
  { value: 'tg', label: 'Tajik' },
  { value: 'ta', label: 'Tamil' },
  { value: 'tt', label: 'Tatar' },
  { value: 'te', label: 'Telugu' },
  { value: 'th', label: 'Thai' },
  { value: 'tr', label: 'Turkish' },
  { value: 'tk', label: 'Turkmen' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'ur', label: 'Urdu' },
  { value: 'uz', label: 'Uzbek' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'cy', label: 'Welsh' },
  { value: 'xh', label: 'Xhosa' },
  { value: 'yi', label: 'Yiddish' },
  { value: 'yo', label: 'Yoruba' },
  { value: 'zu', label: 'Zulu' },
];

function populateSelect(select, options) {
  if (!select) return;
  select.innerHTML = '';
  options.forEach((option) => {
    const item = document.createElement('option');
    item.value = option.value;
    item.textContent = option.label;
    select.appendChild(item);
  });
}

function isSupportedCurrency(currency) {
  return CURRENCY_OPTIONS.some((item) => item.value === currency);
}

function isSupportedLanguage(language) {
  return LANGUAGE_OPTIONS.some((item) => item.value === language);
}

function getSettingsStorageKey(session) {
  const id = session?.user?.id || session?.user?.email || 'guest';
  return `${SETTINGS_STORAGE_PREFIX}_${id}`;
}

function getLocalFinovateUser() {
  try {
    const raw = localStorage.getItem('finovate_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadSettings(session) {
  let stored = {};
  const storageKey = getSettingsStorageKey(session);
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) stored = JSON.parse(raw);
  } catch {
    stored = {};
  }
  const localUser = getLocalFinovateUser();
  const email = session.user?.email || localUser?.email || '';
  const name =
    stored.fullName ||
    session.user?.user_metadata?.full_name ||
    session.user?.user_metadata?.name ||
    localUser?.full_name ||
    email.split('@')[0] ||
    '';
  const twoFaStored =
    stored.twoFa != null
      ? stored.twoFa
      : localUser?.two_factor_enabled === false
        ? 'disabled'
        : 'enabled';
  return {
    fullName: name,
    email: stored.email || email,
    twoFa: twoFaStored === 'disabled' ? 'disabled' : 'enabled',
    currency: isSupportedCurrency(stored.currency) ? stored.currency : 'PHP',
    language: isSupportedLanguage(stored.language) ? stored.language : 'en',
  };
}

function saveSettings(obj, storageKey) {
  localStorage.setItem(storageKey, JSON.stringify(obj));
}

function applySettingsForm(s) {
  const fn = document.getElementById('settings-full-name');
  const em = document.getElementById('settings-email');
  const two = document.getElementById('settings-2fa');
  const cur = document.getElementById('settings-currency');
  const lang = document.getElementById('settings-language');
  if (fn) fn.value = s.fullName || '';
  if (em) em.value = s.email || '';
  if (two) two.value = s.twoFa === 'disabled' ? 'disabled' : 'enabled';
  if (cur) cur.value = s.currency || 'PHP';
  if (lang) lang.value = s.language || 'en';
  ['settings-current-password', 'settings-new-password', 'settings-confirm-password'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

/** Values exactly as typed in the form (used when saving). */
function readSettingsFormRaw() {
  return {
    fullName: document.getElementById('settings-full-name')?.value.trim() || '',
    email: document.getElementById('settings-email')?.value.trim() || '',
    twoFa: document.getElementById('settings-2fa')?.value === 'disabled' ? 'disabled' : 'enabled',
    currency: document.getElementById('settings-currency')?.value || 'PHP',
    language: document.getElementById('settings-language')?.value || 'en',
  };
}

function readSettingsForm(session, { useDefaults } = {}) {
  const raw = readSettingsFormRaw();
  if (!useDefaults) return raw;

  const localUser = getLocalFinovateUser();
  let fullName = raw.fullName;
  let email = raw.email;

  if (!fullName) {
    fullName =
      session?.user?.user_metadata?.full_name ||
      session?.user?.user_metadata?.name ||
      localUser?.full_name ||
      localUser?.username ||
      'Member';
  }
  if (!email) {
    email = session?.user?.email || localUser?.email || '';
  }

  return { ...raw, fullName, email };
}

function refreshStaticFormCopy() {
  const two = document.getElementById('settings-2fa');
  if (two && two.options.length >= 2) {
    two.options[0].textContent = window.UiI18n.t('settings.twoFaOn');
    two.options[1].textContent = window.UiI18n.t('settings.twoFaOff');
  }
}

function setPasswordStatus(message, isError = false) {
  const status = document.getElementById('settings-password-status');
  if (!status) return;
  status.textContent = message || '';
  status.hidden = !message;
  status.className = isError ? 'auth-status auth-status--error' : 'auth-status auth-status--success';
}

function setSaveStatus(message, tone = 'success') {
  const status = document.getElementById('settings-save-status');
  if (!status) return;
  status.textContent = message || '';
  status.hidden = !message;
  status.className = 'settings-save-status';
  if (tone === 'error') status.classList.add('settings-save-status--error');
  else if (tone === 'warn') status.classList.add('settings-save-status--warn');
  else if (message) status.classList.add('settings-save-status--success');
  if (message) {
    status.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    window.setTimeout(() => {}, 1200);
  }
}

function accountIdentifier(session) {
  return (
    session?.user?.user_metadata?.username ||
    session?.user?.email ||
    session?.user?.id ||
    ''
  );
}

function persistAccountLocally(session, next, serverUser) {
  const storageKey = getSettingsStorageKey(session);
  const fullName = serverUser?.full_name || next.fullName;
  const email = serverUser?.email || next.email;
  const merged = {
    ...next,
    fullName,
    email,
    twoFa:
      serverUser?.two_factor_enabled != null
        ? serverUser.two_factor_enabled
          ? 'enabled'
          : 'disabled'
        : next.twoFa,
  };
  saveSettings(merged, storageKey);

  try {
    const raw = localStorage.getItem('finovate_user');
    if (raw) {
      const user = JSON.parse(raw);
      user.full_name = fullName || user.full_name;
      user.email = email || user.email;
      user.two_factor_enabled =
        serverUser?.two_factor_enabled != null
          ? Boolean(serverUser.two_factor_enabled)
          : merged.twoFa === 'enabled';
      localStorage.setItem('finovate_user', JSON.stringify(user));
    }
  } catch (_) {}

  if (window.DashProfile) {
    const { profile } = window.DashProfile.loadProfile(session);
    window.DashProfile.saveProfile(session, {
      ...profile,
      fullName,
      email,
    });
    window.DashProfile.syncAccountFields(session, { fullName, email });
    window.DashProfile.applyHeaderAvatar(session);
  }

  const nameInput = document.getElementById('settings-full-name');
  const emailInput = document.getElementById('settings-email');
  if (nameInput) nameInput.value = fullName || '';
  if (emailInput) emailInput.value = email || '';

  window.dispatchEvent(new CustomEvent('finovate-profile-updated', { detail: { session } }));
  window.dispatchEvent(
    new CustomEvent('finovate-settings-saved', { detail: { session, settings: merged } })
  );
}

/** Save name, currency, language, and 2FA to this browser immediately. */
function savePreferencesLocally(session, next, serverUser) {
  persistAccountLocally(session, next, serverUser);
  window.UiI18n?.setLang?.(next.language);
  window.UiI18n?.apply?.(document);
  refreshStaticFormCopy();
}

function savePreferencesFromForm(session, showMessage = true) {
  const next = readSettingsFormRaw();
  if (!next.fullName.trim() || !next.email.trim()) {
    const withDefaults = readSettingsForm(session, { useDefaults: true });
    if (!withDefaults.fullName.trim() || !withDefaults.email.trim()) {
      if (showMessage) {
        setSaveStatus('Enter your display name and email in the Profile section above.', 'error');
      }
      return false;
    }
    savePreferencesLocally(session, withDefaults, null);
    if (showMessage) {
      setSaveStatus(
        `Saved — currency: ${withDefaults.currency}, 2FA: ${
          withDefaults.twoFa === 'enabled' ? 'On' : 'Off'
        }.`,
        'success'
      );
    }
    return true;
  }
  savePreferencesLocally(session, next, null);
  if (showMessage) {
    setSaveStatus(
      `Saved — display name: ${next.fullName}, currency: ${next.currency}, 2FA: ${
        next.twoFa === 'enabled' ? 'On' : 'Off'
      }.`,
      'success'
    );
  }
  return true;
}

async function syncAccountToServer(session, next) {
  const identifier = accountIdentifier(session);
  if (!identifier) return { ok: false, message: 'Could not determine your account.' };

  const result = await window.DashAuth?.fetchDashApi?.('/api/auth/update-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier,
      full_name: next.fullName,
      email: next.email,
      twoFa: next.twoFa,
      two_factor_enabled: next.twoFa === 'enabled',
    }),
    timeout: 5000,
  });

  if (result?.data?.success) {
    return { ok: true, user: result.data.user };
  }
  if (result?.data?.message) {
    return { ok: false, message: result.data.message };
  }
  if (!result) {
    return { ok: false, message: null };
  }
  return { ok: false, message: 'Could not sync with the server.' };
}

async function saveAccountSettings(session) {
  const next = readSettingsFormRaw();
  if (!next.fullName.trim()) {
    setSaveStatus('Please enter your display name (full name).', 'error');
    document.getElementById('settings-full-name')?.focus();
    return;
  }
  if (!next.email.trim()) {
    setSaveStatus('Please enter your email address.', 'error');
    document.getElementById('settings-email')?.focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) {
    setSaveStatus('Please enter a valid email address.', 'error');
    document.getElementById('settings-email')?.focus();
    return;
  }

  const saveBtn = document.getElementById('settings-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
  }
  setSaveStatus('Saving…', 'success');

  savePreferencesLocally(session, next, null);

  let serverMsg = null;
  try {
    const synced = await syncAccountToServer(session, next);
    if (synced.ok && synced.user) {
      savePreferencesLocally(session, next, synced.user);
      setSaveStatus(`Saved — name: ${next.fullName}, email: ${next.email}.`, 'success');
    } else if (synced.message) {
      serverMsg = synced.message;
      setSaveStatus(`Saved on this device. Server note: ${serverMsg}`, 'warn');
    } else {
      setSaveStatus('Saved on this device (currency, name, 2FA, and language).', 'success');
    }
  } catch (_) {
    setSaveStatus('Saved on this device (currency, name, 2FA, and language).', 'success');
  }

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save all settings';
  }
}

function wirePreferenceAutoSave(session) {
  let saveTimer = null;
  const scheduleSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      savePreferencesFromForm(session, true);
    }, 400);
  };

  ['settings-currency', 'settings-2fa', 'settings-language', 'settings-full-name'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', scheduleSave);
    if (id === 'settings-full-name') {
      el.addEventListener('blur', scheduleSave);
    }
  });
}

function updateLocalPasswordRecord(session, newPassword) {
  try {
    const raw = localStorage.getItem('finovate_mock_users');
    if (!raw) return;
    const users = JSON.parse(raw);
    const email = String(session?.user?.email || '').toLowerCase();
    const username = String(session?.user?.user_metadata?.username || '').toLowerCase();
    let changed = false;

    Object.keys(users).forEach((key) => {
      const entry = users[key];
      if (!entry) return;
      const matchesEmail = String(entry.email || '').toLowerCase() === email;
      const matchesUsername = String(entry.username || '').toLowerCase() === username;
      if (matchesEmail || matchesUsername) {
        entry.password = btoa(newPassword);
        users[key] = entry;
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem('finovate_mock_users', JSON.stringify(users));
    }
  } catch (_) {}
}

async function submitPasswordChange(session) {
  const currentPassword = document.getElementById('settings-current-password')?.value || '';
  const newPassword = document.getElementById('settings-new-password')?.value || '';
  const confirmPassword = document.getElementById('settings-confirm-password')?.value || '';
  const identifier = session?.user?.email || session?.user?.user_metadata?.username || '';

  if (!currentPassword || !newPassword || !confirmPassword) {
    setPasswordStatus('Please fill in your current password, new password, and confirmation.', true);
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordStatus('New passwords do not match.', true);
    return;
  }

  if (newPassword.length < 10 || newPassword.length > 64) {
    setPasswordStatus('Password must be 10 to 64 characters.', true);
    return;
  }

  setPasswordStatus('Updating password...');
  try {
    const result = await window.DashAuth?.fetchDashApi?.('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier,
        currentPassword,
        newPassword,
      }),
      timeout: 5000,
    });
    const data = result?.data;
    const response = result?.res;

    if (!response?.ok || !data?.success) {
      throw new Error(data?.message || 'Unable to change password right now.');
    }

    updateLocalPasswordRecord(session, newPassword);
    if (data.user) {
      try {
        localStorage.setItem('finovate_user', JSON.stringify(data.user));
      } catch (_) {}
    }
    document.getElementById('settings-current-password').value = '';
    document.getElementById('settings-new-password').value = '';
    document.getElementById('settings-confirm-password').value = '';
    setPasswordStatus('Password changed successfully. Use it the next time you log in.');
  } catch (error) {
    setPasswordStatus(error?.message || 'Unable to change password right now.', true);
  }
}

async function bootSettingsPage() {
  const session = await window.DashAuth.requireSession();
  if (!session) return;

  if (window.DashProfile) {
    window.DashProfile.rememberSession(session);
    window.DashProfile.bindProfileListeners(() => session);
    window.DashProfile.applyHeaderAvatar(session);
  }

  document.body.classList.remove('dash-gate-pending');
  document.body.classList.add('dash-gate-ready');

  if (!window.DashProfile) {
    window.DashAuth.setAvatarInitials(session, document.getElementById('dash-profile-link'));
  }

  const s = loadSettings(session);
  populateSelect(document.getElementById('settings-currency'), CURRENCY_OPTIONS);
  populateSelect(document.getElementById('settings-language'), LANGUAGE_OPTIONS);

  window.UiI18n.setLang(s.language || 'en');
  window.UiI18n.apply(document);
  refreshStaticFormCopy();
  applySettingsForm(s);

  window.DashAuth?.wireDashLogout?.();
  window.DashAuth?.wireMobileNav?.();

  document.getElementById('settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveAccountSettings(session);
  });

  document.getElementById('settings-save-profile-btn')?.addEventListener('click', () => {
    saveAccountSettings(session);
  });

  document.getElementById('settings-save-prefs-btn')?.addEventListener('click', () => {
    savePreferencesFromForm(session, true);
    syncAccountToServer(session, readSettingsFormRaw())
      .then((synced) => {
        if (synced.ok && synced.user) {
          savePreferencesLocally(session, readSettingsFormRaw(), synced.user);
          setSaveStatus('Preferences saved and synced.', 'success');
        }
      })
      .catch(() => {});
  });

  document.getElementById('settings-reset-btn')?.addEventListener('click', () => {
    localStorage.removeItem(getSettingsStorageKey(session));
    const fresh = loadSettings(session);
    applySettingsForm(fresh);
    window.UiI18n.setLang(fresh.language);
    window.UiI18n.apply(document);
    refreshStaticFormCopy();
    setPasswordStatus('');
    setSaveStatus('Reset to your account defaults.', 'success');
  });

  wirePreferenceAutoSave(session);

  document.getElementById('settings-change-password-btn')?.addEventListener('click', () => {
    submitPasswordChange(session);
  });

  setPasswordStatus('');
}

window.FinovateSettings = {
  loadSettings,
  getSettingsStorageKey,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSettingsPage);
} else {
  bootSettingsPage();
}

async function bootHelpPage() {
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
  try {
    const raw = localStorage.getItem('finovate_settings');
    if (raw) {
      const s = JSON.parse(raw);
      if (s && ['en', 'fil', 'es'].includes(s.language)) window.UiI18n.setLang(s.language);
    }
  } catch (_) {}
  window.UiI18n.apply(document);

  window.DashAuth?.wireDashLogout?.();
  window.DashAuth?.wireMobileNav?.();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootHelpPage);
} else {
  bootHelpPage();
}

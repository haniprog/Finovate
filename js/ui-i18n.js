/**
 * Lightweight UI strings for Settings + Help (language preference: finovate_ui_lang).
 */
(function initUiI18n() {
  const STR = {
    en: {
      'settings.title': 'Settings',
      'settings.subtitle': 'Manage your account and preferences.',
      'settings.profileTitle': 'Profile',
      'settings.profileHint': 'Update your name, email, and personal details.',
      'settings.fullName': 'Full name',
      'settings.email': 'Email',
      'settings.securityTitle': 'Security',
      'settings.securityHint': 'Password and two-factor authentication.',
      'settings.password': 'Password',
      'settings.passwordToggleShow': 'Show',
      'settings.passwordToggleHide': 'Hide',
      'settings.twoFa': 'Two-factor authentication (2FA)',
      'settings.twoFaOn': 'Enabled',
      'settings.twoFaOff': 'Disabled',
      'settings.prefsTitle': 'Preferences',
      'settings.prefsHint': 'Currency, language, and notification settings.',
      'settings.currency': 'Currency',
      'settings.language': 'Language',
      'settings.save': 'Save settings',
      'settings.reset': 'Reset to session defaults',
      'help.title': 'Help & Support',
      'help.subtitle': 'Find answers and get assistance.',
      'help.contactTitle': 'Contact Support',
      'help.contactBody': 'finovate@gmail.com',
      'help.guideTitle': 'User Guide',
      'help.guideBody': 'Learn how to use Finovate effectively.',
      'help.faqTitle': 'Frequently Asked Questions',
    },
    fil: {
      'settings.title': 'Mga Setting',
      'settings.subtitle': 'Pamahalaan ang iyong account at mga kagustuhan.',
      'settings.profileTitle': 'Profile',
      'settings.profileHint': 'I-update ang pangalan, email, at personal na detalye.',
      'settings.fullName': 'Buong pangalan',
      'settings.email': 'Email',
      'settings.securityTitle': 'Seguridad',
      'settings.securityHint': 'Password at two-factor authentication.',
      'settings.password': 'Password',
      'settings.passwordToggleShow': 'Ipakita',
      'settings.passwordToggleHide': 'Itago',
      'settings.twoFa': 'Two-factor authentication (2FA)',
      'settings.twoFaOn': 'Naka-on',
      'settings.twoFaOff': 'Naka-off',
      'settings.prefsTitle': 'Mga Kagustuhan',
      'settings.prefsHint': 'Currency, wika, at mga setting ng abiso.',
      'settings.currency': 'Currency',
      'settings.language': 'Wika',
      'settings.save': 'I-save ang settings',
      'settings.reset': 'Ibalik sa default ng session',
      'help.title': 'Tulong & Suporta',
      'help.subtitle': 'Maghanap ng sagot at humingi ng tulong.',
      'help.contactTitle': 'Makipag-ugnayan sa Suporta',
      'help.contactBody': 'finovate@gmail.com',
      'help.guideTitle': 'Gabay ng User',
      'help.guideBody': 'Alamin kung paano gamitin ang Finovate nang epektibo.',
      'help.faqTitle': 'Mga Madalas Itanong',
    },
    es: {
      'settings.title': 'Ajustes',
      'settings.subtitle': 'Administra tu cuenta y preferencias.',
      'settings.profileTitle': 'Perfil',
      'settings.profileHint': 'Actualiza tu nombre, correo y datos personales.',
      'settings.fullName': 'Nombre completo',
      'settings.email': 'Correo electrónico',
      'settings.securityTitle': 'Seguridad',
      'settings.securityHint': 'Contraseña y autenticación en dos pasos.',
      'settings.password': 'Contraseña',
      'settings.passwordToggleShow': 'Mostrar',
      'settings.passwordToggleHide': 'Ocultar',
      'settings.twoFa': 'Autenticación en dos pasos (2FA)',
      'settings.twoFaOn': 'Activada',
      'settings.twoFaOff': 'Desactivada',
      'settings.prefsTitle': 'Preferencias',
      'settings.prefsHint': 'Moneda, idioma y notificaciones.',
      'settings.currency': 'Moneda',
      'settings.language': 'Idioma',
      'settings.save': 'Guardar ajustes',
      'settings.reset': 'Restablecer a la sesión',
      'help.title': 'Ayuda y soporte',
      'help.subtitle': 'Encuentra respuestas y asistencia.',
      'help.contactTitle': 'Contactar soporte',
      'help.contactBody': 'finovate@gmail.com',
      'help.guideTitle': 'Guía de usuario',
      'help.guideBody': 'Aprende a usar Finovate con eficacia.',
      'help.faqTitle': 'Preguntas frecuentes',
    },
  };

  function htmlLangFor(code) {
    if (code === 'fil') return 'tl';
    if (code === 'es') return 'es';
    return 'en';
  }

  window.UiI18n = {
    getLang() {
      const v = localStorage.getItem('finovate_ui_lang');
      if (v === 'fil' || v === 'es' || v === 'en') return v;
      return 'en';
    },
    setLang(code) {
      const next = code === 'fil' || code === 'es' ? code : 'en';
      localStorage.setItem('finovate_ui_lang', next);
      document.documentElement.lang = htmlLangFor(next);
      return next;
    },
    t(key) {
      const lang = window.UiI18n.getLang();
      const pack = STR[lang] || STR.en;
      return pack[key] || STR.en[key] || key;
    },
    apply(root) {
      const lang = window.UiI18n.getLang();
      document.documentElement.lang = htmlLangFor(lang);
      const pack = STR[lang] || STR.en;
      (root || document).querySelectorAll('[data-i18n]').forEach((el) => {
        const k = el.getAttribute('data-i18n');
        if (k && pack[k]) el.textContent = pack[k];
      });
    },
  };
})();

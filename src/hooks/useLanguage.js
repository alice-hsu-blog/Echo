import { useCallback, useEffect, useState } from 'react';
import { isTauri } from '../lib/db.js';
import { translations } from '../i18n/translations.js';

const LANGUAGE_KEY = 'echo-language';

// First run only (no stored preference yet): pick zh if the OS is set to
// Chinese, en if it's set to English, and en for anything else — per the
// product requirement that unsupported OS languages fall back to English.
function detectLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of candidates) {
    if (!lang) continue;
    const lower = lang.toLowerCase();
    if (lower.startsWith('zh')) return 'zh';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}

// Language is driven by two things: the stored preference (localStorage,
// same durability tier as the theme — see useTheme.js) and the native
// "Preferences ▸ Language" menu (see install_menu in src-tauri/src/lib.rs),
// which emits an `echo-set-language` event on selection. On mount, this also
// pushes the resolved language to Rust via echo_set_menu_language so the
// native menu's own labels start out in sync — Rust has no way to read
// navigator.language itself.
export function useLanguage() {
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || detectLanguage());

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.setAttribute('lang', language === 'zh' ? 'zh-Hant' : 'en');
    if (!isTauri()) return;
    import('@tauri-apps/api/core').then(({ invoke }) =>
      invoke('echo_set_menu_language', { language }).catch(() => {})
    );
  }, [language]);

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten;
    let cancelled = false;
    import('@tauri-apps/api/event').then(({ listen }) => {
      if (cancelled) return;
      listen('echo-set-language', (event) => setLanguage(event.payload)).then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      });
    });
    return () => {
      cancelled = true;
      unlisten && unlisten();
    };
  }, []);

  const t = useCallback(
    (key, ...args) => {
      const entry = translations[language]?.[key] ?? translations.en[key] ?? key;
      return typeof entry === 'function' ? entry(...args) : entry;
    },
    [language]
  );

  return { language, setLanguage, t };
}

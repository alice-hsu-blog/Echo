import { useEffect, useState } from 'react';
import { isTauri } from '../lib/db.js';

const THEME_KEY = 'echo-theme';

function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Theme is driven by the native "View" menu (see src-tauri/src/lib.rs),
// which emits an `echo-set-theme` event on selection. Outside Tauri there's
// no native menu to click, so this only reflects whatever was last stored.
export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'system');

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('echo-set-theme', (event) => setTheme(event.payload)).then((fn) => {
        unlisten = fn;
      });
    });
    return () => unlisten && unlisten();
  }, []);

  return theme;
}

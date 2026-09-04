import { useCallback, useEffect, useMemo, useState } from 'react';
import { isTauri } from '../lib/db.js';
import { DEFAULT_BINDINGS, EDITABLE_SHORTCUT_IDS } from '../lib/shortcuts.js';

const STORAGE_KEY = 'echo-shortcuts';

// Only user-overridable bindings are persisted; anything missing falls back to
// the default, so shipping a new default later just works.
function loadOverrides() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const clean = {};
    for (const id of EDITABLE_SHORTCUT_IDS) {
      if (typeof raw[id] === 'string' && raw[id]) clean[id] = raw[id];
    }
    return clean;
  } catch {
    return {};
  }
}

// Keyboard-shortcut config + the "快捷鍵"/"Keyboard Shortcuts" dialog's
// open/close state. The dialog is opened from the native "Preferences"
// menu (see install_menu in src-tauri/src/lib.rs), which emits an
// `echo-open-shortcuts` event — same pattern as useTheme / useLanguage /
// useMenuBackup. Overrides are stored in localStorage (same durability tier
// as theme/language); there's no Rust round-trip because the native menu has
// no shortcut labels of its own to keep in sync.
export function useShortcuts() {
  const [overrides, setOverrides] = useState(loadOverrides);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides]);

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten;
    let cancelled = false;
    import('@tauri-apps/api/event').then(({ listen }) => {
      if (cancelled) return;
      listen('echo-open-shortcuts', () => setDialogOpen(true)).then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      });
    });
    return () => {
      cancelled = true;
      unlisten && unlisten();
    };
  }, []);

  const bindings = useMemo(() => ({ ...DEFAULT_BINDINGS, ...overrides }), [overrides]);

  const setBinding = useCallback((id, binding) => {
    if (!EDITABLE_SHORTCUT_IDS.includes(id)) return;
    setOverrides((prev) => ({ ...prev, [id]: binding }));
  }, []);

  const resetBinding = useCallback((id) => {
    setOverrides((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => setOverrides({}), []);

  const isCustomized = useCallback((id) => id in overrides, [overrides]);

  return {
    bindings,
    setBinding,
    resetBinding,
    resetAll,
    isCustomized,
    dialogOpen,
    openDialog: useCallback(() => setDialogOpen(true), []),
    closeDialog: useCallback(() => setDialogOpen(false), [])
  };
}

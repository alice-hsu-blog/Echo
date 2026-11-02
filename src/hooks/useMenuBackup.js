import { useEffect, useRef } from 'react';
import { isTauri, migrateDb } from '../lib/db.js';
import { mergeImport } from '../lib/actions.js';

function backupFilename(language) {
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const prefix = language === 'en' ? 'Echo_Backup' : '寫作素材庫備份';
  return `${prefix}_${stamp}.json`;
}

// What a merge actually brought in, so the toast can say so — a file whose
// contents are all already in the db merges to nothing, and a plain "merged"
// toast would read as if it had worked.
function countAdded(before, after) {
  const countNested = (db) => {
    let scenarios = 0;
    let practices = 0;
    db.quotes.forEach((q) =>
      q.scenarios.forEach((sc) => {
        scenarios += 1;
        practices += sc.practices.length;
      })
    );
    return { scenarios, practices };
  };
  const b = countNested(before);
  const a = countNested(after);
  return {
    quotes: after.quotes.length - before.quotes.length,
    folders: (after.folders || []).length - (before.folders || []).length,
    scenarios: a.scenarios - b.scenarios,
    practices: a.practices - b.practices
  };
}

// Export/import backup is driven by the native "File" menu (see install_menu in
// src-tauri/src/lib.rs), which emits `echo-export-backup`/`echo-import-backup`
// events on selection — the native menu replaces the buttons that used to
// live in the sidebar footer (see Toolbar.jsx, now removed). Outside Tauri
// there's no native menu to click, so this hook is a no-op.
export function useMenuBackup(db, commit, toast, showChoice, t, language) {
  const dbRef = useRef(db);
  dbRef.current = db;
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    if (!isTauri()) return;
    let unlistenExport;
    let unlistenImport;
    let cancelled = false;

    const handleExport = async () => {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { invoke } = await import('@tauri-apps/api/core');
      const path = await save({
        defaultPath: backupFilename(languageRef.current),
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (!path) return; // user cancelled
      await invoke('echo_export_backup', { path, data: dbRef.current });
      toast(t('toast.exportedBackup'));
    };

    const handleImport = async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { invoke } = await import('@tauri-apps/api/core');
      const path = await open({
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (!path) return; // user cancelled

      try {
        const raw = await invoke('echo_read_backup_file', { path });
        if (!raw || !Array.isArray(raw.quotes)) throw new Error('invalid format');
        const imported = migrateDb(raw);
        showChoice(
          t('backup.importPrompt'),
          [
            { label: t('confirm.cancel'), className: 'secondary' },
            {
              label: t('backup.merge'),
              action: () => {
                const merged = mergeImport(dbRef.current, imported);
                const added = countAdded(dbRef.current, merged);
                if (!added.quotes && !added.folders && !added.scenarios && !added.practices) {
                  toast(t('toast.importedNothing'));
                  return;
                }
                commit(merged);
                toast(t('toast.importedMerge', added));
              }
            }
          ]
        );
      } catch (err) {
        toast(t('toast.importFailed'));
      }
    };

    import('@tauri-apps/api/event').then(({ listen }) => {
      if (cancelled) return;
      listen('echo-export-backup', handleExport).then((fn) => {
        if (cancelled) fn();
        else unlistenExport = fn;
      });
      listen('echo-import-backup', handleImport).then((fn) => {
        if (cancelled) fn();
        else unlistenImport = fn;
      });
    });

    return () => {
      cancelled = true;
      unlistenExport && unlistenExport();
      unlistenImport && unlistenImport();
    };
  }, [commit, toast, showChoice, t]);
}

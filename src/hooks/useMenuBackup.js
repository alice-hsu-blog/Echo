import { useEffect, useRef } from 'react';
import { isTauri, migrateDb } from '../lib/db.js';
import { mergeImport } from '../lib/actions.js';

function backupFilename() {
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  return `寫作素材庫備份_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
}

// 匯出/匯入備份 is driven by the native "File" menu (see install_menu in
// src-tauri/src/lib.rs), which emits `echo-export-backup`/`echo-import-backup`
// events on selection — the native menu replaces the buttons that used to
// live in the sidebar footer (see Toolbar.jsx, now removed). Outside Tauri
// there's no native menu to click, so this hook is a no-op.
export function useMenuBackup(db, commit, toast, showChoice) {
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    if (!isTauri()) return;
    let unlistenExport;
    let unlistenImport;
    let cancelled = false;

    const handleExport = async () => {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { invoke } = await import('@tauri-apps/api/core');
      const path = await save({
        defaultPath: backupFilename(),
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (!path) return; // user cancelled
      await invoke('echo_export_backup', { path, data: dbRef.current });
      toast('已匯出備份');
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
        if (!raw || !Array.isArray(raw.quotes)) throw new Error('格式不正確');
        const imported = migrateDb(raw);
        showChoice(
          '要如何處理匯入的備份？\n「取代」會清空目前資料庫，換成備份內容。\n「合併」會保留現有資料，加入備份中沒有的內容。',
          [
            { label: '取消', className: 'secondary' },
            {
              label: '合併',
              className: 'secondary',
              action: () => {
                commit(mergeImport(dbRef.current, imported));
                toast('匯入完成（已合併）');
              }
            },
            {
              label: '取代',
              action: () => {
                commit(imported);
                toast('匯入完成（已取代）');
              }
            }
          ]
        );
      } catch (err) {
        toast('匯入失敗：檔案格式不正確');
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
  }, [commit, toast, showChoice]);
}

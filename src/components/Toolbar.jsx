import { useRef } from 'react';
import { isTauri, migrateDb } from '../lib/db.js';
import { mergeImport } from '../lib/actions.js';

export default function Toolbar({ db, commit, toast, showChoice }) {
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    const pad = (n) => String(n).padStart(2, '0');
    const d = new Date();
    const filename = `寫作素材庫備份_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;

    if (isTauri()) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { invoke } = await import('@tauri-apps/api/core');
      const path = await save({
        defaultPath: filename,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (!path) return; // user cancelled
      await invoke('echo_export_backup', { path, data: db });
      toast('已匯出備份');
      return;
    }

    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast('已匯出備份');
  };

  const handleImportChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result);
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
                commit(mergeImport(db, imported));
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
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="toolbar">
      <button className="secondary small" onClick={handleExport}>
        匯出備份 (JSON)
      </button>
      <button className="secondary small" onClick={() => fileInputRef.current.click()}>
        匯入備份
      </button>
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        onChange={handleImportChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

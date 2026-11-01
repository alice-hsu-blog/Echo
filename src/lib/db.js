export const STORAGE_KEY = 'writing-material-db-v1';
export const API_URL = '/api/data';
export const TRASH_RETENTION_DAYS = 30;

export function isTauri() {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('load failed', e);
  }
  return { quotes: [] };
}

export function saveLocal(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Converts old flat quote.practices (each carrying its own scenario text)
// into the current quote.scenarios[].practices[] grouping, drops the
// removed tags field, and backfills folders[]/quote.folderId for data from
// before folders existed. Safe to call on already-migrated data.
export function migrateDb(data) {
  if (!data || !Array.isArray(data.quotes)) return { quotes: [], folders: [] };
  if (!Array.isArray(data.folders)) data.folders = [];
  data.quotes.forEach((q) => {
    if (!Array.isArray(q.scenarios)) {
      const groups = [];
      const byName = {};
      (q.practices || []).forEach((p) => {
        const key = p.scenario || '未分類情境';
        if (!byName[key]) {
          byName[key] = { id: uid(), scenario: key, createdAt: p.createdAt || Date.now(), practices: [] };
          groups.push(byName[key]);
        }
        byName[key].practices.push({
          id: p.id || uid(),
          text: p.text,
          date: p.date || todayStr(),
          createdAt: p.createdAt || Date.now()
        });
      });
      q.scenarios = groups;
    }
    if (q.folderId === undefined) q.folderId = null;
    if (q.deletedAt === undefined) q.deletedAt = null;
    delete q.practices;
    delete q.tags;
  });
  return data;
}

// Resets any quote.folderId that points at a folder missing from folders[]
// back to null (未分類), since SQLite's folder FK would otherwise reject the
// whole echo_save. Kept out of migrateDb on purpose: a backup being merged
// may legitimately reference folders that only exist in the current db
// (mergeImport resolves those itself), so this only runs where `data` is the
// complete db — on load and on a replace-import.
export function clearOrphanFolderIds(data) {
  const folderIds = new Set((data.folders || []).map((f) => f.id));
  if (data.quotes.every((q) => q.folderId === null || folderIds.has(q.folderId))) return data;
  return {
    ...data,
    quotes: data.quotes.map((q) => (q.folderId === null || folderIds.has(q.folderId) ? q : { ...q, folderId: null }))
  };
}

// Permanently drops quotes that have sat in the trash (deletedAt set) for
// longer than the retention window — called once on every load so expired
// items disappear without needing a background timer.
export function purgeExpiredTrash(data, retentionDays = TRASH_RETENTION_DAYS) {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  return {
    ...data,
    quotes: data.quotes.filter((q) => !(q.deletedAt && q.deletedAt <= cutoff))
  };
}

// Whole days left before a trashed quote is auto-purged (0 means "today").
export function daysUntilPurge(deletedAt, retentionDays = TRASH_RETENTION_DAYS) {
  const msLeft = deletedAt + retentionDays * 24 * 60 * 60 * 1000 - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

export function matchesQuote(q, term) {
  return q.text.toLowerCase().includes(term) || q.source.toLowerCase().includes(term);
}

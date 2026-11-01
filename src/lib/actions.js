import { uid, todayStr } from './db.js';

// All functions here are pure: they take a db and return a new db,
// leaving the input untouched so React can diff by reference.

export function addQuote(db, { text, source, folderId = null, id }) {
  const quote = { id: id ?? uid(), text, source, createdAt: Date.now(), folderId, scenarios: [] };
  return { ...db, quotes: [...db.quotes, quote] };
}

export function moveQuoteToFolder(db, qid, folderId) {
  return {
    ...db,
    quotes: db.quotes.map((q) => (q.id === qid ? { ...q, folderId } : q))
  };
}

export function moveQuotesToFolder(db, qids, folderId) {
  const idSet = new Set(qids);
  return {
    ...db,
    quotes: db.quotes.map((q) => (idSet.has(q.id) ? { ...q, folderId } : q))
  };
}

// Soft-delete: moves quotes into the 垃圾桶 (trash) instead of erasing them.
// They're auto-purged after TRASH_RETENTION_DAYS (see purgeExpiredTrash in
// db.js) or can be removed immediately via permanentlyDeleteQuotes.
export function deleteQuotes(db, qids) {
  const idSet = new Set(qids);
  const deletedAt = Date.now();
  return {
    ...db,
    quotes: db.quotes.map((q) => (idSet.has(q.id) ? { ...q, deletedAt } : q))
  };
}

export function restoreQuotes(db, qids) {
  const idSet = new Set(qids);
  return {
    ...db,
    quotes: db.quotes.map((q) => (idSet.has(q.id) ? { ...q, deletedAt: null } : q))
  };
}

export function permanentlyDeleteQuotes(db, qids) {
  const idSet = new Set(qids);
  return { ...db, quotes: db.quotes.filter((q) => !idSet.has(q.id)) };
}

// Sorts by stroke count of the leading character (筆畫由少到多), used only
// to place newly-created folders — existing folders keep whatever order the
// user has manually dragged them into (see reorderFolder).
const strokeCollator =
  typeof Intl !== 'undefined' && Intl.Collator ? new Intl.Collator('zh-Hant-u-co-stroke') : null;

function compareFolderNames(a, b) {
  return strokeCollator ? strokeCollator.compare(a, b) : a.localeCompare(b, 'zh-Hant');
}

export function addFolder(db, name) {
  const folder = { id: uid(), name, createdAt: Date.now() };
  const insertAt = db.folders.findIndex((f) => compareFolderNames(name, f.name) < 0);
  const folders =
    insertAt === -1
      ? [...db.folders, folder]
      : [...db.folders.slice(0, insertAt), folder, ...db.folders.slice(insertAt)];
  return { ...db, folders };
}

// Moves `draggedId` to just before `insertBeforeId`'s current position, or
// to the end of the list if `insertBeforeId` is null — used by the
// sidebar's folder drag-and-drop reordering (the drop position is decided
// by which half of a row the pointer is over, tracked in Sidebar.jsx).
// 未分類/垃圾桶 aren't real entries in db.folders (they're pinned in the
// UI), so they're never valid ids here.
export function reorderFolder(db, draggedId, insertBeforeId) {
  if (draggedId === insertBeforeId) return db;
  const folders = [...db.folders];
  const fromIdx = folders.findIndex((f) => f.id === draggedId);
  if (fromIdx === -1) return db;
  const [moved] = folders.splice(fromIdx, 1);
  const toIdx = insertBeforeId === null ? folders.length : folders.findIndex((f) => f.id === insertBeforeId);
  folders.splice(toIdx === -1 ? folders.length : toIdx, 0, moved);
  return { ...db, folders };
}

export function renameFolder(db, fid, name) {
  return {
    ...db,
    folders: db.folders.map((f) => (f.id === fid ? { ...f, name } : f))
  };
}

export function deleteFolder(db, fid) {
  return {
    ...db,
    folders: db.folders.filter((f) => f.id !== fid),
    quotes: db.quotes.map((q) => (q.folderId === fid ? { ...q, folderId: null } : q))
  };
}

export function updateQuote(db, qid, { text, source }) {
  return {
    ...db,
    quotes: db.quotes.map((q) => (q.id === qid ? { ...q, text, source } : q))
  };
}

export function deleteQuote(db, qid) {
  return deleteQuotes(db, [qid]);
}

export function restoreQuote(db, qid) {
  return restoreQuotes(db, [qid]);
}

export function permanentlyDeleteQuote(db, qid) {
  return permanentlyDeleteQuotes(db, [qid]);
}

export function addScenario(db, qid, scenario) {
  return {
    ...db,
    quotes: db.quotes.map((q) =>
      q.id === qid
        ? { ...q, scenarios: [...q.scenarios, { id: uid(), scenario, createdAt: Date.now(), practices: [] }] }
        : q
    )
  };
}

export function updateScenario(db, qid, sid, scenarioText) {
  return {
    ...db,
    quotes: db.quotes.map((q) =>
      q.id !== qid
        ? q
        : { ...q, scenarios: q.scenarios.map((sc) => (sc.id === sid ? { ...sc, scenario: scenarioText } : sc)) }
    )
  };
}

export function deleteScenario(db, qid, sid) {
  return {
    ...db,
    quotes: db.quotes.map((q) =>
      q.id !== qid ? q : { ...q, scenarios: q.scenarios.filter((sc) => sc.id !== sid) }
    )
  };
}

export function addPractice(db, qid, sid, text) {
  const practice = { id: uid(), text, date: todayStr(), createdAt: Date.now() };
  return {
    ...db,
    quotes: db.quotes.map((q) =>
      q.id !== qid
        ? q
        : {
            ...q,
            scenarios: q.scenarios.map((sc) =>
              sc.id === sid ? { ...sc, practices: [...sc.practices, practice] } : sc
            )
          }
    )
  };
}

export function updatePractice(db, qid, sid, pid, text) {
  return {
    ...db,
    quotes: db.quotes.map((q) =>
      q.id !== qid
        ? q
        : {
            ...q,
            scenarios: q.scenarios.map((sc) =>
              sc.id !== sid
                ? sc
                : { ...sc, practices: sc.practices.map((p) => (p.id === pid ? { ...p, text } : p)) }
            )
          }
    )
  };
}

export function deletePractice(db, qid, sid, pid) {
  return {
    ...db,
    quotes: db.quotes.map((q) =>
      q.id !== qid
        ? q
        : {
            ...q,
            scenarios: q.scenarios.map((sc) =>
              sc.id !== sid ? sc : { ...sc, practices: sc.practices.filter((p) => p.id !== pid) }
            )
          }
    )
  };
}

// Adds quotes whose id isn't already present, and brings their folders
// along: an imported folder whose id already exists keeps the existing one
// (name untouched), one whose name matches an existing folder is folded into
// it, and the rest are appended. Any added quote whose folderId still points
// nowhere falls back to 未分類 — the SQLite schema enforces the folder FK, so
// a dangling folderId would make every later echo_save fail.
//
// A quote that already exists keeps its own text/source/folder/trash state,
// but picks up whatever scenarios and practices the backup has that it lacks
// (see mergeScenarios) — so syncing a backup from another machine doesn't
// drop practices logged there on quotes both copies share.
export function mergeImport(db, imported) {
  const folders = [...(db.folders || [])];
  const folderIds = new Set(folders.map((f) => f.id));
  const folderIdByName = new Map(folders.map((f) => [f.name, f.id]));
  const folderIdMap = new Map(); // imported folder id -> folder id in the merged db

  (imported.folders || []).forEach((f) => {
    if (folderIds.has(f.id)) {
      folderIdMap.set(f.id, f.id);
    } else if (folderIdByName.has(f.name)) {
      folderIdMap.set(f.id, folderIdByName.get(f.name));
    } else {
      folders.push(f);
      folderIds.add(f.id);
      folderIdByName.set(f.name, f.id);
      folderIdMap.set(f.id, f.id);
    }
  });

  const scenarioIds = new Set();
  const practiceIds = new Set();
  db.quotes.forEach((q) =>
    q.scenarios.forEach((sc) => {
      scenarioIds.add(sc.id);
      sc.practices.forEach((p) => practiceIds.add(p.id));
    })
  );

  const existingIds = new Set(db.quotes.map((q) => q.id));
  const importedById = new Map();
  const toAdd = [];
  imported.quotes.forEach((q) => {
    if (existingIds.has(q.id)) {
      importedById.set(q.id, q);
      return;
    }
    existingIds.add(q.id);
    const folderId = folderIdMap.get(q.folderId) ?? (folderIds.has(q.folderId) ? q.folderId : null);
    toAdd.push(folderId === q.folderId ? q : { ...q, folderId });
  });

  const quotes = db.quotes.map((q) => {
    const incoming = importedById.get(q.id);
    if (!incoming) return q;
    const scenarios = mergeScenarios(q.scenarios, incoming.scenarios, scenarioIds, practiceIds);
    return scenarios === q.scenarios ? q : { ...q, scenarios };
  });

  return { ...db, folders, quotes: [...quotes, ...toAdd] };
}

// Folds an imported quote's scenarios into the existing copy's: a scenario is
// matched by id, then by name (so the same 情境 tagged separately on two
// machines merges instead of showing twice), and gets any practices whose id
// it doesn't have yet; unmatched scenarios are appended. scenarioIds/
// practiceIds hold every id already in the db — those columns are UNIQUE in
// SQLite, so an id that's taken elsewhere is skipped rather than inserted.
// Returns `existing` itself when nothing was added.
function mergeScenarios(existing, incoming, scenarioIds, practiceIds) {
  let changed = false;
  const result = existing.map((sc) => ({ ...sc, practices: [...sc.practices] }));

  (incoming || []).forEach((isc) => {
    const newPractices = (isc.practices || []).filter((p) => !practiceIds.has(p.id));
    const target = result.find((sc) => sc.id === isc.id) || result.find((sc) => sc.scenario === isc.scenario);
    if (target) {
      if (newPractices.length === 0) return;
      newPractices.forEach((p) => practiceIds.add(p.id));
      target.practices.push(...newPractices);
      changed = true;
    } else if (!scenarioIds.has(isc.id)) {
      scenarioIds.add(isc.id);
      newPractices.forEach((p) => practiceIds.add(p.id));
      result.push({ ...isc, practices: newPractices });
      changed = true;
    }
  });

  return changed ? result : existing;
}

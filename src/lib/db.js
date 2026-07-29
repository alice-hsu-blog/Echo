export const STORAGE_KEY = 'writing-material-db-v1';
export const API_URL = '/api/data';

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
// into the current quote.scenarios[].practices[] grouping, and drops the
// removed tags field. Safe to call on already-migrated data.
export function migrateDb(data) {
  if (!data || !Array.isArray(data.quotes)) return { quotes: [] };
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
    delete q.practices;
    delete q.tags;
  });
  return data;
}

export function matchesQuote(q, term) {
  return q.text.toLowerCase().includes(term) || q.source.toLowerCase().includes(term);
}

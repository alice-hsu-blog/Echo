import { uid, todayStr } from './db.js';

// All functions here are pure: they take a db and return a new db,
// leaving the input untouched so React can diff by reference.

export function addQuote(db, { text, source }) {
  const quote = { id: uid(), text, source, createdAt: Date.now(), scenarios: [] };
  return { ...db, quotes: [...db.quotes, quote] };
}

export function updateQuote(db, qid, { text, source }) {
  return {
    ...db,
    quotes: db.quotes.map((q) => (q.id === qid ? { ...q, text, source } : q))
  };
}

export function deleteQuote(db, qid) {
  return { ...db, quotes: db.quotes.filter((q) => q.id !== qid) };
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

export function mergeImport(db, imported) {
  const existingIds = new Set(db.quotes.map((q) => q.id));
  const toAdd = imported.quotes.filter((q) => !existingIds.has(q.id));
  return { ...db, quotes: [...db.quotes, ...toAdd] };
}

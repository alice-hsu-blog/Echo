import { matchesQuote } from './db.js';

// Sorts newest-first and, when a search term is active, filters quotes down
// to ones where the quote itself, a scenario name, or a practice matches —
// keeping only the matching scenarios/practices within each visible quote.
// `folderId` is optional: omit it (undefined) to include every quote
// regardless of folder; pass a folder id or null to restrict to quotes
// filed in that folder (null = unfiled).
export function getVisibleQuotes(db, term, folderId) {
  let sortedQuotes = db.quotes.filter((q) => !q.deletedAt).sort((a, b) => b.createdAt - a.createdAt);
  if (folderId !== undefined) {
    sortedQuotes = sortedQuotes.filter((q) => (q.folderId ?? null) === folderId);
  }
  const result = [];

  sortedQuotes.forEach((q) => {
    const quoteSelfMatch = term ? matchesQuote(q, term) : false;
    const sortedScenarios = [...q.scenarios].sort((a, b) => a.createdAt - b.createdAt);

    const scenariosToShow = sortedScenarios
      .map((sc) => {
        const sortedPractices = [...sc.practices].sort((a, b) => a.createdAt - b.createdAt);
        if (!term) return { ...sc, _practices: sortedPractices };
        const scenarioSelfMatch = sc.scenario.toLowerCase().includes(term);
        const practicesToShow =
          quoteSelfMatch || scenarioSelfMatch
            ? sortedPractices
            : sortedPractices.filter((p) => p.text.toLowerCase().includes(term));
        if (!quoteSelfMatch && !scenarioSelfMatch && practicesToShow.length === 0) return null;
        return { ...sc, _practices: practicesToShow };
      })
      .filter(Boolean);

    if (term && !quoteSelfMatch && scenariosToShow.length === 0) return;

    result.push({ quote: q, scenariosToShow });
  });

  return result;
}

// Filters quotes down to ones whose scenarios match the selected tags —
// unlike getVisibleQuotes, this never matches against quote text or
// practice text. `mode: 'any'` (default) keeps a quote if it has at least
// one scenario matching any selected tag (union). `mode: 'all'` keeps a
// quote only if it has a matching scenario for every selected tag
// (intersection), mirroring Apple Notes' tag-browsing Any/All toggle.
export function getQuotesByScenarioTags(db, selectedTags, mode = 'any') {
  if (!selectedTags || selectedTags.length === 0) return [];
  const tagSet = new Set(selectedTags);
  const sortedQuotes = db.quotes.filter((q) => !q.deletedAt).sort((a, b) => b.createdAt - a.createdAt);
  const result = [];

  sortedQuotes.forEach((q) => {
    const sortedScenarios = [...q.scenarios].sort((a, b) => a.createdAt - b.createdAt);
    const scenariosToShow = sortedScenarios
      .filter((sc) => tagSet.has(sc.scenario.trim()))
      .map((sc) => ({ ...sc, _practices: [...sc.practices].sort((a, b) => a.createdAt - b.createdAt) }));

    if (scenariosToShow.length === 0) return;
    if (mode === 'all') {
      const matchedNames = new Set(scenariosToShow.map((sc) => sc.scenario.trim()));
      if (![...tagSet].every((tag) => matchedNames.has(tag))) return;
    }
    result.push({ quote: q, scenariosToShow });
  });

  return result;
}

// Looks up a single quote by id and builds its scenariosToShow, in the same
// shape QuoteCard expects — used to show just-created quote on its own page.
export function getQuoteEntry(db, quoteId) {
  const quote = db.quotes.find((q) => q.id === quoteId);
  if (!quote) return null;
  const scenariosToShow = [...quote.scenarios]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((sc) => ({ ...sc, _practices: [...sc.practices].sort((a, b) => a.createdAt - b.createdAt) }));
  return { quote, scenariosToShow };
}

// Dedups scenario names across the whole database and counts how many
// times each name is used, sorted most-used first (ties alphabetical).
export function getScenarioTags(db) {
  const counts = new Map();
  db.quotes.filter((q) => !q.deletedAt).forEach((q) => {
    q.scenarios.forEach((sc) => {
      const name = sc.scenario.trim();
      if (!name) return;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-Hant'));
}

// Most recently used, deduped 出處 (source) values across the whole
// database, newest first — powers the "press ↓ to see recent sources"
// suggestion list on source inputs. `excludeValue` drops any quote whose
// source matches it (by text, not id — two different quotes can share
// the same source) so the value already sitting in the input doesn't
// show up as one of its own suggestions.
export function getRecentSources(db, limit = 5, excludeValue = '') {
  const sortedQuotes = [...db.quotes].filter((q) => !q.deletedAt).sort((a, b) => b.createdAt - a.createdAt);
  const excluded = (excludeValue || '').trim();
  const seen = new Set();
  const result = [];
  for (const q of sortedQuotes) {
    const source = (q.source || '').trim();
    if (!source || source === excluded || seen.has(source)) continue;
    seen.add(source);
    result.push(source);
    if (result.length >= limit) break;
  }
  return result;
}

// Quotes currently sitting in the 垃圾桶 (trash), newest-deleted first.
export function getTrashedQuotes(db) {
  return db.quotes
    .filter((q) => q.deletedAt)
    .sort((a, b) => b.deletedAt - a.deletedAt);
}

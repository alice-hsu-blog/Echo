import { matchesQuote } from './db.js';

// Sorts newest-first and, when a search term is active, filters quotes down
// to ones where the quote itself, a scenario name, or a practice matches —
// keeping only the matching scenarios/practices within each visible quote.
export function getVisibleQuotes(db, term) {
  const sortedQuotes = [...db.quotes].sort((a, b) => b.createdAt - a.createdAt);
  const result = [];

  sortedQuotes.forEach((q) => {
    const quoteSelfMatch = term ? matchesQuote(q, term) : false;
    const sortedScenarios = [...q.scenarios].sort((a, b) => b.createdAt - a.createdAt);

    const scenariosToShow = sortedScenarios
      .map((sc) => {
        const sortedPractices = [...sc.practices].sort((a, b) => b.createdAt - a.createdAt);
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

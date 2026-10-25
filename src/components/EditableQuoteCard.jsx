import { useMemo, useState } from 'react';
import QuoteCard from './QuoteCard.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { addScenario } from '../lib/actions.js';
import { getScenarioTags } from '../lib/filter.js';

export default function EditableQuoteCard({ entry, children }) {
  const { db, commit, toast, t } = useAppContext();
  const { quote } = entry;
  const [scenarioText, setScenarioText] = useState('');
  const [addScenarioOpen, setAddScenarioOpen] = useState(false);

  const allTags = useMemo(() => {
    const used = new Set(quote.scenarios.map((sc) => sc.scenario.trim()));
    return getScenarioTags(db).filter((tag) => !used.has(tag.name));
  }, [db, quote.scenarios]);

  const term = scenarioText.trim().toLowerCase();
  const tags = term ? allTags.filter((tag) => tag.name.toLowerCase().includes(term)) : allTags;

  const pickScenario = (name) => {
    commit(addScenario(db, quote.id, name));
    setScenarioText('');
    setAddScenarioOpen(false);
    toast(t('toast.addedScenario'));
  };

  return (
    <>
      <QuoteCard
        quote={quote}
        scenariosToShow={entry.scenariosToShow}
        term=""
        collapsed={false}
        onToggleCollapse={() => {}}
        editable
        scenarioText={scenarioText}
        setScenarioText={setScenarioText}
        addScenarioOpen={addScenarioOpen}
        setAddScenarioOpen={setAddScenarioOpen}
      />
      {children}
      {allTags.length > 0 && (
        <div className="scenario-picker">
          <div className="scenario-picker-title">{t('scenarioPicker.title')}</div>
          {tags.length > 0 ? (
            <div className="scenario-tag-cloud">
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag.name}
                  className="scenario-chip"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickScenario(tag.name)}
                >
                  {tag.name} ({tag.count})
                </button>
              ))}
            </div>
          ) : (
            <div className="scenario-picker-empty">{t('scenarioPicker.noMatch')}</div>
          )}
        </div>
      )}
    </>
  );
}

import { getScenarioTags } from '../lib/filter.js';
import { useAppContext } from '../context/AppContext.jsx';

export default function ScenarioTagCloud({ db, selectedTags, onToggleTag, matchMode, onChangeMatchMode, onClearFilter }) {
  const { t } = useAppContext();
  const tags = getScenarioTags(db);

  if (tags.length === 0) {
    return <div className="empty-state">{t('scenarioTagCloud.empty')}</div>;
  }

  return (
    <>
      {selectedTags.length > 0 && (
        <div className="match-mode-toggle">
          <div className="match-mode-toggle-left">
            {selectedTags.length > 1 && (
              <>
                <button
                  className={`small ${matchMode === 'any' ? '' : 'secondary'}`}
                  onClick={() => onChangeMatchMode('any')}
                >
                  {t('scenarioTagCloud.anyTag')}
                </button>
                <button
                  className={`small ${matchMode === 'all' ? '' : 'secondary'}`}
                  onClick={() => onChangeMatchMode('all')}
                >
                  {t('scenarioTagCloud.allTags')}
                </button>
              </>
            )}
          </div>
          <button className="small secondary" onClick={onClearFilter}>
            {t('scenarioTagCloud.clearFilter')}
          </button>
        </div>
      )}
      <div className="scenario-tag-cloud">
        {tags.map((tag) => (
          <span
            key={tag.name}
            className={`scenario-chip${selectedTags.includes(tag.name) ? ' active' : ''}`}
            onClick={() => onToggleTag(tag.name)}
          >
            {tag.name} ({tag.count})
          </span>
        ))}
      </div>
    </>
  );
}

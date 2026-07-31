import { getScenarioTags } from '../lib/filter.js';

export default function ScenarioTagCloud({ db, selectedTags, onToggleTag, matchMode, onChangeMatchMode }) {
  const tags = getScenarioTags(db);

  if (tags.length === 0) {
    return <div className="empty-state">還沒有任何情境，先在名言底下新增情境吧。</div>;
  }

  return (
    <>
      {selectedTags.length > 1 && (
        <div className="match-mode-toggle">
          <span>符合：</span>
          <button
            className={`small ${matchMode === 'any' ? '' : 'secondary'}`}
            onClick={() => onChangeMatchMode('any')}
          >
            任一標籤
          </button>
          <button
            className={`small ${matchMode === 'all' ? '' : 'secondary'}`}
            onClick={() => onChangeMatchMode('all')}
          >
            全部標籤
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

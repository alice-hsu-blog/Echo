import { useMemo, useRef, useState } from 'react';
import Highlight from './Highlight.jsx';
import ItemMenu from './ItemMenu.jsx';
import ScenarioGroup from './ScenarioGroup.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { addScenario, deleteQuote, moveQuoteToFolder, updateQuote } from '../lib/actions.js';
import { getRecentSources, getScenarioTags } from '../lib/filter.js';

export default function QuoteCard({
  quote,
  scenariosToShow,
  term,
  collapsed,
  onToggleCollapse,
  selectMode = false,
  selected = false,
  selectedIds,
  onToggleSelect,
  editable = false
}) {
  const { db, commit, toast, showConfirm, onEditCard, t } = useAppContext();
  const [addScenarioOpen, setAddScenarioOpen] = useState(false);
  const [scenarioText, setScenarioText] = useState('');
  const [scenarioSuggestOpen, setScenarioSuggestOpen] = useState(false);
  const [scenarioHighlight, setScenarioHighlight] = useState(-1);
  const [quoteEditing, setQuoteEditing] = useState(false);
  const [sourceSuggestOpen, setSourceSuggestOpen] = useState(false);
  const [sourceHighlight, setSourceHighlight] = useState(-1);
  const textRef = useRef(null);
  const sourceRef = useRef(null);
  const scenarioComposingRef = useRef(false);
  const skipSaveRef = useRef(false);

  const recentSources = useMemo(() => getRecentSources(db, 5, quote.source), [db, quote.source]);

  const selectRecentSource = (value) => {
    if (sourceRef.current) sourceRef.current.value = value;
    setSourceSuggestOpen(false);
    setSourceHighlight(-1);
  };

  const scenarioSuggestions = useMemo(() => {
    const term = scenarioText.trim().toLowerCase();
    if (!term) return [];
    const used = new Set(quote.scenarios.map((sc) => sc.scenario));
    return getScenarioTags(db)
      .map((tag) => tag.name)
      .filter((name) => !used.has(name) && name.toLowerCase() !== term && name.toLowerCase().includes(term))
      .slice(0, 6);
  }, [db, scenarioText, quote.scenarios]);

  const folder = quote.folderId ? db.folders.find((f) => f.id === quote.folderId) : null;

  const handleSaveQuote = () => {
    const text = textRef.current.value.trim();
    const source = sourceRef.current.value.trim();
    if (!text) {
      toast(t('toast.pleaseEnterQuoteText'));
      return;
    }
    if (!source) {
      toast(t('toast.pleaseEnterSource'));
      return;
    }
    commit(updateQuote(db, quote.id, { text, source }));
    toast(t('toast.savedChanges'));
  };

  const handleQuoteBlur = (e) => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      setQuoteEditing(false);
      return;
    }
    if (e.currentTarget.contains(e.relatedTarget)) return;
    handleSaveQuote();
    setQuoteEditing(false);
  };

  const handleQuoteKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      handleSaveQuote();
      setQuoteEditing(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      skipSaveRef.current = true;
      setQuoteEditing(false);
    }
  };

  const handleSourceKeyDown = (e) => {
    if (e.key === 'ArrowDown' && recentSources.length > 0) {
      e.preventDefault();
      if (!sourceSuggestOpen) {
        setSourceSuggestOpen(true);
        setSourceHighlight(0);
      } else {
        setSourceHighlight((i) => (i + 1) % recentSources.length);
      }
      return;
    }
    if (sourceSuggestOpen && e.key === 'ArrowUp') {
      e.preventDefault();
      setSourceHighlight((i) => (i <= 0 ? recentSources.length - 1 : i - 1));
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && sourceSuggestOpen && sourceHighlight >= 0 && recentSources[sourceHighlight]) {
      e.preventDefault();
      selectRecentSource(recentSources[sourceHighlight]);
      return;
    }
    if (e.key === 'Escape' && sourceSuggestOpen) {
      e.preventDefault();
      e.stopPropagation();
      setSourceSuggestOpen(false);
      setSourceHighlight(-1);
      return;
    }
    handleQuoteKeyDown(e);
  };

  const handleSubmitScenario = () => {
    const scenario = scenarioText.trim();
    if (!scenario) {
      toast(t('toast.pleaseEnterScenario'));
      return;
    }
    commit(addScenario(db, quote.id, scenario));
    setScenarioText('');
    setAddScenarioOpen(false);
    setScenarioSuggestOpen(false);
    setScenarioHighlight(-1);
    toast(t('toast.addedScenario'));
  };

  const selectScenarioSuggestion = (name) => {
    setScenarioText(name);
    setScenarioSuggestOpen(false);
    setScenarioHighlight(-1);
  };

  const handleScenarioKeyDown = (e) => {
    if (scenarioSuggestOpen && scenarioSuggestions.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setScenarioHighlight((i) => {
        const count = scenarioSuggestions.length;
        if (e.key === 'ArrowDown') return (i + 1) % count;
        return i <= 0 ? count - 1 : i - 1;
      });
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      if (scenarioComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      if (scenarioSuggestOpen && scenarioHighlight >= 0 && scenarioSuggestions[scenarioHighlight]) {
        selectScenarioSuggestion(scenarioSuggestions[scenarioHighlight]);
        return;
      }
      handleSubmitScenario();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      if (scenarioSuggestOpen) {
        setScenarioSuggestOpen(false);
        setScenarioHighlight(-1);
        return;
      }
      setAddScenarioOpen(false);
      setScenarioText('');
    }
  };

  return (
    <div
      className={`quote-card${selected ? ' selected' : ''}`}
      draggable={!editable}
      onDoubleClick={() => {
        if (!editable && !selectMode) onEditCard(quote.id);
      }}
      onDragStart={(e) => {
        // In select mode, dragging a card that's part of the current
        // selection carries every selected id along, so multi-select
        // drag-to-folder/trash moves the whole selection at once.
        const draggedIds = selectMode && selected && selectedIds?.size > 1 ? [...selectedIds] : [quote.id];
        e.dataTransfer.setData('text/plain', draggedIds.join(','));
        e.dataTransfer.effectAllowed = 'move';

        const preview = document.createElement('div');
        preview.className = 'drag-preview';
        preview.textContent =
          draggedIds.length > 1
            ? t('bulkAction.selectedCount', draggedIds.length)
            : quote.text.length > 24
              ? `${quote.text.slice(0, 24)}…`
              : quote.text;
        document.body.appendChild(preview);
        e.dataTransfer.setDragImage(preview, 16, 16);

        const cardEl = e.currentTarget;
        const cleanup = () => {
          preview.remove();
          cardEl.removeEventListener('dragend', cleanup);
        };
        cardEl.addEventListener('dragend', cleanup);
      }}
    >
      {selectMode && (
        <label className="quote-select-checkbox">
          <input type="checkbox" checked={selected} onChange={onToggleSelect} />
        </label>
      )}
      <div
        className="quote-meta"
        onClick={editable ? undefined : onToggleCollapse}
        style={editable ? undefined : { cursor: 'pointer' }}
      >
        {editable && quoteEditing ? (
          <div className="edit-form" style={{ flex: 1, marginTop: 0 }} onBlur={handleQuoteBlur}>
            <label>{t('quoteCard.quoteTextLabel')}</label>
            <textarea rows={2} ref={textRef} defaultValue={quote.text} autoFocus onKeyDown={handleQuoteKeyDown} />
            <label>{t('quoteCard.sourceLabel')}</label>
            <div className="source-input-wrap">
              <input
                type="text"
                ref={sourceRef}
                defaultValue={quote.source}
                onChange={() => {
                  setSourceSuggestOpen(false);
                  setSourceHighlight(-1);
                }}
                onBlur={() => {
                  // Delay so a click on a suggestion registers before the list unmounts.
                  setTimeout(() => setSourceSuggestOpen(false), 120);
                }}
                onKeyDown={handleSourceKeyDown}
              />
              {sourceSuggestOpen && recentSources.length > 0 && (
                <ul className="scenario-suggest-list">
                  {recentSources.map((value, i) => (
                    <li key={value}>
                      <button
                        type="button"
                        className={i === sourceHighlight ? 'active' : ''}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectRecentSource(value)}
                      >
                        {value}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div
            onClick={editable ? () => setQuoteEditing(true) : undefined}
            style={editable ? { cursor: 'pointer', flex: 1 } : { flex: 1 }}
          >
            <p className="qtext quote-font">
              <Highlight text={quote.text} term={term} />
            </p>
          </div>
        )}
        <div className="quote-meta-right" onClick={editable ? undefined : (e) => e.stopPropagation()}>
          {!editable && (
            <ItemMenu
              onEdit={() => onEditCard(quote.id)}
              folderMenu={{
                folders: db.folders,
                currentFolderId: quote.folderId ?? null,
                onMove: (folderId) => {
                  commit(moveQuoteToFolder(db, quote.id, folderId));
                  toast(folderId ? t('toast.movedToFolder') : t('toast.movedOutOfFolder'));
                }
              }}
              onDelete={() => {
                const practiceCount = quote.scenarios.reduce((s, sc) => s + sc.practices.length, 0);
                const msg =
                  practiceCount > 0
                    ? t('quoteCard.deleteConfirmWithPractices', quote.scenarios.length, practiceCount)
                    : t('quoteCard.deleteConfirm');
                showConfirm(msg, () => {
                  commit(deleteQuote(db, quote.id));
                });
              }}
            />
          )}
        </div>
        {!(editable && quoteEditing) && (
          <div
            className="quote-source"
            onClick={editable ? () => setQuoteEditing(true) : undefined}
            style={editable ? { cursor: 'pointer' } : undefined}
          >
            <span className="quote-source-text">
              <Highlight text={quote.source || t('quoteCard.sourceUnfilled')} term={term} />
            </span>
            {folder && <span className="folder-tag">/{folder.name}</span>}
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="scenarios">
            {scenariosToShow.map((sc) => (
              <ScenarioGroup
                key={sc.id}
                scenario={sc}
                practices={sc._practices}
                qid={quote.id}
                term={term}
                editable={editable}
              />
            ))}
          </div>

          {editable && (
            <>
              <div className={`add-scenario-form ${addScenarioOpen ? '' : 'hidden'}`}>
                <label>{t('quoteCard.scenarioLabel')}</label>
                <div className="scenario-input-wrap">
                  <input
                    type="text"
                    className="scenario-input"
                    placeholder={t('quoteCard.scenarioPlaceholder')}
                    value={scenarioText}
                    onChange={(e) => {
                      setScenarioText(e.target.value);
                      setScenarioSuggestOpen(true);
                      setScenarioHighlight(-1);
                    }}
                    onFocus={() => setScenarioSuggestOpen(true)}
                    onBlur={() => {
                      // Delay so a click on a suggestion registers before the list unmounts.
                      setTimeout(() => setScenarioSuggestOpen(false), 120);
                    }}
                    onKeyDown={handleScenarioKeyDown}
                    onCompositionStart={() => {
                      scenarioComposingRef.current = true;
                    }}
                    onCompositionEnd={() => {
                      scenarioComposingRef.current = false;
                    }}
                    autoFocus={addScenarioOpen}
                  />
                  {scenarioSuggestOpen && scenarioSuggestions.length > 0 && (
                    <ul className="scenario-suggest-list">
                      {scenarioSuggestions.map((name, i) => (
                        <li key={name}>
                          <button
                            type="button"
                            className={i === scenarioHighlight ? 'active' : ''}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectScenarioSuggestion(name)}
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="card-actions">
                <button className="small" onClick={() => setAddScenarioOpen((o) => !o)}>
                  {t('quoteCard.addScenario')}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

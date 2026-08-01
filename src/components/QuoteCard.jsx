import { useRef, useState } from 'react';
import Highlight from './Highlight.jsx';
import ItemMenu from './ItemMenu.jsx';
import ScenarioGroup from './ScenarioGroup.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { addScenario, deleteQuote, moveQuoteToFolder, updateQuote } from '../lib/actions.js';

export default function QuoteCard({
  quote,
  scenariosToShow,
  term,
  collapsed,
  onToggleCollapse,
  selectMode = false,
  selected = false,
  onToggleSelect,
  editable = false
}) {
  const { db, commit, toast, showConfirm, onEditCard, t } = useAppContext();
  const [addScenarioOpen, setAddScenarioOpen] = useState(false);
  const [scenarioText, setScenarioText] = useState('');
  const [quoteEditing, setQuoteEditing] = useState(false);
  const textRef = useRef(null);
  const sourceRef = useRef(null);
  const scenarioComposingRef = useRef(false);
  const skipSaveRef = useRef(false);

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

  const handleSubmitScenario = () => {
    const scenario = scenarioText.trim();
    if (!scenario) {
      toast(t('toast.pleaseEnterScenario'));
      return;
    }
    commit(addScenario(db, quote.id, scenario));
    setScenarioText('');
    setAddScenarioOpen(false);
    toast(t('toast.addedScenario'));
  };

  const handleScenarioKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (scenarioComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      handleSubmitScenario();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setAddScenarioOpen(false);
      setScenarioText('');
    }
  };

  return (
    <div
      className={`quote-card${selected ? ' selected' : ''}`}
      draggable={!selectMode}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', quote.id);
        e.dataTransfer.effectAllowed = 'move';

        const preview = document.createElement('div');
        preview.className = 'drag-preview';
        preview.textContent = quote.text.length > 24 ? `${quote.text.slice(0, 24)}…` : quote.text;
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
            <input type="text" ref={sourceRef} defaultValue={quote.source} onKeyDown={handleQuoteKeyDown} />
          </div>
        ) : (
          <div
            onClick={editable ? () => setQuoteEditing(true) : undefined}
            style={editable ? { cursor: 'pointer', flex: 1 } : { flex: 1 }}
          >
            <p className="qtext quote-font">
              「<Highlight text={quote.text} term={term} />」
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
                <input
                  type="text"
                  className="scenario-input"
                  placeholder={t('quoteCard.scenarioPlaceholder')}
                  value={scenarioText}
                  onChange={(e) => setScenarioText(e.target.value)}
                  onKeyDown={handleScenarioKeyDown}
                  onCompositionStart={() => {
                    scenarioComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    scenarioComposingRef.current = false;
                  }}
                  autoFocus={addScenarioOpen}
                />
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

import { useState } from 'react';
import { addQuote } from '../lib/actions.js';
import { uid } from '../lib/db.js';
import { useAppContext } from '../context/AppContext.jsx';
import { getRecentSources } from '../lib/filter.js';

export default function AddQuoteForm({ db, commit, toast, folderId = null, onCreated }) {
  const { t } = useAppContext();
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [sourceSuggestOpen, setSourceSuggestOpen] = useState(false);
  const [sourceHighlight, setSourceHighlight] = useState(-1);
  const recentSources = getRecentSources(db);

  const selectRecentSource = (value) => {
    setSource(value);
    setSourceSuggestOpen(false);
    setSourceHighlight(-1);
  };

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast(t('toast.pleaseEnterQuoteText'));
      return;
    }
    const id = uid();
    commit(addQuote(db, { id, text: trimmed, source: source.trim(), folderId }));
    setText('');
    setSource('');
    toast(t('toast.addedSuccess'));
    onCreated?.(id);
  };

  return (
    <div className="panel">
      <label htmlFor="newQuoteText">{t('addQuoteForm.originalTextLabel')}</label>
      <textarea
        id="newQuoteText"
        rows={2}
        placeholder={t('addQuoteForm.textPlaceholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      <label htmlFor="newQuoteSource">{t('addQuoteForm.sourceLabel')}</label>
      <div className="source-input-wrap">
        <input
          type="text"
          id="newQuoteSource"
          placeholder={t('addQuoteForm.sourcePlaceholder')}
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setSourceSuggestOpen(false);
            setSourceHighlight(-1);
          }}
          onBlur={() => {
            // Delay so a click on a suggestion registers before the list unmounts.
            setTimeout(() => setSourceSuggestOpen(false), 120);
          }}
          onKeyDown={(e) => {
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
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault();
              if (sourceSuggestOpen && sourceHighlight >= 0 && recentSources[sourceHighlight]) {
                selectRecentSource(recentSources[sourceHighlight]);
                return;
              }
              handleAdd();
            } else if (e.key === 'Escape' && sourceSuggestOpen) {
              e.stopPropagation();
              setSourceSuggestOpen(false);
              setSourceHighlight(-1);
            }
          }}
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
      <button onClick={handleAdd}>{t('addQuoteForm.submit')}</button>
    </div>
  );
}

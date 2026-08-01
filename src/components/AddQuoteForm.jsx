import { useState } from 'react';
import { addQuote } from '../lib/actions.js';
import { uid } from '../lib/db.js';
import { useAppContext } from '../context/AppContext.jsx';

export default function AddQuoteForm({ db, commit, toast, folderId = null, onCreated }) {
  const { t } = useAppContext();
  const [text, setText] = useState('');
  const [source, setSource] = useState('');

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
      <input
        type="text"
        id="newQuoteSource"
        placeholder={t('addQuoteForm.sourcePlaceholder')}
        value={source}
        onChange={(e) => setSource(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault();
            handleAdd();
          }
        }}
      />
      <button onClick={handleAdd}>{t('addQuoteForm.submit')}</button>
    </div>
  );
}

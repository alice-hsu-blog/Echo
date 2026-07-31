import { useState } from 'react';
import { addQuote } from '../lib/actions.js';
import { uid } from '../lib/db.js';

export default function AddQuoteForm({ db, commit, toast, folderId = null, onCreated }) {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast('請輸入名言原文');
      return;
    }
    const id = uid();
    commit(addQuote(db, { id, text: trimmed, source: source.trim(), folderId }));
    setText('');
    setSource('');
    toast('新增成功');
    onCreated?.(id);
  };

  return (
    <div className="panel">
      <label htmlFor="newQuoteText">原文</label>
      <textarea
        id="newQuoteText"
        rows={2}
        placeholder="輸入你想收藏的句子..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      <label htmlFor="newQuoteSource">出處</label>
      <input
        type="text"
        id="newQuoteSource"
        placeholder="例：《紅樓夢》第二十七回"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault();
            handleAdd();
          }
        }}
      />
      <button onClick={handleAdd}>加入資料庫</button>
    </div>
  );
}

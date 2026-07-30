import { useState } from 'react';
import { addQuote } from '../lib/actions.js';

export default function AddQuoteForm({ db, commit, toast }) {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast('請輸入名言原文');
      return;
    }
    commit(addQuote(db, { text: trimmed, source: source.trim() }));
    setText('');
    setSource('');
    toast('已加入資料庫');
  };

  return (
    <div className="panel">
      <h2>新增名言佳句</h2>
      <label htmlFor="newQuoteText">原文</label>
      <textarea
        id="newQuoteText"
        rows={2}
        placeholder="輸入你想收藏的句子..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <label htmlFor="newQuoteSource">出處</label>
      <input
        type="text"
        id="newQuoteSource"
        placeholder="例：《紅樓夢》第二十七回"
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />
      <button onClick={handleAdd}>加入資料庫</button>
    </div>
  );
}

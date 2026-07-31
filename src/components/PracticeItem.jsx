import { useRef, useState } from 'react';
import Highlight from './Highlight.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { deletePractice, updatePractice } from '../lib/actions.js';

export default function PracticeItem({ practice, qid, sid, term, editable = false }) {
  const { db, commit, toast } = useAppContext();
  const [practiceEditing, setPracticeEditing] = useState(false);
  const textRef = useRef(null);
  const composingRef = useRef(false);

  const handleSave = () => {
    const text = textRef.current.value.trim();
    if (!text) {
      commit(deletePractice(db, qid, sid, practice.id));
      toast('已刪除仿寫練習');
      return;
    }
    commit(updatePractice(db, qid, sid, practice.id, text));
    toast('已儲存修改');
  };

  const handleBlur = () => {
    handleSave();
    setPracticeEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  if (editable && practiceEditing) {
    return (
      <div className="practice-item">
        <div className="edit-form" style={{ marginTop: 0 }}>
          <textarea
            rows={2}
            ref={textRef}
            defaultValue={practice.text}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={() => {
              composingRef.current = false;
            }}
            onBlur={handleBlur}
            autoFocus
          />
        </div>
      </div>
    );
  }

  return (
    <div className="practice-item">
      <div
        className="ptext"
        onClick={editable ? () => setPracticeEditing(true) : undefined}
        style={editable ? { cursor: 'pointer' } : undefined}
      >
        <Highlight text={practice.text} term={term} />
      </div>
    </div>
  );
}

import { useRef } from 'react';
import Highlight from './Highlight.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { deletePractice, updatePractice } from '../lib/actions.js';

export default function PracticeItem({ practice, qid, sid, term }) {
  const { db, commit, editingState, setEditingState, toast } = useAppContext();
  const textRef = useRef(null);
  const settledRef = useRef(false);
  const composingRef = useRef(false);

  const editing =
    editingState?.type === 'practice' &&
    editingState.qid === qid &&
    editingState.sid === sid &&
    editingState.pid === practice.id;

  const handleSave = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    const text = textRef.current.value.trim();
    if (!text) {
      commit(deletePractice(db, qid, sid, practice.id));
      setEditingState(null);
      toast('已刪除仿寫練習');
      return;
    }
    commit(updatePractice(db, qid, sid, practice.id, text));
    setEditingState(null);
    toast('已儲存修改');
  };

  const handleCancel = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    setEditingState(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (editing) {
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
            onBlur={handleSave}
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
        onClick={() => {
          settledRef.current = false;
          setEditingState({ type: 'practice', qid, sid, pid: practice.id });
        }}
      >
        <Highlight text={practice.text} term={term} />
      </div>
    </div>
  );
}

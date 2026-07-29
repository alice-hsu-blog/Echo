import { useRef } from 'react';
import Highlight from './Highlight.jsx';
import ItemMenu from './ItemMenu.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { deletePractice, updatePractice } from '../lib/actions.js';

export default function PracticeItem({ practice, qid, sid, term }) {
  const { db, commit, editingState, setEditingState, toast, showConfirm } = useAppContext();
  const textRef = useRef(null);

  const editing =
    editingState?.type === 'practice' &&
    editingState.qid === qid &&
    editingState.sid === sid &&
    editingState.pid === practice.id;

  if (editing) {
    return (
      <div className="practice-item">
        <div className="edit-form" style={{ marginTop: 0 }}>
          <textarea rows={2} ref={textRef} defaultValue={practice.text} />
          <div className="edit-actions">
            <button
              className="small"
              onClick={() => {
                const text = textRef.current.value.trim();
                if (!text) {
                  toast('請輸入仿寫內容');
                  return;
                }
                commit(updatePractice(db, qid, sid, practice.id, text));
                setEditingState(null);
                toast('已儲存修改');
              }}
            >
              儲存
            </button>
            <button className="small secondary" onClick={() => setEditingState(null)}>
              取消
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-item">
      <div className="ptext">
        <Highlight text={practice.text} term={term} />
      </div>
      <div className="pmeta">
        <span className="date">{practice.date}</span>
        <ItemMenu
          onEdit={() => setEditingState({ type: 'practice', qid, sid, pid: practice.id })}
          onDelete={() =>
            showConfirm('確定要刪除這篇仿寫練習嗎？', () => {
              commit(deletePractice(db, qid, sid, practice.id));
            })
          }
        />
      </div>
    </div>
  );
}

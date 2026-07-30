import { useRef, useState } from 'react';
import Highlight from './Highlight.jsx';
import ItemMenu from './ItemMenu.jsx';
import PracticeItem from './PracticeItem.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { addPractice, deleteScenario, updateScenario } from '../lib/actions.js';

export default function ScenarioGroup({ scenario, practices, qid, term }) {
  const { db, commit, editingState, setEditingState, toast, showConfirm } = useAppContext();
  const [addOpen, setAddOpen] = useState(false);
  const [practiceText, setPracticeText] = useState('');
  const scenarioTextRef = useRef(null);

  const editing =
    editingState?.type === 'scenario' && editingState.qid === qid && editingState.sid === scenario.id;

  const handleSubmitPractice = () => {
    const text = practiceText.trim();
    if (!text) {
      toast('請填寫仿寫內容');
      return;
    }
    commit(addPractice(db, qid, scenario.id, text));
    setPracticeText('');
    setAddOpen(false);
    toast('已加入仿寫練習');
  };

  return (
    <div className="scenario-group">
      {editing ? (
        <div className="edit-form" style={{ marginTop: 0 }}>
          <input type="text" ref={scenarioTextRef} defaultValue={scenario.scenario} />
          <div className="edit-actions">
            <button
              className="small"
              onClick={() => {
                const text = scenarioTextRef.current.value.trim();
                if (!text) {
                  toast('請輸入情境');
                  return;
                }
                commit(updateScenario(db, qid, scenario.id, text));
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
      ) : (
        <div className="scenario-header">
          <span className="scenario-title">
            情境：<Highlight text={scenario.scenario} term={term} />
          </span>
          <ItemMenu
            onEdit={() => setEditingState({ type: 'scenario', qid, sid: scenario.id })}
            onDelete={() => {
              const msg =
                scenario.practices.length > 0
                  ? `這個情境底下有 ${scenario.practices.length} 篇仿寫，確定要一併刪除嗎？`
                  : '確定要刪除這個情境嗎？';
              showConfirm(msg, () => {
                commit(deleteScenario(db, qid, scenario.id));
              });
            }}
          />
        </div>
      )}

      {practices.map((p) => (
        <PracticeItem key={p.id} practice={p} qid={qid} sid={scenario.id} term={term} />
      ))}

      <div className={`add-practice-form ${addOpen ? '' : 'hidden'}`}>
        <textarea
          rows={2}
          className="practice-input"
          placeholder="寫下你的仿寫句子..."
          value={practiceText}
          onChange={(e) => setPracticeText(e.target.value)}
        />
        <button className="small" onClick={handleSubmitPractice}>
          加入仿寫
        </button>
        <button
          className="small secondary"
          onClick={() => {
            setAddOpen(false);
            setPracticeText('');
          }}
        >
          取消
        </button>
      </div>
      <button className="small secondary" onClick={() => setAddOpen((o) => !o)}>
        ＋
      </button>
    </div>
  );
}

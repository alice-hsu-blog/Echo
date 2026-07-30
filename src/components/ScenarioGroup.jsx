import { useRef, useState } from 'react';
import Highlight from './Highlight.jsx';
import PracticeItem from './PracticeItem.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { addPractice, deleteScenario, updateScenario } from '../lib/actions.js';

export default function ScenarioGroup({ scenario, practices, qid, term }) {
  const { db, commit, editingState, setEditingState, toast, showConfirm } = useAppContext();
  const [addOpen, setAddOpen] = useState(false);
  const [practiceText, setPracticeText] = useState('');
  const scenarioTextRef = useRef(null);
  const composingRef = useRef(false);
  const scenarioComposingRef = useRef(false);
  const scenarioSettledRef = useRef(false);

  const editing =
    editingState?.type === 'scenario' && editingState.qid === qid && editingState.sid === scenario.id;

  const handleSaveScenario = () => {
    if (scenarioSettledRef.current) return;
    scenarioSettledRef.current = true;
    const text = scenarioTextRef.current.value.trim();
    if (!text) {
      setEditingState(null);
      if (scenario.practices.length > 0) {
        showConfirm('以下有仿寫的句子，確認刪除嗎？', () => {
          commit(deleteScenario(db, qid, scenario.id));
          toast('已刪除情境');
        });
      } else {
        commit(deleteScenario(db, qid, scenario.id));
        toast('已刪除情境');
      }
      return;
    }
    commit(updateScenario(db, qid, scenario.id, text));
    setEditingState(null);
    toast('已儲存修改');
  };

  const handleCancelScenario = () => {
    if (scenarioSettledRef.current) return;
    scenarioSettledRef.current = true;
    setEditingState(null);
  };

  const handleScenarioKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (scenarioComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      handleSaveScenario();
    } else if (e.key === 'Escape') {
      handleCancelScenario();
    }
  };

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

  const handlePracticeKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      handleSubmitPractice();
    } else if (e.key === 'Escape') {
      setAddOpen(false);
      setPracticeText('');
    }
  };

  return (
    <div className="scenario-group">
      {editing ? (
        <div className="edit-form" style={{ marginTop: 0 }}>
          <input
            type="text"
            ref={scenarioTextRef}
            defaultValue={scenario.scenario}
            onKeyDown={handleScenarioKeyDown}
            onCompositionStart={() => {
              scenarioComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              scenarioComposingRef.current = false;
            }}
            onBlur={handleSaveScenario}
            autoFocus
          />
        </div>
      ) : (
        <div className="scenario-header">
          <span
            className="scenario-title"
            onClick={() => {
              scenarioSettledRef.current = false;
              setEditingState({ type: 'scenario', qid, sid: scenario.id });
            }}
          >
            情境：<Highlight text={scenario.scenario} term={term} />
          </span>
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
          onKeyDown={handlePracticeKeyDown}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
          }}
          autoFocus={addOpen}
        />
      </div>
      <button className="small secondary" onClick={() => setAddOpen((o) => !o)}>
        ＋
      </button>
    </div>
  );
}

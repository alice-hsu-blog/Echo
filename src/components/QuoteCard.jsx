import { useRef, useState } from 'react';
import Highlight from './Highlight.jsx';
import ItemMenu from './ItemMenu.jsx';
import ScenarioGroup from './ScenarioGroup.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { addScenario, deleteQuote, updateQuote } from '../lib/actions.js';

export default function QuoteCard({ quote, scenariosToShow, term, collapsed, onToggleCollapse }) {
  const { db, commit, editingState, setEditingState, toast, showConfirm } = useAppContext();
  const [addScenarioOpen, setAddScenarioOpen] = useState(false);
  const [scenarioText, setScenarioText] = useState('');
  const textRef = useRef(null);
  const sourceRef = useRef(null);

  const editing = editingState?.type === 'quote' && editingState.qid === quote.id;
  const totalPractices = quote.scenarios.reduce((s, sc) => s + sc.practices.length, 0);

  const handleSubmitScenario = () => {
    const scenario = scenarioText.trim();
    if (!scenario) {
      toast('請填寫情境');
      return;
    }
    commit(addScenario(db, quote.id, scenario));
    setScenarioText('');
    setAddScenarioOpen(false);
    toast('已加入情境');
  };

  return (
    <div className="quote-card">
      <div className="quote-meta">
        {editing ? (
          <div className="edit-form" style={{ flex: 1, marginTop: 0 }}>
            <label>名言原文</label>
            <textarea rows={2} ref={textRef} defaultValue={quote.text} />
            <label>出處</label>
            <input type="text" ref={sourceRef} defaultValue={quote.source} />
            <div className="edit-actions">
              <button
                className="small"
                onClick={() => {
                  const text = textRef.current.value.trim();
                  const source = sourceRef.current.value.trim();
                  if (!text) {
                    toast('請輸入名言原文');
                    return;
                  }
                  commit(updateQuote(db, quote.id, { text, source }));
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
          <>
            <div>
              <p className="qtext quote-font">
                「<Highlight text={quote.text} term={term} />」
              </p>
              <div className="quote-source">
                <Highlight text={quote.source || '出處未填'} term={term} />
              </div>
            </div>
            <div className="quote-meta-right">
              <span className="count-badge">{totalPractices} 篇仿寫</span>
              <ItemMenu
                onEdit={() => setEditingState({ type: 'quote', qid: quote.id })}
                onDelete={() => {
                  const practiceCount = quote.scenarios.reduce((s, sc) => s + sc.practices.length, 0);
                  const msg =
                    practiceCount > 0
                      ? `這則名言底下有 ${quote.scenarios.length} 個情境、共 ${practiceCount} 篇仿寫練習，確定要一併刪除嗎？`
                      : '確定要刪除這則名言嗎？';
                  showConfirm(msg, () => {
                    commit(deleteQuote(db, quote.id));
                  });
                }}
              />
              <button className="secondary collapse-toggle-btn" onClick={onToggleCollapse}>
                <svg
                  className="arrow-icon"
                  style={{ transform: `rotate(${collapsed ? '-90deg' : '0deg'})` }}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 10L12 15L17 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="scenarios">
            {scenariosToShow.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                尚無情境，點下方「＋ 新增情境」開始吧
              </div>
            ) : (
              scenariosToShow.map((sc) => (
                <ScenarioGroup key={sc.id} scenario={sc} practices={sc._practices} qid={quote.id} term={term} />
              ))
            )}
          </div>

          <div className={`add-scenario-form ${addScenarioOpen ? '' : 'hidden'}`}>
            <label>情境</label>
            <input
              type="text"
              className="scenario-input"
              placeholder="例：描寫等待一個人卻等不到的焦慮"
              value={scenarioText}
              onChange={(e) => setScenarioText(e.target.value)}
            />
            <button className="small" onClick={handleSubmitScenario}>
              加入情境
            </button>
            <button
              className="small secondary"
              onClick={() => {
                setAddScenarioOpen(false);
                setScenarioText('');
              }}
            >
              取消
            </button>
          </div>

          <div className="card-actions">
            <button className="small" onClick={() => setAddScenarioOpen((o) => !o)}>
              ＋ 新增情境
            </button>
          </div>
        </>
      )}
    </div>
  );
}

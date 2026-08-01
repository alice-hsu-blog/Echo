import { useRef, useState } from 'react';
import Highlight from './Highlight.jsx';
import PracticeItem from './PracticeItem.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { addPractice, deleteScenario, updateScenario } from '../lib/actions.js';

export default function ScenarioGroup({ scenario, practices, qid, term, editable = false }) {
  const { db, commit, toast, showConfirm, t } = useAppContext();
  const [addOpen, setAddOpen] = useState(false);
  const [practiceText, setPracticeText] = useState('');
  const [scenarioEditing, setScenarioEditing] = useState(false);
  const scenarioTextRef = useRef(null);
  const composingRef = useRef(false);
  const scenarioComposingRef = useRef(false);
  const skipSaveRef = useRef(false);

  const handleSaveScenario = () => {
    const text = scenarioTextRef.current.value.trim();
    if (!text) {
      if (scenario.practices.length > 0) {
        showConfirm(t('scenarioGroup.confirmDeleteWithPractices'), () => {
          commit(deleteScenario(db, qid, scenario.id));
          toast(t('toast.deletedScenario'));
        });
      } else {
        commit(deleteScenario(db, qid, scenario.id));
        toast(t('toast.deletedScenario'));
      }
      return;
    }
    commit(updateScenario(db, qid, scenario.id, text));
    toast(t('toast.savedChanges'));
  };

  const handleScenarioBlur = () => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      setScenarioEditing(false);
      return;
    }
    handleSaveScenario();
    setScenarioEditing(false);
  };

  const handleScenarioKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (scenarioComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      skipSaveRef.current = true;
      e.currentTarget.blur();
    }
  };

  const handleSubmitPractice = () => {
    const text = practiceText.trim();
    if (!text) {
      toast(t('toast.pleaseEnterPractice'));
      return;
    }
    commit(addPractice(db, qid, scenario.id, text));
    setPracticeText('');
    setAddOpen(false);
    toast(t('toast.addedPractice'));
  };

  const handlePracticeKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      handleSubmitPractice();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setAddOpen(false);
      setPracticeText('');
    }
  };

  return (
    <div className="scenario-group">
      {editable && scenarioEditing ? (
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
            onBlur={handleScenarioBlur}
            autoFocus
          />
        </div>
      ) : (
        <div className="scenario-header">
          <span
            className="scenario-title"
            onClick={editable ? () => setScenarioEditing(true) : undefined}
            style={editable ? { cursor: 'pointer' } : undefined}
          >
            {t('scenarioGroup.label')}<Highlight text={scenario.scenario} term={term} />
          </span>
        </div>
      )}

      {practices.map((p) => (
        <PracticeItem key={p.id} practice={p} qid={qid} sid={scenario.id} term={term} editable={editable} />
      ))}

      {editable && (
        <>
          <div className={`add-practice-form ${addOpen ? '' : 'hidden'}`}>
            <textarea
              rows={2}
              className="practice-input"
              placeholder={t('scenarioGroup.practicePlaceholder')}
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
        </>
      )}
    </div>
  );
}

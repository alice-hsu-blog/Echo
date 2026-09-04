import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import { SHORTCUT_DEFS, eventToBinding, formatBinding } from '../lib/shortcuts.js';

// The "快捷鍵"/"Keyboard Shortcuts" modal: opened from the native Preferences
// menu (see useShortcuts.js). Lists every shortcut with its current binding;
// editable rows can be re-recorded by pressing a new key combo, reset to
// default individually, or reset all at once.
export default function ShortcutsDialog({
  open,
  bindings,
  onSetBinding,
  onResetBinding,
  onResetAll,
  isCustomized,
  onClose
}) {
  const { t } = useContext(AppContext);
  const [recordingId, setRecordingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setRecordingId(null);
      setError(null);
    }
  }, [open]);

  // While recording, the next keydown becomes the new binding. Capture phase
  // + preventDefault so the combo doesn't also trigger app/browser actions.
  useEffect(() => {
    if (!recordingId) return;
    const onKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setRecordingId(null);
        setError(null);
        return;
      }
      const binding = eventToBinding(e);
      if (!binding) return; // bare modifier / disallowed key — keep waiting

      const clash = SHORTCUT_DEFS.find(
        (d) => d.id !== recordingId && bindings[d.id] === binding
      );
      if (clash) {
        setError(t('shortcuts.conflict', formatBinding(binding), t(clash.labelKey)));
        return;
      }
      onSetBinding(recordingId, binding);
      setRecordingId(null);
      setError(null);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [recordingId, bindings, onSetBinding, t]);

  // Plain Escape (when not recording) closes the dialog.
  useEffect(() => {
    if (!open || recordingId) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, recordingId, onClose]);

  if (!open) return null;

  const anyCustomized = SHORTCUT_DEFS.some((d) => d.editable && isCustomized(d.id));

  return (
    <div className="confirm-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="shortcuts-box">
        <div className="shortcuts-header">
          <h2>{t('shortcuts.title')}</h2>
          <button className="shortcuts-close" onClick={onClose} title={t('shortcuts.close')}>
            ×
          </button>
        </div>

        <p className="shortcuts-hint">{t('shortcuts.hint')}</p>

        <ul className="shortcuts-list">
          {SHORTCUT_DEFS.map((d) => {
            const recording = recordingId === d.id;
            return (
              <li key={d.id} className="shortcuts-row">
                <div className="shortcuts-label">
                  <span className="shortcuts-name">{t(d.labelKey)}</span>
                  <span className="shortcuts-desc">{t(d.descKey)}</span>
                  {recording && error && <span className="shortcuts-error">{error}</span>}
                </div>
                <div className="shortcuts-controls">
                  {recording ? (
                    <span className="shortcuts-key recording">{t('shortcuts.recording')}</span>
                  ) : (
                    <kbd className="shortcuts-key">{formatBinding(bindings[d.id])}</kbd>
                  )}
                  {d.editable ? (
                    <>
                      <button
                        className="small secondary"
                        onClick={() => {
                          setError(null);
                          setRecordingId(recording ? null : d.id);
                        }}
                      >
                        {recording ? t('shortcuts.cancel') : t('shortcuts.edit')}
                      </button>
                      <button
                        className="small secondary"
                        disabled={!isCustomized(d.id)}
                        onClick={() => {
                          onResetBinding(d.id);
                          if (recording) setRecordingId(null);
                        }}
                      >
                        {t('shortcuts.reset')}
                      </button>
                    </>
                  ) : (
                    <span className="shortcuts-fixed">{t('shortcuts.fixed')}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="shortcuts-footer">
          <button className="secondary" disabled={!anyCustomized} onClick={onResetAll}>
            {t('shortcuts.resetAll')}
          </button>
          <button onClick={onClose}>{t('shortcuts.done')}</button>
        </div>
      </div>
    </div>
  );
}

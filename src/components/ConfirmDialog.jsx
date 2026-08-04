import { useEffect, useState } from 'react';

// Tracks which button is "selected" via its own state rather than real DOM
// focus: WKWebView (the Tauri desktop build's engine) excludes <button>
// elements from the Tab order by default (macOS's "Full Keyboard Access"
// setting), so relying on document.activeElement / button.focus() silently
// does nothing there even though it works in Chromium during dev-mode
// testing. This keeps Tab-to-switch/Enter-to-confirm working everywhere.
export default function ConfirmDialog({ state, onAction }) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    if (!state) return;
    const primaryIndex = state.buttons.findIndex((b) => b.className !== 'secondary');
    setFocusedIndex(primaryIndex >= 0 ? primaryIndex : state.buttons.length - 1);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const count = state.buttons.length;
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setFocusedIndex((i) => (e.shiftKey ? (i - 1 + count) % count : (i + 1) % count));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex((i) => (i - 1 + count) % count);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex((i) => (i + 1) % count);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onAction(state.buttons[focusedIndex]?.action);
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [state, onAction, focusedIndex]);

  return (
    <div className={`confirm-overlay ${state ? '' : 'hidden'}`}>
      <div className="confirm-box">
        <p>{state?.message}</p>
        <div className="confirm-actions">
          {state?.buttons.map((b, i) => (
            <button
              key={i}
              className={`${b.className || ''}${i === focusedIndex ? ' confirm-focused' : ''}`}
              onClick={() => onAction(b.action)}
              onMouseEnter={() => setFocusedIndex(i)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

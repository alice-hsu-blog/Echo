import { useCallback, useState } from 'react';

// Drives the in-page confirm/choice modal instead of window.confirm(), which
// some browsers let users permanently suppress — that would make delete
// buttons silently no-op.
export function useConfirm(t) {
  const [state, setState] = useState(null); // { message, buttons }

  const showChoice = useCallback((message, buttons) => {
    setState({ message, buttons });
  }, []);

  const showConfirm = useCallback(
    (message, onConfirm) => {
      showChoice(message, [
        { label: t('confirm.cancel'), className: 'secondary' },
        { label: t('confirm.ok'), action: onConfirm }
      ]);
    },
    [showChoice, t]
  );

  const runAndClose = useCallback((action) => {
    setState(null);
    if (action) action();
  }, []);

  const close = useCallback(() => setState(null), []);

  return { state, showChoice, showConfirm, runAndClose, close };
}

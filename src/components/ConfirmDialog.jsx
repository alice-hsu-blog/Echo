export default function ConfirmDialog({ state, onAction }) {
  return (
    <div className={`confirm-overlay ${state ? '' : 'hidden'}`}>
      <div className="confirm-box">
        <p>{state?.message}</p>
        <div className="confirm-actions">
          {state?.buttons.map((b, i) => (
            <button key={i} className={b.className || ''} onClick={() => onAction(b.action)}>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

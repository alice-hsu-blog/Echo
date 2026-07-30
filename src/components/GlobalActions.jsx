export default function GlobalActions({ allCollapsed, onToggleAll }) {
  return (
    <div className="global-actions">
      <button className="secondary small" onClick={onToggleAll}>
        {allCollapsed ? '展開全部' : '折疊全部'}
      </button>
    </div>
  );
}

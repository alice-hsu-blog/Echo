export default function GlobalActions({ onExpandAll, onCollapseAll }) {
  return (
    <div className="global-actions">
      <button className="secondary small" onClick={onExpandAll}>
        展開全部
      </button>
      <button className="secondary small" onClick={onCollapseAll}>
        折疊全部
      </button>
    </div>
  );
}

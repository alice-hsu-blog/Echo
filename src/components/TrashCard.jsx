// Read-only card for a quote sitting in the 垃圾桶 (trash). No editing,
// scenario management, or folder actions — just a restore/永久刪除 pair and
// a countdown to the automatic purge (see purgeExpiredTrash in lib/db.js).
export default function TrashCard({ quote, daysLeft, onRestore, onPermanentDelete }) {
  const totalPractices = quote.scenarios.reduce((s, sc) => s + sc.practices.length, 0);

  return (
    <div className="quote-card trash-card">
      <div className="quote-meta">
        <div>
          <p className="qtext quote-font">「{quote.text}」</p>
          <div className="quote-source">{quote.source || '出處未填'}</div>
          <div className="trash-warning">
            {daysLeft > 0 ? `${daysLeft} 天後將被系統自動永久刪除` : '即將被系統自動永久刪除'}
          </div>
        </div>
        <div className="quote-meta-right">
          <span className="count-badge">{totalPractices} 篇仿寫</span>
        </div>
      </div>

      <div className="card-actions trash-card-actions">
        <button className="small secondary" onClick={onRestore}>
          復原
        </button>
        <button className="small danger-btn" onClick={onPermanentDelete}>
          立即永久刪除
        </button>
      </div>
    </div>
  );
}

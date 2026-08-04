import { useAppContext } from '../context/AppContext.jsx';

// Read-only card for a quote sitting in the trash. No editing, scenario
// management, or folder actions — just a restore/permanent-delete pair and
// a countdown to the automatic purge (see purgeExpiredTrash in lib/db.js).
export default function TrashCard({ quote, daysLeft, onRestore, onPermanentDelete }) {
  const { t } = useAppContext();
  const totalPractices = quote.scenarios.reduce((s, sc) => s + sc.practices.length, 0);

  return (
    <div className="quote-card trash-card">
      <div className="quote-meta">
        <div>
          <p className="qtext quote-font">{quote.text}</p>
          <div className="quote-source">{quote.source || t('quoteCard.sourceUnfilled')}</div>
          <div className="trash-warning">
            {daysLeft > 0 ? t('trashCard.daysLeft', daysLeft) : t('trashCard.deletingSoon')}
          </div>
        </div>
        <div className="quote-meta-right">
          <span className="count-badge">{t('trashCard.practicesCount', totalPractices)}</span>
        </div>
      </div>

      <div className="card-actions trash-card-actions">
        <button className="small secondary" onClick={onRestore}>
          {t('trashCard.restore')}
        </button>
        <button className="small danger-btn" onClick={onPermanentDelete}>
          {t('trashCard.permanentDelete')}
        </button>
      </div>
    </div>
  );
}

import { useAppContext } from '../context/AppContext.jsx';
import { todayStr } from '../lib/db.js';

const parseDay = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// "最近仿寫" view: every practice, newest first, grouped under one header
// per day (see getRecentPractices in lib/filter.js). Each row shows the
// practice itself, its scenario, and the original quote it imitates;
// clicking a row calls `onOpenCard(quoteId)` (App opens that quote's
// single-card edit page and remembers this list's scroll position).
export default function RecentPractices({ groups, onOpenCard }) {
  const { t } = useAppContext();

  if (groups.length === 0) {
    return <div className="empty-state">{t('recentPractice.empty')}</div>;
  }

  const today = parseDay(todayStr());
  const relativeLabel = (date) => {
    const diff = Math.round((today - parseDay(date)) / 86400000);
    if (diff === 0) return t('recentPractice.today');
    if (diff === 1) return t('recentPractice.yesterday');
    if (diff > 1 && diff < 7) return t('recentPractice.daysAgo', diff);
    return '';
  };
  const dateLabel = (date) => {
    const d = parseDay(date);
    return t('recentPractice.date', d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getDay());
  };

  return groups.map((group) => (
    <section className="recent-date-group" key={group.date}>
      <div className="recent-date-header">
        <span className="recent-date">{dateLabel(group.date)}</span>
        <span className="recent-date-rel">{relativeLabel(group.date)}</span>
        <span className="count-badge recent-day-count">{t('recentPractice.dayCount', group.items.length)}</span>
      </div>
      {group.items.map(({ quote, scenario, practice }) => (
        <div key={practice.id} className="recent-card" onClick={() => onOpenCard(quote.id)}>
          <div className="recent-card-top">
            <span className="scenario-chip">{scenario.scenario}</span>
          </div>
          <p className="recent-practice quote-font">{practice.text}</p>
          <div className="recent-origin quote-font">
            <span className="recent-origin-label">{t('recentPractice.original')}</span>
            {quote.text}
            {quote.source && <span className="recent-origin-source">— {quote.source}</span>}
          </div>
        </div>
      ))}
    </section>
  ));
}

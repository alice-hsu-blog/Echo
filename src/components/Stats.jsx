import { useAppContext } from '../context/AppContext.jsx';

export default function Stats({ db }) {
  const { t } = useAppContext();
  const activeQuotes = db.quotes.filter((q) => !q.deletedAt);
  const totalPractices = activeQuotes.reduce(
    (sum, q) => sum + q.scenarios.reduce((s2, sc) => s2 + sc.practices.length, 0),
    0
  );
  return (
    <div className="stats">
      <div>{t('stats.quotes', activeQuotes.length)}</div>
      <div>{t('stats.practices', totalPractices)}</div>
    </div>
  );
}

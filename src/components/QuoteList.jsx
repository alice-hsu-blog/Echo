import QuoteCard from './QuoteCard.jsx';
import { useAppContext } from '../context/AppContext.jsx';

export default function QuoteList({
  visible,
  totalQuoteCount,
  term,
  cardCollapse,
  onToggleCollapse,
  emptyMessage,
  selectMode = false,
  selectedIds,
  onToggleSelect
}) {
  const { t } = useAppContext();
  if (totalQuoteCount === 0) {
    return <div className="empty-state">{emptyMessage ?? t('quoteList.emptyDefault')}</div>;
  }
  if (term && visible.length === 0) {
    return <div className="empty-state">{t('quoteList.noSearchResults', term)}</div>;
  }

  return (
    <div>
      {visible.map(({ quote, scenariosToShow }) => (
        <QuoteCard
          key={quote.id}
          quote={quote}
          scenariosToShow={scenariosToShow}
          term={term}
          collapsed={!!cardCollapse[quote.id]}
          onToggleCollapse={() => onToggleCollapse(quote.id)}
          selectMode={selectMode}
          selected={!!selectedIds?.has(quote.id)}
          onToggleSelect={() => onToggleSelect(quote.id)}
        />
      ))}
    </div>
  );
}

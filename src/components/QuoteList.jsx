import QuoteCard from './QuoteCard.jsx';

export default function QuoteList({
  visible,
  totalQuoteCount,
  term,
  cardCollapse,
  onToggleCollapse,
  emptyMessage = '還沒有收藏任何名言佳句，從上面「＋」開始吧。',
  selectMode = false,
  selectedIds,
  onToggleSelect
}) {
  if (totalQuoteCount === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }
  if (term && visible.length === 0) {
    return <div className="empty-state">找不到符合「{term}」的名言、情境或仿寫練習。</div>;
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

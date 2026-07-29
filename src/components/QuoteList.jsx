import QuoteCard from './QuoteCard.jsx';

export default function QuoteList({ visible, totalQuoteCount, term, cardCollapse, onToggleCollapse }) {
  if (totalQuoteCount === 0) {
    return <div className="empty-state">還沒有收藏任何名言佳句，從上面「新增名言佳句」開始吧。</div>;
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
        />
      ))}
    </div>
  );
}

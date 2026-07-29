export default function SearchBox({ term, onChange, hint }) {
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="搜尋情境、名言、出處或仿寫內容..."
        value={term}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="search-hint">{hint}</div>
    </div>
  );
}

import { useAppContext } from '../context/AppContext.jsx';

export default function SearchBox({ term, onChange, hint }) {
  const { t } = useAppContext();
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder={t('searchBox.placeholder')}
        value={term}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="search-hint">{hint}</div>
    </div>
  );
}

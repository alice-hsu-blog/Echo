import { forwardRef } from 'react';
import { useAppContext } from '../context/AppContext.jsx';

const SearchBox = forwardRef(function SearchBox({ term, onChange, hint }, ref) {
  const { t } = useAppContext();
  return (
    <div className="search-box">
      <input
        ref={ref}
        type="text"
        placeholder={t('searchBox.placeholder')}
        value={term}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <div className="search-hint">{hint}</div> : null}
    </div>
  );
});

export default SearchBox;

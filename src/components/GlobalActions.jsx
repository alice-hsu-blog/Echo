import { useAppContext } from '../context/AppContext.jsx';

export default function GlobalActions({ allCollapsed, onToggleAll }) {
  const { t } = useAppContext();
  return (
    <div className="global-actions">
      <button className="secondary" onClick={onToggleAll}>
        {allCollapsed ? t('globalActions.expandAll') : t('globalActions.collapseAll')}
      </button>
    </div>
  );
}

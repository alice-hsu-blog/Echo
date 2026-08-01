import GlobalActions from './GlobalActions.jsx';
import SearchBox from './SearchBox.jsx';
import BulkActionBar from './BulkActionBar.jsx';
import { useAppContext } from '../context/AppContext.jsx';

export default function ContentTopbar({
  title,
  scrolled = false,
  allCollapsed,
  onToggleAll,
  onAddClick,
  searchTerm,
  onSearchChange,
  searchHint,
  selectMode,
  onToggleSelectMode,
  selectedCount,
  folders,
  onSelectAllVisible,
  onBulkMove,
  onBulkDelete,
  trashMode = false,
  onEmptyTrash
}) {
  const { t } = useAppContext();
  return (
    <div className={`content-topbar${scrolled ? ' scrolled' : ''}`}>
      <div className="content-topbar-inner">
        <h2 className="content-title quote-font">{title}</h2>
        <div className="content-topbar-actions">
          {trashMode ? (
            <button className="small danger-btn" onClick={onEmptyTrash}>
              {t('contentTopbar.emptyTrash')}
            </button>
          ) : selectMode ? (
            <BulkActionBar
              selectedCount={selectedCount}
              folders={folders}
              onSelectAll={onSelectAllVisible}
              onMove={onBulkMove}
              onDelete={onBulkDelete}
              onCancel={onToggleSelectMode}
            />
          ) : (
            <>
              <GlobalActions allCollapsed={allCollapsed} onToggleAll={onToggleAll} />
              <SearchBox term={searchTerm} onChange={onSearchChange} hint={searchHint} />
              <button className="icon-btn" onClick={onToggleSelectMode} title={t('contentTopbar.multiSelect')}>
                ☑
              </button>
              <button className="icon-btn add-btn" onClick={onAddClick} title={t('contentTopbar.addQuote')}>
                ＋
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

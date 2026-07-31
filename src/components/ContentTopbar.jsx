import GlobalActions from './GlobalActions.jsx';
import SearchBox from './SearchBox.jsx';
import BulkActionBar from './BulkActionBar.jsx';

export default function ContentTopbar({
  title,
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
  return (
    <div className="content-topbar">
      <h2 className="content-title quote-font">{title}</h2>
      <div className="content-topbar-actions">
        {trashMode ? (
          <button className="small danger-btn" onClick={onEmptyTrash}>
            清空垃圾桶
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
            <button className="icon-btn" onClick={onToggleSelectMode} title="多選">
              ☑
            </button>
            <button className="icon-btn add-btn" onClick={onAddClick} title="新增名言">
              ＋
            </button>
          </>
        )}
      </div>
    </div>
  );
}

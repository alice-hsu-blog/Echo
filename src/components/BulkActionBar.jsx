import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';

// Shown in ContentTopbar in place of the normal actions row while multi-select
// is active. Reuses the same menu-dropdown/menu-folder-btn styling as
// ItemMenu's folder picker, just triggered from a plain button instead of a
// per-card gear icon.
export default function BulkActionBar({ selectedCount, folders, onSelectAll, onMove, onDelete, onCancel }) {
  const { t } = useAppContext();
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!showFolderPicker) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShowFolderPicker(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showFolderPicker]);

  const disabled = selectedCount === 0;

  return (
    <div className="bulk-action-bar">
      <span className="bulk-count">{t('bulkAction.selectedCount', selectedCount)}</span>
      <button className="small secondary" onClick={onSelectAll}>
        {t('bulkAction.selectAll')}
      </button>
      <div className="item-menu" ref={ref}>
        <button
          className="small secondary"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            setShowFolderPicker((o) => !o);
          }}
        >
          {t('bulkAction.moveToFolder')}
        </button>
        <div className={`menu-dropdown ${showFolderPicker ? '' : 'hidden'}`}>
          <button
            className="menu-folder-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowFolderPicker(false);
              onMove(null);
            }}
          >
            {t('bulkAction.uncategorized')}
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              className="menu-folder-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowFolderPicker(false);
                onMove(f.id);
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>
      <button className="small danger-btn" disabled={disabled} onClick={onDelete}>
        {t('bulkAction.delete')}
      </button>
      <button className="small secondary" onClick={onCancel}>
        {t('bulkAction.cancel')}
      </button>
    </div>
  );
}

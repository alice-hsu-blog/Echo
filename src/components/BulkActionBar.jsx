import { useEffect, useRef, useState } from 'react';

// Shown in ContentTopbar in place of the normal actions row while multi-select
// is active. Reuses the same menu-dropdown/menu-folder-btn styling as
// ItemMenu's folder picker, just triggered from a plain button instead of a
// per-card gear icon.
export default function BulkActionBar({ selectedCount, folders, onSelectAll, onMove, onDelete, onCancel }) {
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
      <span className="bulk-count">已選 {selectedCount} 則</span>
      <button className="small secondary" onClick={onSelectAll}>
        全選
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
          移至資料夾
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
            不分類
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
        刪除
      </button>
      <button className="small secondary" onClick={onCancel}>
        取消
      </button>
    </div>
  );
}

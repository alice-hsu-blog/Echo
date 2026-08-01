import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';

// Gear-icon dropdown shared by quote / scenario / practice rows. When
// `folderMenu` ({ folders, currentFolderId, onMove }) is passed, an extra
// "move to folder" row is available that swaps the dropdown's contents to a
// folder picker in place (no real submenu, just a second panel of the same
// dropdown) — used only by QuoteCard today.
export default function ItemMenu({ onEdit, onDelete, folderMenu }) {
  const { t } = useAppContext();
  const [open, setOpen] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowFolderPicker(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  const close = () => {
    setOpen(false);
    setShowFolderPicker(false);
  };

  return (
    <div className="item-menu" ref={ref}>
      <button
        className="menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
          setShowFolderPicker(false);
        }}
      >
        ⚙
      </button>
      <div className={`menu-dropdown ${open ? '' : 'hidden'}`}>
        {showFolderPicker ? (
          <>
            <button
              className={`menu-folder-btn${folderMenu.currentFolderId == null ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                close();
                folderMenu.onMove(null);
              }}
            >
              {t('itemMenu.uncategorized')}
            </button>
            {folderMenu.folders.map((f) => (
              <button
                key={f.id}
                className={`menu-folder-btn${folderMenu.currentFolderId === f.id ? ' active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  folderMenu.onMove(f.id);
                }}
              >
                {f.name}
              </button>
            ))}
          </>
        ) : (
          <>
            {onEdit && (
              <button
                className="menu-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  onEdit();
                }}
              >
                {t('itemMenu.edit')}
              </button>
            )}
            {folderMenu && (
              <button
                className="menu-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFolderPicker(true);
                }}
              >
                {t('itemMenu.moveToFolder')}
              </button>
            )}
            <button
              className="menu-delete-btn danger-item"
              onClick={(e) => {
                e.stopPropagation();
                close();
                onDelete();
              }}
            >
              {t('itemMenu.delete')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

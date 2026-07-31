import { useEffect, useRef, useState } from 'react';
import ItemMenu from './ItemMenu.jsx';
import Stats from './Stats.jsx';
import Toolbar from './Toolbar.jsx';
import { addFolder, deleteFolder, deleteQuote, moveQuoteToFolder, renameFolder } from '../lib/actions.js';

// Sentinel used in dragOverFolderId to mark "hovering the trash row" —
// distinct from any real folder id (uid()) or the pinned 未分類 folder's `null`.
const TRASH_DROP_ID = '__trash__';

export default function Sidebar({ db, commit, toast, showConfirm, showChoice, view, onSelectAll, onSelectScenarios, onSelectFolder, onSelectTrash }) {
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState('');
  // `undefined` means "not hovering any folder" — kept distinct from `null`,
  // which is a real, meaningful folderId (the pinned 未分類 folder), so the
  // pinned row doesn't render as drag-over by default.
  const [dragOverFolderId, setDragOverFolderId] = useState(undefined);
  const composingRef = useRef(false);
  // dragenter/dragleave fire on every child boundary crossing inside a
  // folder row (like mouseover/mouseout), and can land in separate render
  // passes rather than the same batch — especially in WKWebView — so
  // clearing on dragleave directly causes a visible flicker. Instead treat
  // dragover (which fires continuously while hovering, including bubbling
  // from children) as "still here", and only clear after a brief delay
  // with no dragover, canceling that delay if one arrives in time.
  const dragClearTimersRef = useRef({});

  useEffect(() => {
    const timers = dragClearTimersRef.current;
    const resetDrag = () => {
      Object.values(timers).forEach(clearTimeout);
      dragClearTimersRef.current = {};
      setDragOverFolderId(undefined);
    };
    document.addEventListener('dragend', resetDrag);
    return () => document.removeEventListener('dragend', resetDrag);
  }, []);

  const handleFolderDrop = (e, folderId) => {
    e.preventDefault();
    if (dragClearTimersRef.current[folderId]) {
      clearTimeout(dragClearTimersRef.current[folderId]);
      delete dragClearTimersRef.current[folderId];
    }
    setDragOverFolderId(undefined);
    const qid = e.dataTransfer.getData('text/plain');
    if (!qid) return;
    commit(moveQuoteToFolder(db, qid, folderId));
    toast(folderId === null ? '已移至「未分類」' : '已移至資料夾');
  };

  const handleTrashDrop = (e) => {
    e.preventDefault();
    if (dragClearTimersRef.current[TRASH_DROP_ID]) {
      clearTimeout(dragClearTimersRef.current[TRASH_DROP_ID]);
      delete dragClearTimersRef.current[TRASH_DROP_ID];
    }
    setDragOverFolderId(undefined);
    const qid = e.dataTransfer.getData('text/plain');
    if (!qid) return;
    commit(deleteQuote(db, qid));
    toast('已移至垃圾桶');
  };

  const folderCount = (fid) => db.quotes.filter((q) => !q.deletedAt && (q.folderId ?? null) === fid).length;
  const trashCount = db.quotes.filter((q) => q.deletedAt).length;

  const handleCreateSubmit = () => {
    const name = newFolderName.trim();
    setCreating(false);
    setNewFolderName('');
    if (!name) return;
    commit(addFolder(db, name));
  };

  const handleCreateKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      handleCreateSubmit();
    } else if (e.key === 'Escape') {
      setCreating(false);
      setNewFolderName('');
    }
  };

  const startRename = (folder) => {
    setRenamingId(folder.id);
    setRenameText(folder.name);
  };

  const handleRenameSubmit = () => {
    const name = renameText.trim();
    const fid = renamingId;
    setRenamingId(null);
    if (!fid || !name) return;
    commit(renameFolder(db, fid, name));
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setRenamingId(null);
    }
  };

  const handleDeleteFolder = (folder) => {
    const count = folderCount(folder.id);
    const msg =
      count > 0
        ? `這個資料夾裡有 ${count} 則名言，刪除資料夾後它們會變成未分類（不會被刪除），確定要刪除嗎？`
        : `確定要刪除「${folder.name}」這個資料夾嗎？`;
    showConfirm(msg, () => {
      commit(deleteFolder(db, folder.id));
      if (view.type === 'folder' && view.id === folder.id) onSelectAll();
      toast('已刪除資料夾');
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand quote-font">Echo</div>

      <div className="sidebar-top">
        <button className={`sidebar-item${view.type === 'all' ? ' active' : ''}`} onClick={onSelectAll}>
          所有句子
        </button>
        <button className={`sidebar-item${view.type === 'scenarios' ? ' active' : ''}`} onClick={onSelectScenarios}>
          所有情境
        </button>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section-header">
        <span>資料夾</span>
        <button
          className="icon-btn"
          onClick={() => {
            setCreating(true);
            setNewFolderName('');
          }}
          title="新增資料夾"
        >
          ＋
        </button>
      </div>

      <div className="sidebar-folders">
        <div
          className={`sidebar-folder-item pinned${view.type === 'folder' && view.id === null ? ' active' : ''}${dragOverFolderId === null ? ' drag-over' : ''}`}
          onClick={() => onSelectFolder(null)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dragClearTimersRef.current[null]) {
              clearTimeout(dragClearTimersRef.current[null]);
              delete dragClearTimersRef.current[null];
            }
            setDragOverFolderId((id) => (id === null ? id : null));
          }}
          onDragEnter={(e) => {
            e.preventDefault();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            dragClearTimersRef.current[null] = setTimeout(() => {
              delete dragClearTimersRef.current[null];
              setDragOverFolderId((id) => (id === null ? undefined : id));
            }, 60);
          }}
          onDrop={(e) => handleFolderDrop(e, null)}
        >
          <span className="folder-name">未分類</span>
          <span className="item-menu-spacer" aria-hidden="true" />
          <span className="folder-count">{folderCount(null)}</span>
        </div>
        {db.folders.map((f) =>
          renamingId === f.id ? (
            <input
              key={f.id}
              type="text"
              className="sidebar-folder-input"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onCompositionStart={() => {
                composingRef.current = true;
              }}
              onCompositionEnd={() => {
                composingRef.current = false;
              }}
              onBlur={handleRenameSubmit}
              autoFocus
            />
          ) : (
            <div
              key={f.id}
              className={`sidebar-folder-item${view.type === 'folder' && view.id === f.id ? ' active' : ''}${dragOverFolderId === f.id ? ' drag-over' : ''}`}
              onClick={() => onSelectFolder(f.id)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragClearTimersRef.current[f.id]) {
                  clearTimeout(dragClearTimersRef.current[f.id]);
                  delete dragClearTimersRef.current[f.id];
                }
                setDragOverFolderId((id) => (id === f.id ? id : f.id));
              }}
              onDragEnter={(e) => {
                e.preventDefault();
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                dragClearTimersRef.current[f.id] = setTimeout(() => {
                  delete dragClearTimersRef.current[f.id];
                  setDragOverFolderId((id) => (id === f.id ? undefined : id));
                }, 60);
              }}
              onDrop={(e) => handleFolderDrop(e, f.id)}
            >
              <span className="folder-name">{f.name}</span>
              <ItemMenu onEdit={() => startRename(f)} onDelete={() => handleDeleteFolder(f)} />
              <span className="folder-count">{folderCount(f.id)}</span>
            </div>
          )
        )}
        {creating && (
          <input
            type="text"
            className="sidebar-folder-input"
            placeholder="資料夾名稱"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={handleCreateKeyDown}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={() => {
              composingRef.current = false;
            }}
            onBlur={handleCreateSubmit}
            autoFocus
          />
        )}
        {db.folders.length === 0 && !creating && (
          <div className="sidebar-empty-hint">還沒有資料夾，點上面「＋」新增一個吧。</div>
        )}
      </div>

      <div className="sidebar-trash">
        <div
          className={`sidebar-folder-item pinned${view.type === 'trash' ? ' active' : ''}${dragOverFolderId === TRASH_DROP_ID ? ' drag-over' : ''}`}
          onClick={onSelectTrash}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dragClearTimersRef.current[TRASH_DROP_ID]) {
              clearTimeout(dragClearTimersRef.current[TRASH_DROP_ID]);
              delete dragClearTimersRef.current[TRASH_DROP_ID];
            }
            setDragOverFolderId((id) => (id === TRASH_DROP_ID ? id : TRASH_DROP_ID));
          }}
          onDragEnter={(e) => {
            e.preventDefault();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            dragClearTimersRef.current[TRASH_DROP_ID] = setTimeout(() => {
              delete dragClearTimersRef.current[TRASH_DROP_ID];
              setDragOverFolderId((id) => (id === TRASH_DROP_ID ? undefined : id));
            }, 60);
          }}
          onDrop={handleTrashDrop}
        >
          <span className="folder-name">🗑 垃圾桶</span>
          <span className="item-menu-spacer" aria-hidden="true" />
          <span className="folder-count">{trashCount}</span>
        </div>
      </div>

      <div className="sidebar-footer">
        <Stats db={db} />
        <Toolbar db={db} commit={commit} toast={toast} showChoice={showChoice} />
      </div>
    </aside>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from './context/AppContext.jsx';
import { useDb } from './hooks/useDb.js';
import { useTheme } from './hooks/useTheme.js';
import { useMenuBackup } from './hooks/useMenuBackup.js';
import { useSidebarWidth } from './hooks/useSidebarWidth.js';
import { useToast } from './hooks/useToast.js';
import { useConfirm } from './hooks/useConfirm.js';
import { getVisibleQuotes, getQuotesByScenarioTags, getQuoteEntry, getTrashedQuotes, getUnpracticedQuotes } from './lib/filter.js';
import { moveQuotesToFolder, deleteQuotes, restoreQuote, permanentlyDeleteQuote, permanentlyDeleteQuotes } from './lib/actions.js';
import { daysUntilPurge, TRASH_RETENTION_DAYS } from './lib/db.js';

import Sidebar from './components/Sidebar.jsx';
import TitleBar from './components/TitleBar.jsx';
import ContentTopbar from './components/ContentTopbar.jsx';
import AddQuoteForm from './components/AddQuoteForm.jsx';
import QuoteCard from './components/QuoteCard.jsx';
import QuoteList from './components/QuoteList.jsx';
import TrashCard from './components/TrashCard.jsx';
import ScenarioTagCloud from './components/ScenarioTagCloud.jsx';
import Toast from './components/Toast.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';

export default function App() {
  const { db, commit, ready } = useDb();
  useTheme();
  const { width: sidebarWidth, collapsed: sidebarCollapsed, dragging: sidebarDragging, startResize: startSidebarResize, toggleCollapsed: toggleSidebarCollapsed } = useSidebarWidth();
  const { message: toastMessage, visible: toastVisible, toast } = useToast();
  const { state: confirmState, showChoice, showConfirm, runAndClose } = useConfirm();
  useMenuBackup(db, commit, toast, showChoice);

  const [view, setView] = useState({ type: 'all' }); // { type: 'all' } | { type: 'scenarios' } | { type: 'folder', id }
  const [cardCollapse, setCardCollapse] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState([]);
  const [scenarioMatchMode, setScenarioMatchMode] = useState('any');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editCardId, setEditCardId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [scrolled, setScrolled] = useState(false);
  const mainContentRef = useRef(null);

  const handleMainScroll = (e) => setScrolled(e.currentTarget.scrollTop > 0);

  const resetScroll = () => {
    if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    setScrolled(false);
  };

  const term = searchTerm.trim().toLowerCase();

  const isUncategorizedView = view.type === 'folder' && view.id === null;
  const currentFolder =
    view.type === 'folder' && view.id !== null ? db.folders.find((f) => f.id === view.id) : null;
  const folderIdForFilter = view.type === 'folder' ? view.id : undefined;

  const globalSearchVisible = useMemo(() => getVisibleQuotes(db, term), [db, term]);
  const scopedVisible = useMemo(
    () => getVisibleQuotes(db, '', folderIdForFilter),
    [db, folderIdForFilter]
  );
  const visible = term ? globalSearchVisible : scopedVisible;

  const scenarioVisible = useMemo(
    () => getQuotesByScenarioTags(db, scenarioFilter, scenarioMatchMode),
    [db, scenarioFilter, scenarioMatchMode]
  );

  const trashedQuotes = useMemo(() => getTrashedQuotes(db), [db]);

  const unpracticedVisible = useMemo(() => getUnpracticedQuotes(db), [db]);

  const editCardEntry = useMemo(
    () => (editCardId ? getQuoteEntry(db, editCardId) : null),
    [db, editCardId]
  );

  const toggleCollapse = (qid) => {
    setCardCollapse((prev) => ({ ...prev, [qid]: !prev[qid] }));
  };

  const allCollapsed = db.quotes.length > 0 && db.quotes.every((q) => cardCollapse[q.id]);

  const toggleAll = () => {
    const next = {};
    db.quotes.forEach((q) => {
      next[q.id] = !allCollapsed;
    });
    setCardCollapse(next);
  };

  const ctxValue = {
    db,
    commit,
    toast,
    showConfirm,
    setSearchTerm,
    onEditCard: setEditCardId
  };

  const handleToggleScenarioTag = (name) => {
    setScenarioFilter((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const closeAddForm = () => {
    setShowAddForm(false);
    setEditCardId(null);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelectMode = () => {
    if (selectMode) exitSelectMode();
    else setSelectMode(true);
  };

  const toggleSelectId = (qid) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  };

  const selectAllVisible = (ids) => setSelectedIds(new Set(ids));

  const handleBulkMove = (folderId) => {
    if (selectedIds.size === 0) return;
    commit(moveQuotesToFolder(db, [...selectedIds], folderId));
    toast(folderId ? '已移至資料夾' : '已移至「未分類」');
    exitSelectMode();
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    showConfirm(`確定要刪除選取的 ${count} 則名言嗎？（包含底下所有情境與仿寫練習）`, () => {
      commit(deleteQuotes(db, [...selectedIds]));
      toast('已刪除選取的名言');
      exitSelectMode();
    });
  };

  const selectAll = () => {
    setView({ type: 'all' });
    closeAddForm();
    exitSelectMode();
    resetScroll();
  };
  const selectScenarios = () => {
    setView({ type: 'scenarios' });
    closeAddForm();
    exitSelectMode();
    resetScroll();
  };
  const selectUnpracticed = () => {
    setView({ type: 'unpracticed' });
    closeAddForm();
    exitSelectMode();
    resetScroll();
  };
  const selectFolder = (id) => {
    setView({ type: 'folder', id });
    closeAddForm();
    exitSelectMode();
    resetScroll();
  };
  const selectTrash = () => {
    setView({ type: 'trash' });
    closeAddForm();
    exitSelectMode();
    resetScroll();
  };

  const handleRestoreQuote = (qid) => {
    commit(restoreQuote(db, qid));
    toast('已復原');
  };

  const handlePermanentDeleteQuote = (qid) => {
    showConfirm('確定要永久刪除這則名言嗎？此操作無法復原。', () => {
      commit(permanentlyDeleteQuote(db, qid));
      toast('已永久刪除');
    });
  };

  const handleEmptyTrash = () => {
    if (trashedQuotes.length === 0) return;
    showConfirm(`確定要清空垃圾桶嗎？將永久刪除 ${trashedQuotes.length} 則名言，此操作無法復原。`, () => {
      commit(permanentlyDeleteQuotes(db, trashedQuotes.map((q) => q.id)));
      toast('已清空垃圾桶');
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isTyping =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'Escape') {
        if (editCardId) {
          setEditCardId(null);
        } else if (showAddForm) {
          closeAddForm();
        }
        return;
      }

      // Cmd+[ (Mac) / Ctrl+[ (Windows/Linux) — 返回，僅在編輯卡片／新增名言頁面生效
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        if (editCardId) {
          e.preventDefault();
          setEditCardId(null);
        } else if (showAddForm) {
          e.preventDefault();
          closeAddForm();
        }
        return;
      }

      const isPlusKey = e.key === '+' || e.key === 'Add' || (e.shiftKey && e.key === '=');
      if (isPlusKey && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setEditCardId(null);
        setShowAddForm(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editCardId, showAddForm]);

  const newQuoteFolderId = view.type === 'folder' ? view.id : null;

  let title = '所有句子';
  if (view.type === 'folder') {
    title = isUncategorizedView ? '未分類' : currentFolder ? currentFolder.name : '所有句子';
  }
  if (view.type === 'scenarios') title = '所有情境';
  if (view.type === 'unpracticed') title = '尚未仿寫';
  if (view.type === 'trash') title = '垃圾桶';
  if (term) title = '搜尋結果';

  const emptyMessage =
    view.type === 'folder'
      ? `這個資料夾還沒有任何名言，點上面「＋」新增一則吧。`
      : undefined;

  const activeVisibleList = term
    ? globalSearchVisible
    : view.type === 'scenarios'
    ? scenarioVisible
    : view.type === 'unpracticed'
    ? unpracticedVisible
    : visible;
  const activeVisibleIds = activeVisibleList.map(({ quote }) => quote.id);

  if (!ready) return null;

  return (
    <AppContext.Provider value={ctxValue}>
      <div className="app-root">
        <TitleBar onToggleSidebar={toggleSidebarCollapsed} />
        <div className="app-shell">
          <div
            className={`sidebar-container${sidebarCollapsed ? ' collapsed' : ''}${sidebarDragging ? ' dragging' : ''}`}
            style={{ width: sidebarCollapsed ? 6 : sidebarWidth }}
          >
            <Sidebar
              db={db}
              commit={commit}
              toast={toast}
              showConfirm={showConfirm}
              view={view}
              onSelectAll={selectAll}
              onSelectScenarios={selectScenarios}
              onSelectUnpracticed={selectUnpracticed}
              onSelectFolder={selectFolder}
              onSelectTrash={selectTrash}
            />
            <div
              className="sidebar-resize-handle"
              onMouseDown={startSidebarResize}
              onClick={() => sidebarCollapsed && toggleSidebarCollapsed()}
            />
          </div>

          <main className="main-content" ref={mainContentRef} onScroll={handleMainScroll}>
            {editCardId && editCardEntry ? (
              <div className={`content-topbar add-quote-topbar${scrolled ? ' scrolled' : ''}`}>
                <div className="content-topbar-inner">
                  <button
                    className="icon-btn back-btn"
                    onClick={() => setEditCardId(null)}
                    title="返回"
                  >
                    ←
                  </button>
                  <h2 className="content-title quote-font">編輯卡片</h2>
                  <div className="empty-state edit-card-hint">
                    點擊文字上方即可修改，點擊旁邊或按「Enter」即可儲存
                  </div>
                  <div className="content-topbar-actions">
                    <button
                      className="icon-btn add-btn"
                      onClick={() => {
                        setEditCardId(null);
                        setShowAddForm(true);
                      }}
                      title="新增名言"
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </div>
            ) : showAddForm ? (
              <div className={`content-topbar add-quote-topbar${scrolled ? ' scrolled' : ''}`}>
                <div className="content-topbar-inner">
                  <button className="icon-btn back-btn" onClick={closeAddForm} title="返回">
                    ←
                  </button>
                  <h2 className="content-title quote-font">新增名言佳句</h2>
                </div>
              </div>
            ) : (
              <ContentTopbar
                title={title}
                scrolled={scrolled}
                allCollapsed={allCollapsed}
                onToggleAll={toggleAll}
                onAddClick={() => setShowAddForm(true)}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchHint={term ? `找到 ${globalSearchVisible.length} 則相關名言` : ''}
                selectMode={selectMode}
                onToggleSelectMode={toggleSelectMode}
                selectedCount={selectedIds.size}
                folders={db.folders}
                onSelectAllVisible={() => selectAllVisible(activeVisibleIds)}
                onBulkMove={handleBulkMove}
                onBulkDelete={handleBulkDelete}
                trashMode={view.type === 'trash'}
                onEmptyTrash={handleEmptyTrash}
              />
            )}
            <div className="main-content-inner">
              {editCardId && editCardEntry ? (
                <div className="add-quote-page">
                  <QuoteCard
                    quote={editCardEntry.quote}
                    scenariosToShow={editCardEntry.scenariosToShow}
                    term=""
                    collapsed={false}
                    onToggleCollapse={() => {}}
                    editable
                  />
                </div>
              ) : showAddForm ? (
                <div className="add-quote-page">
                  <AddQuoteForm
                    db={db}
                    commit={commit}
                    toast={toast}
                    folderId={newQuoteFolderId}
                    onCreated={(qid) => {
                      setShowAddForm(false);
                      setEditCardId(qid);
                    }}
                  />
                </div>
              ) : (
                <>
                  {view.type === 'trash' ? (
                    <>
                      <div className="trash-banner">
                        垃圾桶中的名言會保留 {TRASH_RETENTION_DAYS} 天，之後系統會自動永久刪除，也可以手動立即刪除。
                      </div>
                      {trashedQuotes.length === 0 ? (
                        <div className="empty-state">垃圾桶是空的。</div>
                      ) : (
                        trashedQuotes.map((q) => (
                          <TrashCard
                            key={q.id}
                            quote={q}
                            daysLeft={daysUntilPurge(q.deletedAt)}
                            onRestore={() => handleRestoreQuote(q.id)}
                            onPermanentDelete={() => handlePermanentDeleteQuote(q.id)}
                          />
                        ))
                      )}
                    </>
                  ) : term ? (
                    <QuoteList
                      visible={visible}
                      totalQuoteCount={db.quotes.length}
                      term={term}
                      cardCollapse={cardCollapse}
                      onToggleCollapse={toggleCollapse}
                      selectMode={selectMode}
                      selectedIds={selectedIds}
                      onToggleSelect={toggleSelectId}
                    />
                  ) : view.type === 'scenarios' ? (
                    <>
                      <ScenarioTagCloud
                        db={db}
                        selectedTags={scenarioFilter}
                        onToggleTag={handleToggleScenarioTag}
                        matchMode={scenarioMatchMode}
                        onChangeMatchMode={setScenarioMatchMode}
                        onClearFilter={() => setScenarioFilter([])}
                      />
                      {scenarioFilter.length > 0 && (
                        <>
                          {scenarioVisible.length === 0 ? (
                            <div className="empty-state">找不到符合所選情境標籤的名言。</div>
                          ) : (
                            <QuoteList
                              visible={scenarioVisible}
                              totalQuoteCount={db.quotes.length}
                              term=""
                              cardCollapse={cardCollapse}
                              onToggleCollapse={toggleCollapse}
                              selectMode={selectMode}
                              selectedIds={selectedIds}
                              onToggleSelect={toggleSelectId}
                            />
                          )}
                        </>
                      )}
                    </>
                  ) : view.type === 'unpracticed' ? (
                    unpracticedVisible.length === 0 ? (
                      <div className="empty-state">目前每一則名言都已經有仿寫練習了。</div>
                    ) : (
                      <QuoteList
                        visible={unpracticedVisible}
                        totalQuoteCount={db.quotes.length}
                        term=""
                        cardCollapse={cardCollapse}
                        onToggleCollapse={toggleCollapse}
                        selectMode={selectMode}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelectId}
                      />
                    )
                  ) : (
                    <QuoteList
                      visible={visible}
                      totalQuoteCount={view.type === 'folder' ? visible.length : db.quotes.length}
                      term=""
                      cardCollapse={cardCollapse}
                      onToggleCollapse={toggleCollapse}
                      emptyMessage={emptyMessage}
                      selectMode={selectMode}
                      selectedIds={selectedIds}
                      onToggleSelect={toggleSelectId}
                    />
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <Toast message={toastMessage} visible={toastVisible} />
      <ConfirmDialog state={confirmState} onAction={runAndClose} />
    </AppContext.Provider>
  );
}

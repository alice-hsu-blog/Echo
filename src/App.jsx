import { useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from './context/AppContext.jsx';
import { useDb } from './hooks/useDb.js';
import { useTheme } from './hooks/useTheme.js';
import { useLanguage } from './hooks/useLanguage.js';
import { useMenuBackup } from './hooks/useMenuBackup.js';
import { useSidebarWidth } from './hooks/useSidebarWidth.js';
import { useToast } from './hooks/useToast.js';
import { useConfirm } from './hooks/useConfirm.js';
import { getVisibleQuotes, getQuotesByScenarioTags, getQuoteEntry, getTrashedQuotes } from './lib/filter.js';
import { moveQuotesToFolder, deleteQuotes, restoreQuote, permanentlyDeleteQuote, permanentlyDeleteQuotes } from './lib/actions.js';
import { daysUntilPurge, TRASH_RETENTION_DAYS } from './lib/db.js';
import { drawRandomPracticeQuote, drawRandomPracticePrompt } from './lib/practice.js';

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
  const { language, t } = useLanguage();
  const { width: sidebarWidth, collapsed: sidebarCollapsed, dragging: sidebarDragging, startResize: startSidebarResize, toggleCollapsed: toggleSidebarCollapsed } = useSidebarWidth();
  const { message: toastMessage, visible: toastVisible, toast } = useToast();
  const { state: confirmState, showChoice, showConfirm, runAndClose } = useConfirm(t);
  useMenuBackup(db, commit, toast, showChoice, t, language);

  const [view, setView] = useState({ type: 'all' }); // { type: 'all' } | { type: 'scenarios' } | { type: 'folder', id }
  const [cardCollapse, setCardCollapse] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState([]);
  const [scenarioMatchMode, setScenarioMatchMode] = useState('any');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editCardId, setEditCardId] = useState(null);
  const [practicePrompt, setPracticePrompt] = useState(null);
  const [randomPracticeMode, setRandomPracticeMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [scrolled, setScrolled] = useState(false);
  const mainContentRef = useRef(null);
  const searchInputRef = useRef(null);

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

  const editCardEntry = useMemo(
    () => (editCardId ? getQuoteEntry(db, editCardId) : null),
    [db, editCardId]
  );

  useEffect(() => {
    setPracticePrompt(null);
  }, [editCardId]);

  const showPracticePrompt = () => {
    setPracticePrompt((prev) => drawRandomPracticePrompt(prev, language));
  };

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
    onEditCard: setEditCardId,
    t
  };

  const handleToggleScenarioTag = (name) => {
    setScenarioFilter((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const closeAddForm = () => {
    setShowAddForm(false);
    setEditCardId(null);
    setRandomPracticeMode(false);
  };

  const exitRandomPractice = () => {
    setRandomPracticeMode(false);
    setEditCardId(null);
    setView({ type: 'all' });
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
    toast(folderId ? t('toast.movedToFolder') : t('toast.movedToUncategorized'));
    exitSelectMode();
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    showConfirm(t('app.bulkDeleteConfirm', count), () => {
      commit(deleteQuotes(db, [...selectedIds]));
      toast(t('toast.deletedSelected'));
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
  const selectRandomPractice = () => {
    closeAddForm();
    exitSelectMode();
    setView({ type: 'randomPractice' });
    setRandomPracticeMode(true);
    setEditCardId(drawRandomPracticeQuote(db)?.id ?? null);
    resetScroll();
  };

  const nextPracticeCard = () => {
    setEditCardId(drawRandomPracticeQuote(db, editCardId)?.id ?? null);
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

  const handleQuoteTrashed = (qid) => {
    if (editCardId === qid) {
      setEditCardId(null);
      setRandomPracticeMode(false);
      setView({ type: 'all' });
    }
  };

  const handleRestoreQuote = (qid) => {
    commit(restoreQuote(db, qid));
    toast(t('toast.restored'));
  };

  const handlePermanentDeleteQuote = (qid) => {
    showConfirm(t('app.permanentDeleteConfirm'), () => {
      commit(permanentlyDeleteQuote(db, qid));
      toast(t('toast.permanentlyDeleted'));
    });
  };

  const handleEmptyTrash = () => {
    if (trashedQuotes.length === 0) return;
    showConfirm(t('app.emptyTrashConfirm', trashedQuotes.length), () => {
      commit(permanentlyDeleteQuotes(db, trashedQuotes.map((q) => q.id)));
      toast(t('toast.trashEmptied'));
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isTyping =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'Escape') {
        if (randomPracticeMode) {
          exitRandomPractice();
        } else if (editCardId) {
          setEditCardId(null);
        } else if (showAddForm) {
          closeAddForm();
        } else if (selectMode) {
          exitSelectMode();
        }
        return;
      }

      // Cmd+[ (Mac) / Ctrl+[ (Windows/Linux) — 返回，僅在編輯卡片／新增名言／隨機練習頁面生效
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        if (randomPracticeMode) {
          e.preventDefault();
          exitRandomPractice();
        } else if (editCardId) {
          e.preventDefault();
          setEditCardId(null);
        } else if (showAddForm) {
          e.preventDefault();
          closeAddForm();
        }
        return;
      }

      // Cmd+F (Mac) / Ctrl+F (Windows/Linux) — 跳到搜尋欄
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        if (!searchInputRef.current) return;
        e.preventDefault();
        if (randomPracticeMode) exitRandomPractice();
        if (editCardId) setEditCardId(null);
        if (showAddForm) closeAddForm();
        if (selectMode) exitSelectMode();
        searchInputRef.current.focus();
        searchInputRef.current.select();
        return;
      }

      // Delete/Backspace — 多選模式下有已選取的卡片時，跳出刪除確認視窗
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping && selectMode && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkDelete();
        return;
      }

      const isPlusKey = e.key === '+' || e.key === 'Add' || (e.shiftKey && e.key === '=');
      if (isPlusKey && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setRandomPracticeMode(false);
        setEditCardId(null);
        setShowAddForm(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editCardId, showAddForm, selectMode, selectedIds, randomPracticeMode]);

  const newQuoteFolderId = view.type === 'folder' ? view.id : null;

  let title = t('app.titleAllQuotes');
  if (view.type === 'folder') {
    title = isUncategorizedView ? t('app.titleUncategorized') : currentFolder ? currentFolder.name : t('app.titleAllQuotes');
  }
  if (view.type === 'scenarios') title = t('app.titleAllScenarios');
  if (view.type === 'trash') title = t('app.titleTrash');
  if (term) title = t('app.titleSearchResults');

  const emptyMessage =
    view.type === 'folder'
      ? t('app.folderEmptyMessage')
      : undefined;

  const activeVisibleList = term
    ? globalSearchVisible
    : view.type === 'scenarios'
    ? scenarioVisible
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
              onSelectRandomPractice={selectRandomPractice}
              onSelectFolder={selectFolder}
              onSelectTrash={selectTrash}
              onQuoteTrashed={handleQuoteTrashed}
            />
            <div
              className="sidebar-resize-handle"
              onMouseDown={startSidebarResize}
              onClick={() => sidebarCollapsed && toggleSidebarCollapsed()}
            />
          </div>

          <main className="main-content" ref={mainContentRef} onScroll={handleMainScroll}>
            {randomPracticeMode ? (
              <div className={`content-topbar add-quote-topbar${scrolled ? ' scrolled' : ''}`}>
                <div className="content-topbar-inner">
                  <button className="icon-btn back-btn" onClick={exitRandomPractice} title={t('app.back')}>
                    ←
                  </button>
                  <h2 className="content-title quote-font">{t('app.randomPracticeTitle')}</h2>
                  {editCardEntry && (
                    <div className="empty-state edit-card-hint">
                      {t('app.editCardHint')}
                    </div>
                  )}
                </div>
              </div>
            ) : editCardId && editCardEntry ? (
              <div className={`content-topbar add-quote-topbar${scrolled ? ' scrolled' : ''}`}>
                <div className="content-topbar-inner">
                  <button
                    className="icon-btn back-btn"
                    onClick={() => setEditCardId(null)}
                    title={t('app.back')}
                  >
                    ←
                  </button>
                  <h2 className="content-title quote-font">{t('app.editCard')}</h2>
                  <div className="empty-state edit-card-hint">
                    {t('app.editCardHint')}
                  </div>
                  <div className="content-topbar-actions">
                    <button
                      className="icon-btn add-btn"
                      onClick={() => {
                        setEditCardId(null);
                        setShowAddForm(true);
                      }}
                      title={t('contentTopbar.addQuote')}
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </div>
            ) : showAddForm ? (
              <div className={`content-topbar add-quote-topbar${scrolled ? ' scrolled' : ''}`}>
                <div className="content-topbar-inner">
                  <button className="icon-btn back-btn" onClick={closeAddForm} title={t('app.back')}>
                    ←
                  </button>
                  <h2 className="content-title quote-font">{t('app.addQuoteTitle')}</h2>
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
                searchHint={term ? t('app.searchHint', globalSearchVisible.length) : ''}
                searchInputRef={searchInputRef}
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
              {randomPracticeMode ? (
                <div className="add-quote-page">
                  {editCardEntry ? (
                    <>
                      <QuoteCard
                        key={editCardEntry.quote.id}
                        quote={editCardEntry.quote}
                        scenariosToShow={editCardEntry.scenariosToShow}
                        term=""
                        collapsed={false}
                        onToggleCollapse={() => {}}
                        editable
                      />
                      <div className="card-actions practice-prompt-row">
                        <div className="practice-prompt-wrap">
                          <button
                            className="practice-prompt-btn"
                            onClick={showPracticePrompt}
                            title={t('app.practicePromptHint')}
                          >
                            i
                          </button>
                          {practicePrompt && (
                            <div className="practice-prompt-bubble">
                              <button
                                className="practice-prompt-close"
                                onClick={() => setPracticePrompt(null)}
                                title={t('app.closePracticePrompt')}
                              >
                                ×
                              </button>
                              {practicePrompt}
                            </div>
                          )}
                        </div>
                        <button className="small" onClick={nextPracticeCard}>
                          {t('app.nextCard')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">{t('app.noQuotesToPractice')}</div>
                  )}
                </div>
              ) : editCardId && editCardEntry ? (
                <div className="add-quote-page">
                  <QuoteCard
                    quote={editCardEntry.quote}
                    scenariosToShow={editCardEntry.scenariosToShow}
                    term=""
                    collapsed={false}
                    onToggleCollapse={() => {}}
                    editable
                  />
                  <div className="card-actions practice-prompt-row">
                    <div className="practice-prompt-wrap">
                      <button
                        className="practice-prompt-btn"
                        onClick={showPracticePrompt}
                        title={t('app.practicePromptHint')}
                      >
                        i
                      </button>
                      {practicePrompt && (
                        <div className="practice-prompt-bubble">
                          <button
                            className="practice-prompt-close"
                            onClick={() => setPracticePrompt(null)}
                            title={t('app.closePracticePrompt')}
                          >
                            ×
                          </button>
                          {practicePrompt}
                        </div>
                      )}
                    </div>
                  </div>
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
                        {t('app.trashBanner', TRASH_RETENTION_DAYS)}
                      </div>
                      {trashedQuotes.length === 0 ? (
                        <div className="empty-state">{t('app.trashEmptyState')}</div>
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
                            <div className="empty-state">{t('app.noScenarioTagResults')}</div>
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

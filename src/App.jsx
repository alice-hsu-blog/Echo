import { useMemo, useState } from 'react';
import { AppContext } from './context/AppContext.jsx';
import { useDb } from './hooks/useDb.js';
import { useToast } from './hooks/useToast.js';
import { useConfirm } from './hooks/useConfirm.js';
import { getVisibleQuotes } from './lib/filter.js';

import Header from './components/Header.jsx';
import Stats from './components/Stats.jsx';
import ConnStatus from './components/ConnStatus.jsx';
import Toolbar from './components/Toolbar.jsx';
import AddQuoteForm from './components/AddQuoteForm.jsx';
import SearchBox from './components/SearchBox.jsx';
import GlobalActions from './components/GlobalActions.jsx';
import QuoteList from './components/QuoteList.jsx';
import Toast from './components/Toast.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';

export default function App() {
  const { db, commit, serverAvailable, ready } = useDb();
  const { message: toastMessage, visible: toastVisible, toast } = useToast();
  const { state: confirmState, showChoice, showConfirm, runAndClose } = useConfirm();

  const [editingState, setEditingState] = useState(null);
  const [cardCollapse, setCardCollapse] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const term = searchTerm.trim().toLowerCase();
  const visible = useMemo(() => getVisibleQuotes(db, term), [db, term]);

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

  const ctxValue = { db, commit, editingState, setEditingState, toast, showConfirm };

  if (!ready) return null;

  return (
    <AppContext.Provider value={ctxValue}>
      <div className="wrap">
        <Header />
        <Stats db={db} />
        <ConnStatus connected={serverAvailable} />
        <Toolbar db={db} commit={commit} toast={toast} showChoice={showChoice} />
        <AddQuoteForm db={db} commit={commit} toast={toast} />
        <SearchBox
          term={searchTerm}
          onChange={setSearchTerm}
          hint={term ? `找到 ${visible.length} 則相關名言` : ''}
        />
        <GlobalActions allCollapsed={allCollapsed} onToggleAll={toggleAll} />
        <QuoteList
          visible={visible}
          totalQuoteCount={db.quotes.length}
          term={term}
          cardCollapse={cardCollapse}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      <Toast message={toastMessage} visible={toastVisible} />
      <ConfirmDialog state={confirmState} onAction={runAndClose} />
    </AppContext.Provider>
  );
}

// UI text for every supported language. Values are either a plain string or
// a function returning a string (for text that interpolates a count, name,
// or search term). Looked up through the `t(key, ...args)` helper returned
// by useLanguage — see src/hooks/useLanguage.js.
export const translations = {
  zh: {
    'sidebar.allQuotes': '所有句子',
    'sidebar.allScenarios': '所有情境',
    'sidebar.randomPractice': '隨機練習',
    'sidebar.recentPractice': '最近仿寫',
    'sidebar.folders': '資料夾',
    'sidebar.newFolder': '新增資料夾',
    'sidebar.uncategorized': '未分類',
    'sidebar.folderNamePlaceholder': '資料夾名稱',
    'sidebar.noFoldersHint': '還沒有資料夾，點上面「＋」新增一個吧。',
    'sidebar.trash': '垃圾桶',
    'sidebar.deleteFolderConfirmWithCount': (count) =>
      `這個資料夾裡有 ${count} 個句子，刪除資料夾後它們會變成未分類（不會被刪除），確定要刪除嗎？`,
    'sidebar.deleteFolderConfirm': (name) => `確定要刪除「${name}」這個資料夾嗎？`,

    'stats.quotes': (count) => `${count} 個句子`,
    'stats.practices': (count) => `${count} 篇仿寫練習`,

    'itemMenu.edit': '編輯',
    'itemMenu.moveToFolder': '移至資料夾',
    'itemMenu.uncategorized': '不分類',
    'itemMenu.delete': '刪除',

    'globalActions.expandAll': '展開全部',
    'globalActions.collapseAll': '折疊全部',

    'searchBox.placeholder': '搜尋句子、情境、出處或仿寫內容...',

    'contentTopbar.emptyTrash': '清空垃圾桶',
    'contentTopbar.multiSelect': '多選',
    'contentTopbar.addQuote': '新增句子',

    'bulkAction.selectedCount': (count) => `已選 ${count} 則`,
    'bulkAction.selectAll': '全選',
    'bulkAction.moveToFolder': '移至資料夾',
    'bulkAction.uncategorized': '不分類',
    'bulkAction.delete': '刪除',
    'bulkAction.cancel': '取消',

    'scenarioTagCloud.empty': '還沒有任何情境，先在句子底下新增情境吧。',
    'scenarioTagCloud.anyTag': '任一標籤',
    'scenarioTagCloud.allTags': '全部標籤',
    'scenarioTagCloud.clearFilter': '清除篩選',

    'scenarioPicker.title': '之前寫過的情境（點一下新增）',
    'scenarioPicker.noMatch': '沒有符合的情境',

    'scenarioGroup.label': '情境：',
    'scenarioGroup.practicePlaceholder': '寫下你的仿寫句子...',
    'scenarioGroup.confirmDeleteWithPractices': '以下有仿寫的句子，確認刪除嗎？',

    'quoteCard.quoteTextLabel': '句子原文',
    'quoteCard.sourceLabel': '出處',
    'quoteCard.sourceUnfilled': '出處未填',
    'quoteCard.deleteConfirmWithPractices': (scenarioCount, practiceCount) =>
      `這個句子底下有${scenarioCount}個情境，共${practiceCount}篇仿寫練習，確定要一併刪除嗎？`,
    'quoteCard.deleteConfirm': '確定要刪除這個句子嗎？',
    'quoteCard.scenarioLabel': '情境',
    'quoteCard.scenarioPlaceholder': '例：下雨天 / 等待 / 說話',
    'quoteCard.addScenario': '＋ 新增情境',

    'addQuoteForm.originalTextLabel': '原文',
    'addQuoteForm.textPlaceholder': '輸入你想收藏的句子...',
    'addQuoteForm.sourceLabel': '出處',
    'addQuoteForm.sourcePlaceholder': '例：《紅樓夢》第二十七回',
    'addQuoteForm.submit': '加入資料庫',

    'trashCard.daysLeft': (n) => `${n} 天後將被系統自動永久刪除`,
    'trashCard.deletingSoon': '即將被系統自動永久刪除',
    'trashCard.practicesCount': (n) => `${n} 篇仿寫`,
    'trashCard.restore': '復原',
    'trashCard.permanentDelete': '立即永久刪除',

    'quoteList.emptyDefault': '還沒有收藏任何句子，從上面「＋」開始吧。',
    'quoteList.noSearchResults': (term) => `找不到符合「${term}」的句子、情境或仿寫練習。`,

    'app.titleAllQuotes': '所有句子',
    'app.titleUncategorized': '未分類',
    'app.titleAllScenarios': '所有情境',
    'app.titleTrash': '垃圾桶',
    'app.titleRecentPractice': '最近仿寫',
    'recentPractice.total': (n) => `共 ${n} 則練習`,
    'recentPractice.dayCount': (n) => `${n} 則`,
    'recentPractice.date': (y, m, d, w) => `${y} 年 ${m} 月 ${d} 日（${'日一二三四五六'[w]}）`,
    'recentPractice.today': '今天',
    'recentPractice.yesterday': '昨天',
    'recentPractice.daysAgo': (n) => `${n} 天前`,
    'recentPractice.original': '原句',
    'recentPractice.empty': '還沒有任何練習。到句子卡的情境底下寫下第一則仿寫吧！',
    'app.titleSearchResults': '搜尋結果',
    'app.folderEmptyMessage': '這個資料夾還沒有任何句子，點上面「＋」新增一個吧。',
    'app.back': '返回',
    'app.editCard': '編輯卡片',
    'app.editCardHint': '點擊文字上方即可修改，點擊旁邊或按「Enter」即可儲存',
    'app.randomPracticeTitle': '隨機練習',
    'app.nextCard': '下一張',
    'app.practicePromptHint': '給我一個練習造句的靈感',
    'app.closePracticePrompt': '關閉提示',
    'app.noQuotesToPractice': '目前沒有任何句子可以練習，請先新增一些。',
    'app.addQuoteTitle': '新增句子',
    'app.searchHint': (count) => `找到 ${count} 個相關句子`,
    'app.bulkDeleteConfirm': (count) => `確定要刪除選取的 ${count} 個句子嗎？（包含底下所有情境與仿寫練習）`,
    'app.permanentDeleteConfirm': '確定要永久刪除這個句子嗎？此操作無法復原。',
    'app.emptyTrashConfirm': (count) => `確定要清空垃圾桶嗎？將永久刪除 ${count} 個句子，此操作無法復原。`,
    'app.trashBanner': (days) => `垃圾桶中的句子會保留 ${days} 天，之後系統會自動永久刪除，也可以手動立即刪除。`,
    'app.trashEmptyState': '垃圾桶是空的。',
    'app.noScenarioTagResults': '找不到符合所選情境標籤的句子。',

    'confirm.cancel': '取消',
    'confirm.ok': '確定',

    'backup.importPrompt':
      '要匯入這份備份嗎？\n「合併」會保留現有資料，加入備份中沒有的內容。',
    'backup.merge': '合併',

    'shortcuts.title': '鍵盤快捷鍵',
    'shortcuts.hint': '按「編輯」後直接按下想要的按鍵組合即可重設；錄製時按 Esc 可取消。',
    'shortcuts.close': '關閉',
    'shortcuts.done': '完成',
    'shortcuts.edit': '編輯',
    'shortcuts.cancel': '取消',
    'shortcuts.reset': '回復預設',
    'shortcuts.resetAll': '全部回復預設',
    'shortcuts.recording': '請按下按鍵…',
    'shortcuts.fixed': '固定',
    'shortcuts.conflict': (keys, action) => `${keys} 已指定給「${action}」`,
    'shortcuts.addQuote': '新增句子',
    'shortcuts.addQuoteDesc': '開啟新增句子的頁面',
    'shortcuts.focusSearch': '搜尋',
    'shortcuts.focusSearchDesc': '跳到搜尋欄',
    'shortcuts.goBack': '返回',
    'shortcuts.goBackDesc': '從編輯卡片／新增句子／隨機練習頁面返回',
    'shortcuts.escape': '返回／取消',
    'shortcuts.escapeDesc': '關閉目前頁面或退出多選模式',
    'shortcuts.deleteSelected': '刪除選取的句子',
    'shortcuts.deleteSelectedDesc': '多選模式下刪除已選取的句子',

    'toast.pleaseEnterQuoteText': '請輸入句子原文',
    'toast.pleaseEnterSource': '請輸入出處',
    'toast.pleaseEnterScenario': '請填寫情境',
    'toast.pleaseEnterPractice': '請填寫仿寫內容',
    'toast.addedSuccess': '新增成功',
    'toast.savedChanges': '已儲存修改',
    'toast.addedScenario': '已加入情境',
    'toast.addedPractice': '已加入仿寫練習',
    'toast.deletedScenario': '已刪除情境',
    'toast.deletedPractice': '已刪除仿寫練習',
    'toast.deletedFolder': '已刪除資料夾',
    'toast.deletedSelected': '已刪除選取的句子',
    'toast.movedToFolder': '已移至資料夾',
    'toast.movedToUncategorized': '已移至「未分類」',
    'toast.movedOutOfFolder': '已移出資料夾',
    'toast.movedToTrash': '已移至垃圾桶',
    'toast.restored': '已復原',
    'toast.permanentlyDeleted': '已永久刪除',
    'toast.trashEmptied': '已清空垃圾桶',
    'toast.exportedBackup': '已匯出備份',
    'toast.importedMerge': ({ quotes, folders, scenarios, practices }) =>
      '匯入完成：新增 ' +
      [
        quotes && `${quotes} 個句子`,
        folders && `${folders} 個資料夾`,
        scenarios && `${scenarios} 個情境`,
        practices && `${practices} 篇仿寫練習`
      ]
        .filter(Boolean)
        .join('、'),
    'toast.importedNothing': '沒有新的內容：這個檔案裡的資料 Echo 都已經有了',
    'toast.importFailed': '匯入失敗：檔案格式不正確',
    'toast.saveFailed': '儲存失敗：變更沒有寫入資料庫，重新開啟後會遺失'
  },
  en: {
    'sidebar.allQuotes': 'All Quotes',
    'sidebar.allScenarios': 'All Scenarios',
    'sidebar.randomPractice': 'Random Practice',
    'sidebar.recentPractice': 'Recent Practice',
    'sidebar.folders': 'Folders',
    'sidebar.newFolder': 'New Folder',
    'sidebar.uncategorized': 'Uncategorized',
    'sidebar.folderNamePlaceholder': 'Folder name',
    'sidebar.noFoldersHint': 'No folders yet — click "+" above to add one.',
    'sidebar.trash': 'Trash',
    'sidebar.deleteFolderConfirmWithCount': (count) =>
      `This folder has ${count} quote(s). Deleting it will move them to Uncategorized (they won't be deleted). Delete this folder?`,
    'sidebar.deleteFolderConfirm': (name) => `Delete the folder "${name}"?`,

    'stats.quotes': (count) => `${count} quotes`,
    'stats.practices': (count) => `${count} practices`,

    'itemMenu.edit': 'Edit',
    'itemMenu.moveToFolder': 'Move to Folder',
    'itemMenu.uncategorized': 'Uncategorized',
    'itemMenu.delete': 'Delete',

    'globalActions.expandAll': 'Expand All',
    'globalActions.collapseAll': 'Collapse All',

    'searchBox.placeholder': 'Search scenarios, quotes, sources, or practices...',

    'contentTopbar.emptyTrash': 'Empty Trash',
    'contentTopbar.multiSelect': 'Select',
    'contentTopbar.addQuote': 'Add Quote',

    'bulkAction.selectedCount': (count) => `${count} selected`,
    'bulkAction.selectAll': 'Select All',
    'bulkAction.moveToFolder': 'Move to Folder',
    'bulkAction.uncategorized': 'Uncategorized',
    'bulkAction.delete': 'Delete',
    'bulkAction.cancel': 'Cancel',

    'scenarioTagCloud.empty': 'No scenarios yet — add one under a quote first.',
    'scenarioTagCloud.anyTag': 'Any Tag',
    'scenarioTagCloud.allTags': 'All Tags',
    'scenarioTagCloud.clearFilter': 'Clear Filter',

    'scenarioPicker.title': 'Previous scenarios (click to add)',
    'scenarioPicker.noMatch': 'No matching scenarios',

    'scenarioGroup.label': 'Scenario: ',
    'scenarioGroup.practicePlaceholder': 'Write your practice sentence...',
    'scenarioGroup.confirmDeleteWithPractices': 'This scenario has practices under it. Delete it anyway?',

    'quoteCard.quoteTextLabel': 'Quote Text',
    'quoteCard.sourceLabel': 'Source',
    'quoteCard.sourceUnfilled': 'No source',
    'quoteCard.deleteConfirmWithPractices': (scenarioCount, practiceCount) =>
      `This quote has ${scenarioCount} scenario(s) with ${practiceCount} practice(s) in total. Delete them all?`,
    'quoteCard.deleteConfirm': 'Delete this quote?',
    'quoteCard.scenarioLabel': 'Scenario',
    'quoteCard.scenarioPlaceholder': "e.g. describing the anxiety of waiting for someone who never comes",
    'quoteCard.addScenario': '＋ Add Scenario',

    'addQuoteForm.originalTextLabel': 'Text',
    'addQuoteForm.textPlaceholder': "Enter the sentence you'd like to save...",
    'addQuoteForm.sourceLabel': 'Source',
    'addQuoteForm.sourcePlaceholder': 'e.g. Dream of the Red Chamber, Ch. 27',
    'addQuoteForm.submit': 'Add to Library',

    'trashCard.daysLeft': (n) => `Will be permanently deleted in ${n} day(s)`,
    'trashCard.deletingSoon': 'Will be permanently deleted soon',
    'trashCard.practicesCount': (n) => `${n} practices`,
    'trashCard.restore': 'Restore',
    'trashCard.permanentDelete': 'Delete Permanently',

    'quoteList.emptyDefault': 'No quotes saved yet — start with "+" above.',
    'quoteList.noSearchResults': (term) => `No quotes, scenarios, or practices match "${term}".`,

    'app.titleAllQuotes': 'All Quotes',
    'app.titleUncategorized': 'Uncategorized',
    'app.titleAllScenarios': 'All Scenarios',
    'app.titleTrash': 'Trash',
    'app.titleRecentPractice': 'Recent Practice',
    'recentPractice.total': (n) => `${n} practice${n === 1 ? '' : 's'}`,
    'recentPractice.dayCount': (n) => `${n}`,
    'recentPractice.date': (y, m, d, w) =>
      `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][w]}, ${
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]
      } ${d}, ${y}`,
    'recentPractice.today': 'Today',
    'recentPractice.yesterday': 'Yesterday',
    'recentPractice.daysAgo': (n) => `${n} days ago`,
    'recentPractice.original': 'Original',
    'recentPractice.empty': 'No practices yet — write your first one under a scenario on any quote card.',
    'app.titleSearchResults': 'Search Results',
    'app.folderEmptyMessage': 'This folder has no quotes yet — click "+" above to add one.',
    'app.back': 'Back',
    'app.editCard': 'Edit Card',
    'app.editCardHint': 'Click on the text to edit it; click elsewhere or press Enter to save',
    'app.randomPracticeTitle': 'Random Practice',
    'app.nextCard': 'Next',
    'app.practicePromptHint': 'Give me a writing-practice suggestion',
    'app.closePracticePrompt': 'Dismiss suggestion',
    'app.noQuotesToPractice': 'No quotes to practice with yet — add some first.',
    'app.addQuoteTitle': 'Add a Quote',
    'app.searchHint': (count) => `Found ${count} matching quotes`,
    'app.bulkDeleteConfirm': (count) =>
      `Delete the selected ${count} quote(s)? (Includes all scenarios and practices under them.)`,
    'app.permanentDeleteConfirm': 'Permanently delete this quote? This cannot be undone.',
    'app.emptyTrashConfirm': (count) =>
      `Empty the trash? This will permanently delete ${count} quote(s). This cannot be undone.`,
    'app.trashBanner': (days) =>
      `Quotes in the trash are kept for ${days} days before being automatically deleted permanently. You can also delete them right away.`,
    'app.trashEmptyState': 'The trash is empty.',
    'app.noScenarioTagResults': 'No quotes match the selected scenario tags.',

    'confirm.cancel': 'Cancel',
    'confirm.ok': 'OK',

    'backup.importPrompt':
      'Import this backup?\n"Merge" keeps your existing data and adds anything new from the backup.',
    'backup.merge': 'Merge',

    'shortcuts.title': 'Keyboard Shortcuts',
    'shortcuts.hint': 'Click "Edit", then press the key combination you want. Press Esc while recording to cancel.',
    'shortcuts.close': 'Close',
    'shortcuts.done': 'Done',
    'shortcuts.edit': 'Edit',
    'shortcuts.cancel': 'Cancel',
    'shortcuts.reset': 'Reset',
    'shortcuts.resetAll': 'Reset All',
    'shortcuts.recording': 'Press a key…',
    'shortcuts.fixed': 'Fixed',
    'shortcuts.conflict': (keys, action) => `${keys} is already assigned to "${action}"`,
    'shortcuts.addQuote': 'Add Quote',
    'shortcuts.addQuoteDesc': 'Open the add-quote page',
    'shortcuts.focusSearch': 'Search',
    'shortcuts.focusSearchDesc': 'Jump to the search box',
    'shortcuts.goBack': 'Back',
    'shortcuts.goBackDesc': 'Leave the edit-card / add-quote / random-practice page',
    'shortcuts.escape': 'Back / Cancel',
    'shortcuts.escapeDesc': 'Close the current page or exit multi-select mode',
    'shortcuts.deleteSelected': 'Delete Selected Quotes',
    'shortcuts.deleteSelectedDesc': 'Delete the selected quotes in multi-select mode',

    'toast.pleaseEnterQuoteText': 'Please enter the quote text',
    'toast.pleaseEnterSource': 'Please enter a source',
    'toast.pleaseEnterScenario': 'Please enter a scenario',
    'toast.pleaseEnterPractice': 'Please enter a practice',
    'toast.addedSuccess': 'Added successfully',
    'toast.savedChanges': 'Changes saved',
    'toast.addedScenario': 'Scenario added',
    'toast.addedPractice': 'Practice added',
    'toast.deletedScenario': 'Scenario deleted',
    'toast.deletedPractice': 'Practice deleted',
    'toast.deletedFolder': 'Folder deleted',
    'toast.deletedSelected': 'Selected quotes deleted',
    'toast.movedToFolder': 'Moved to folder',
    'toast.movedToUncategorized': 'Moved to Uncategorized',
    'toast.movedOutOfFolder': 'Removed from folder',
    'toast.movedToTrash': 'Moved to trash',
    'toast.restored': 'Restored',
    'toast.permanentlyDeleted': 'Permanently deleted',
    'toast.trashEmptied': 'Trash emptied',
    'toast.exportedBackup': 'Backup exported',
    'toast.importedMerge': ({ quotes, folders, scenarios, practices }) => {
      const n = (count, word) => count && `${count} ${word}${count === 1 ? '' : 's'}`;
      return (
        'Import complete: added ' +
        [n(quotes, 'quote'), n(folders, 'folder'), n(scenarios, 'scenario'), n(practices, 'practice')]
          .filter(Boolean)
          .join(', ')
      );
    },
    'toast.importedNothing': 'Nothing new to import: everything in this file is already in Echo',
    'toast.importFailed': 'Import failed: invalid file format',
    'toast.saveFailed': 'Save failed: changes were not written to the database and will be lost on restart'
  }
};

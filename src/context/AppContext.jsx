import { createContext, useContext } from 'react';

// Shared plumbing (db mutations, inline-edit state, toast, confirm dialog)
// that quote/scenario/practice rows all need, several levels deep. Keeps
// QuoteCard/ScenarioGroup/PracticeItem from having to thread a dozen props
// through each other just to pass them along.
export const AppContext = createContext(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContext.Provider');
  return ctx;
}

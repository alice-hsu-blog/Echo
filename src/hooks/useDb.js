import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL, isTauri, loadLocal, migrateDb, purgeExpiredTrash, saveLocal } from '../lib/db.js';

// Loads the DB from the server (falling back to localStorage), and exposes
// `commit` for mutations. Every commit writes to localStorage immediately
// (the durable fallback, not just a cache) and POSTs to the server when
// available. Inside Tauri, reads/writes go through the native IPC bridge
// instead of `fetch` — there's no server, so `serverAvailable` is always
// true there (direct file write can't go "offline").
export function useDb() {
  const [db, setDb] = useState({ quotes: [] });
  const [serverAvailable, setServerAvailable] = useState(false);
  const [ready, setReady] = useState(false);
  const serverAvailableRef = useRef(false);

  const persist = useCallback((newDb) => {
    saveLocal(newDb);
    if (isTauri()) {
      import('@tauri-apps/api/core').then(({ invoke }) => invoke('echo_save', { data: newDb }));
      return;
    }
    if (!serverAvailableRef.current) return;
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDb)
    })
      .then((res) => {
        if (!res.ok) throw new Error('save failed');
        serverAvailableRef.current = true;
        setServerAvailable(true);
      })
      .catch(() => {
        serverAvailableRef.current = false;
        setServerAvailable(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loaded;
      let connected = false;
      if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        loaded = migrateDb(await invoke('echo_load'));
        connected = true;
      } else {
        try {
          const res = await fetch(API_URL, { cache: 'no-store' });
          if (!res.ok) throw new Error('server responded with ' + res.status);
          loaded = migrateDb(await res.json());
          connected = true;
        } catch (e) {
          loaded = migrateDb(loadLocal());
          connected = false;
        }
      }
      if (cancelled) return;
      serverAvailableRef.current = connected;
      setServerAvailable(connected);

      // Purge trash items past their retention window on every load, so
      // they don't linger just because the app wasn't open when they expired.
      const purged = purgeExpiredTrash(loaded);
      setDb(purged);
      if (purged.quotes.length !== loaded.quotes.length) persist(purged);

      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [persist]);

  const commit = useCallback(
    (newDb) => {
      setDb(newDb);
      persist(newDb);
    },
    [persist]
  );

  return { db, commit, serverAvailable, ready };
}

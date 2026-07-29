import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL, loadLocal, migrateDb, saveLocal } from '../lib/db.js';

// Loads the DB from the server (falling back to localStorage), and exposes
// `commit` for mutations. Every commit writes to localStorage immediately
// (the durable fallback, not just a cache) and POSTs to the server when
// available.
export function useDb() {
  const [db, setDb] = useState({ quotes: [] });
  const [serverAvailable, setServerAvailable] = useState(false);
  const [ready, setReady] = useState(false);
  const serverAvailableRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loaded;
      let connected = false;
      try {
        const res = await fetch(API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('server responded with ' + res.status);
        loaded = migrateDb(await res.json());
        connected = true;
      } catch (e) {
        loaded = migrateDb(loadLocal());
        connected = false;
      }
      if (cancelled) return;
      setDb(loaded);
      serverAvailableRef.current = connected;
      setServerAvailable(connected);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((newDb) => {
    setDb(newDb);
    saveLocal(newDb);
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

  return { db, commit, serverAvailable, ready };
}

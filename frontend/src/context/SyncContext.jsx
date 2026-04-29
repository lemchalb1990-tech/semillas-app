import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncAll, queueCount } from '../db/syncEngine';

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const [online, setOnline]       = useState(navigator.onLine);
  const [syncing, setSyncing]     = useState(false);
  const [pending, setPending]     = useState(0);
  const [lastSync, setLastSync]   = useState(null);

  // Refrescar conteo de pendientes
  const refreshPending = useCallback(async () => {
    setPending(await queueCount());
  }, []);

  // Sincronizar manualmente o al reconectar
  const sync = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    await syncAll();
    setSyncing(false);
    setLastSync(new Date());
    await refreshPending();
  }, [syncing, refreshPending]);

  useEffect(() => {
    refreshPending();

    const goOnline  = () => { setOnline(true);  sync(); };
    const goOffline = () => { setOnline(false); };
    const onQueueChange = () => refreshPending();
    const onSyncStart   = () => setSyncing(true);
    const onSyncEnd     = async (e) => {
      setSyncing(false);
      setPending(e.detail?.pending ?? 0);
      setLastSync(new Date());
    };

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('semillas:queue-change', onQueueChange);
    window.addEventListener('semillas:sync-start',   onSyncStart);
    window.addEventListener('semillas:sync-end',     onSyncEnd);

    // Sincronizar al cargar si hay pendientes
    if (navigator.onLine) sync();

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('semillas:queue-change', onQueueChange);
      window.removeEventListener('semillas:sync-start',   onSyncStart);
      window.removeEventListener('semillas:sync-end',     onSyncEnd);
    };
  }, []);

  return (
    <SyncContext.Provider value={{ online, syncing, pending, lastSync, sync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}

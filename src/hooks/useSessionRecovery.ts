// React hook for session recovery and management
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { SessionContextData } from '@/lib/services/session-service';
import {
  getOrCreateSessionId,
  loadSessionContextLocal,
  saveSessionContextLocal,
  updateSessionContextServer,
  getSessionContextServer,
  listSnapshotsServer,
  restoreSnapshotServer,
  createSnapshotServer,
  shareContextAcrossSessions,
  broadcastSessionUpdate,
  onSessionStorageChange,
  initializeSessionDB,
} from '@/lib/client/session-storage';

export interface UseSessionRecoveryOptions {
  /**
   * Auto-save interval in milliseconds (0 to disable)
   */
  autoSaveInterval?: number;
  /**
   * Whether to restore from snapshot on mount
   */
  restoreOnMount?: boolean;
  /**
   * Whether to sync with server on mount
   */
  syncWithServerOnMount?: boolean;
  /**
   * Snapshot to restore on mount (optional)
   */
  initialSnapshotId?: string;
}

export interface SessionSnapshot {
  id: string;
  snapshotName?: string;
  createdAt: string;
  source: string;
}

export function useSessionRecovery(options: UseSessionRecoveryOptions = {}) {
  const {
    autoSaveInterval = 30000, // 30 seconds
    restoreOnMount = true,
    syncWithServerOnMount = true,
    initialSnapshotId,
  } = options;

  const [sessionId, setSessionId] = useState<string>('');
  const [contextData, setContextData] = useState<SessionContextData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [snapshots, setSnapshots] = useState<SessionSnapshot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const unsubscribeStorageRef = useRef<(() => void) | null>(null);

  /**
   * Initialize session and load context
   */
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize IndexedDB
      await initializeSessionDB();

      // Get or create session ID
      const newSessionId = getOrCreateSessionId();
      setSessionId(newSessionId);

      // Try to restore from snapshot if provided
      if (initialSnapshotId) {
        const snapshotData = await restoreSnapshotServer(initialSnapshotId);
        if (snapshotData) {
          setContextData(snapshotData);
          await saveSessionContextLocal(newSessionId, snapshotData);
          return;
        }
      }

      // Try to load from server first
      if (syncWithServerOnMount) {
        const serverContext = await getSessionContextServer(newSessionId);
        if (serverContext) {
          setContextData(serverContext);
          await saveSessionContextLocal(newSessionId, serverContext);
          return;
        }
      }

      // Fall back to local storage
      if (restoreOnMount) {
        const localContext = await loadSessionContextLocal(newSessionId);
        if (localContext) {
          setContextData(localContext);
          return;
        }
      }

      // Initialize with empty context
      setContextData({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
      setError(errorMessage);
      console.error('Session initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [initialSnapshotId, syncWithServerOnMount, restoreOnMount]);

  /**
   * Update context data
   */
  const updateContext = useCallback(
    async (updates: SessionContextData, syncToServer: boolean = true) => {
      try {
        const newContextData = { ...contextData, ...updates };
        setContextData(newContextData);

        // Save locally
        await saveSessionContextLocal(sessionId, newContextData);

        // Sync to server
        if (syncToServer && sessionId) {
          await updateSessionContextServer(sessionId, updates);
        }

        // Broadcast to other tabs
        Object.entries(updates).forEach(([key, value]) => {
          broadcastSessionUpdate(key, value);
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update context';
        setError(errorMessage);
        console.error('Context update error:', err);
      }
    },
    [contextData, sessionId]
  );

  /**
   * Create a snapshot of current context
   */
  const createSnapshot = useCallback(
    async (snapshotName?: string): Promise<string | null> => {
      try {
        setIsSyncing(true);
        const result = await createSnapshotServer(
          sessionId,
          contextData,
          snapshotName
        );

        if (result) {
          // Also save locally
          await saveSessionContextLocal(`snapshot_${result.id}`, contextData);
          // Refresh snapshots list
          await loadSnapshots();
          return result.id;
        }
        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create snapshot';
        setError(errorMessage);
        console.error('Snapshot creation error:', err);
        return null;
      } finally {
        setIsSyncing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, contextData]
  );

  /**
   * Restore from a snapshot
   */
  const restoreSnapshot = useCallback(
    async (snapshotId: string): Promise<boolean> => {
      try {
        setIsSyncing(true);
        const restoredData = await restoreSnapshotServer(snapshotId);

        if (restoredData) {
          setContextData(restoredData);
          await saveSessionContextLocal(sessionId, restoredData);
          await updateSessionContextServer(sessionId, restoredData);
          return true;
        }
        return false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to restore snapshot';
        setError(errorMessage);
        console.error('Snapshot restore error:', err);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [sessionId]
  );

  /**
   * Load available snapshots
   */
  const loadSnapshots = useCallback(async () => {
    try {
      const snapshotList = await listSnapshotsServer(10);
      if (snapshotList) {
        setSnapshots(snapshotList);
      }
    } catch (err) {
      console.warn('Failed to load snapshots:', err);
    }
  }, []);

  /**
   * Share context across sessions
   */
  const shareContext = useCallback(
    async (key: string, value: unknown): Promise<boolean> => {
      try {
        const success = await shareContextAcrossSessions(key, value);
        if (success) {
          // Also update local context
          await updateContext({ [key]: value }, false);
        }
        return success;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to share context';
        setError(errorMessage);
        console.error('Context sharing error:', err);
        return false;
      }
    },
    [updateContext]
  );

  /**
   * Manual sync with server
   */
  const syncWithServer = useCallback(async () => {
    try {
      setIsSyncing(true);
      const success = await updateSessionContextServer(sessionId, contextData);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync with server';
      setError(errorMessage);
      console.error('Server sync error:', err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [sessionId, contextData]);

  // Initialize on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Set up auto-save
  useEffect(() => {
    if (autoSaveInterval && sessionId) {
      autoSaveTimerRef.current = setInterval(() => {
        updateSessionContextServer(sessionId, contextData).catch(err => {
          console.warn('Auto-save failed:', err);
        });
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveInterval, sessionId, contextData]);

  // Set up cross-tab communication
  useEffect(() => {
    unsubscribeStorageRef.current = onSessionStorageChange(data => {
      setContextData(prev => ({ ...prev, ...data }));
    });

    return () => {
      if (unsubscribeStorageRef.current) {
        unsubscribeStorageRef.current();
      }
    };
  }, []);

  return {
    sessionId,
    contextData,
    isLoading,
    isSyncing,
    snapshots,
    error,
    updateContext,
    createSnapshot,
    restoreSnapshot,
    loadSnapshots,
    shareContext,
    syncWithServer,
  };
}

/**
 * Simplified hook for just reading session context
 */
export function useSessionContext() {
  const [contextData, setContextData] = useState<SessionContextData>({});
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    setSessionId(sessionId);

    loadSessionContextLocal(sessionId).then(data => {
      if (data) {
        setContextData(data);
      }
    });
  }, []);

  return { sessionId, contextData };
}

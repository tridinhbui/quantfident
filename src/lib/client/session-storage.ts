// Client-side session utilities for persistence and recovery
import { SessionContextData } from '@/lib/services/session-service';

const STORAGE_KEY = 'quantfident_session_data';
const SESSION_ID_KEY = 'quantfident_session_id';
const CONTEXT_STORE = 'session_contexts_store';
const SNAPSHOTS_STORE = 'session_snapshots_store';

/**
 * Initialize IndexedDB for session storage
 */
export async function initializeSessionDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('quantfident_sessions', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(CONTEXT_STORE)) {
        db.createObjectStore(CONTEXT_STORE, { keyPath: 'sessionId' });
      }

      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Generate a unique session ID for this browser session
 */
export function generateClientSessionId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get or create a session ID for this client
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateClientSessionId();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Save session context to IndexedDB
 */
export async function saveSessionContextLocal(
  sessionId: string,
  contextData: SessionContextData
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await initializeSessionDB();
    const transaction = db.transaction([CONTEXT_STORE], 'readwrite');
    const store = transaction.objectStore(CONTEXT_STORE);

    const data = {
      sessionId,
      contextData,
      savedAt: new Date().toISOString(),
    };

    await new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to save session context to IndexedDB:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_${sessionId}`,
        JSON.stringify(contextData)
      );
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }
}

/**
 * Load session context from IndexedDB
 */
export async function loadSessionContextLocal(
  sessionId: string
): Promise<SessionContextData | null> {
  if (typeof window === 'undefined') return null;

  try {
    const db = await initializeSessionDB();
    const transaction = db.transaction([CONTEXT_STORE], 'readonly');
    const store = transaction.objectStore(CONTEXT_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.contextData || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to load from IndexedDB, trying localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${sessionId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
      return null;
    }
  }
}

/**
 * Save a snapshot locally for quick access
 */
export async function saveSnapshotLocal(
  snapshotId: string,
  snapshotData: SessionContextData
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await initializeSessionDB();
    const transaction = db.transaction([SNAPSHOTS_STORE], 'readwrite');
    const store = transaction.objectStore(SNAPSHOTS_STORE);

    const data = {
      id: snapshotId,
      snapshotData,
      savedAt: new Date().toISOString(),
    };

    await new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to save snapshot locally:', error);
  }
}

/**
 * Load a snapshot from local storage
 */
export async function loadSnapshotLocal(
  snapshotId: string
): Promise<SessionContextData | null> {
  if (typeof window === 'undefined') return null;

  try {
    const db = await initializeSessionDB();
    const transaction = db.transaction([SNAPSHOTS_STORE], 'readonly');
    const store = transaction.objectStore(SNAPSHOTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(snapshotId);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.snapshotData || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to load snapshot:', error);
    return null;
  }
}

/**
 * Update session context on the server
 */
export async function updateSessionContextServer(
  sessionId: string,
  contextData: SessionContextData
): Promise<boolean> {
  try {
    const response = await fetch('/api/sessions/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify({ contextData }),
    });

    return response.ok;
  } catch (error) {
    console.warn('Failed to update session context on server:', error);
    return false;
  }
}

/**
 * Fetch session context from the server
 */
export async function getSessionContextServer(
  sessionId: string
): Promise<SessionContextData | null> {
  try {
    const response = await fetch('/api/sessions/context', {
      method: 'GET',
      headers: {
        'X-Session-ID': sessionId,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.context?.contextData || null;
  } catch (error) {
    console.warn('Failed to fetch session context:', error);
    return null;
  }
}

/**
 * Create a session snapshot on the server
 */
export async function createSnapshotServer(
  sessionId: string,
  snapshotData: SessionContextData,
  snapshotName?: string
): Promise<{ id: string; createdAt: string } | null> {
  try {
    const response = await fetch('/api/sessions/snapshots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify({ snapshotData, snapshotName }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.snapshot;
  } catch (error) {
    console.warn('Failed to create snapshot:', error);
    return null;
  }
}

/**
 * Restore a snapshot from the server
 */
export async function restoreSnapshotServer(
  snapshotId: string
): Promise<SessionContextData | null> {
  try {
    const response = await fetch(
      `/api/sessions/snapshots/${snapshotId}/restore`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.snapshot?.snapshotData || null;
  } catch (error) {
    console.warn('Failed to restore snapshot:', error);
    return null;
  }
}

/**
 * List available snapshots
 */
export async function listSnapshotsServer(
  limit: number = 10
): Promise<Array<{ id: string; snapshotName: string; createdAt: string; source: string }> | null> {
  try {
    const response = await fetch(`/api/sessions/snapshots?limit=${limit}`, {
      method: 'GET',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.snapshots || [];
  } catch (error) {
    console.warn('Failed to list snapshots:', error);
    return null;
  }
}

/**
 * Share context across all user sessions
 */
export async function shareContextAcrossSessions(
  contextKey: string,
  contextValue: unknown
): Promise<boolean> {
  try {
    const response = await fetch('/api/sessions/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contextKey, contextValue }),
    });

    return response.ok;
  } catch (error) {
    console.warn('Failed to share context:', error);
    return false;
  }
}

/**
 * Listen for session context changes across browser tabs/windows
 */
export function onSessionStorageChange(
  callback: (data: SessionContextData) => void
): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key?.startsWith(STORAGE_KEY)) {
      try {
        const data = event.newValue ? JSON.parse(event.newValue) : {};
        callback(data);
      } catch (error) {
        console.warn('Failed to parse storage change:', error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => window.removeEventListener('storage', handleStorageChange);
}

/**
 * Broadcast message to all tabs/windows
 */
export function broadcastSessionUpdate(
  contextKey: string,
  contextValue: unknown
): void {
  if (typeof window === 'undefined') return;

  // Try to use BroadcastChannel API (more reliable for same-origin)
  try {
    const channel = new BroadcastChannel('quantfident_session');
    channel.postMessage({
      type: 'context_update',
      contextKey,
      contextValue,
      timestamp: Date.now(),
    });
    channel.close();
  } catch {
    // Fallback to localStorage events
    localStorage.setItem(
      `${STORAGE_KEY}_broadcast_${Date.now()}`,
      JSON.stringify({ contextKey, contextValue })
    );
  }
}

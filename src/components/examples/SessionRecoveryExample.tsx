// Example component demonstrating session recovery and management
'use client';

import { useSessionRecovery } from '@/hooks/useSessionRecovery';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SessionRecoveryExample() {
  const {
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
  } = useSessionRecovery({
    autoSaveInterval: 30000, // Auto-save every 30 seconds
    restoreOnMount: true,
    syncWithServerOnMount: true,
  });

  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');

  // Load snapshots when component mounts
  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    updateContext({ theme });
  };

  const handleCreateSnapshot = async () => {
    const timestamp = new Date().toLocaleString();
    const snapshotId = await createSnapshot(`Snapshot at ${timestamp}`);
    if (snapshotId) {
      await loadSnapshots();
    }
  };

  const handleRestoreSnapshot = async () => {
    if (selectedSnapshotId) {
      const success = await restoreSnapshot(selectedSnapshotId);
      if (success) {
        alert('Session restored successfully!');
      }
    }
  };

  const handleShareTheme = async () => {
    const success = await shareContext(
      'theme',
      (contextData.theme as string) || 'light'
    );
    if (success) {
      alert('Theme shared to all active sessions!');
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading session...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-800">Error: {error}</p>
        </Card>
      )}

      {/* Session Info */}
      <Card className="p-4">
        <h3 className="font-bold mb-2">Session Information</h3>
        <div className="space-y-1 text-sm">
          <p>
            <strong>Session ID:</strong> <code className="bg-gray-100 px-2 py-1">{sessionId}</code>
          </p>
          <p>
            <strong>Status:</strong>{' '}
            {isSyncing ? (
              <span className="text-blue-600">Syncing...</span>
            ) : (
              <span className="text-green-600">Synced</span>
            )}
          </p>
        </div>
      </Card>

      {/* Current Context Data */}
      <Card className="p-4">
        <h3 className="font-bold mb-2">Current Context</h3>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(contextData, null, 2)}
        </pre>
      </Card>

      {/* Theme Management Example */}
      <Card className="p-4">
        <h3 className="font-bold mb-2">Example: Theme Management</h3>
        <div className="space-y-2">
          <p className="text-sm">
            Current theme: <strong>{(contextData.theme as string) || 'light'}</strong>
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleThemeChange('light')}
              variant={contextData.theme === 'light' ? 'default' : 'outline'}
            >
              Light
            </Button>
            <Button
              onClick={() => handleThemeChange('dark')}
              variant={contextData.theme === 'dark' ? 'default' : 'outline'}
            >
              Dark
            </Button>
            <Button onClick={handleShareTheme} variant="secondary">
              Share Theme to All Sessions
            </Button>
          </div>
        </div>
      </Card>

      {/* Snapshot Management */}
      <Card className="p-4">
        <h3 className="font-bold mb-2">Session Snapshots</h3>
        <div className="space-y-3">
          {/* Create Snapshot */}
          <div>
            <Button
              onClick={handleCreateSnapshot}
              disabled={isSyncing}
              className="w-full"
            >
              {isSyncing ? 'Creating...' : 'Create Snapshot'}
            </Button>
          </div>

          {/* List and Restore Snapshots */}
          {snapshots.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Available Snapshots:</p>
              <div className="space-y-2">
                {snapshots.map(snapshot => (
                  <div key={snapshot.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={snapshot.id}
                      name="snapshot"
                      value={snapshot.id}
                      checked={selectedSnapshotId === snapshot.id}
                      onChange={e => setSelectedSnapshotId(e.target.value)}
                    />
                    <label htmlFor={snapshot.id} className="flex-1 text-sm">
                      <strong>{snapshot.snapshotName || 'Unnamed'}</strong>
                      <br />
                      <small className="text-gray-600">
                        {new Date(snapshot.createdAt).toLocaleString()}
                      </small>
                    </label>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleRestoreSnapshot}
                disabled={!selectedSnapshotId || isSyncing}
                variant="secondary"
                className="w-full"
              >
                {isSyncing ? 'Restoring...' : 'Restore Selected Snapshot'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No snapshots yet. Create one to get started!
            </p>
          )}
        </div>
      </Card>

      {/* Manual Sync */}
      <Card className="p-4">
        <h3 className="font-bold mb-2">Manual Operations</h3>
        <div className="space-y-2">
          <Button
            onClick={syncWithServer}
            disabled={isSyncing}
            variant="outline"
            className="w-full"
          >
            {isSyncing ? 'Syncing...' : 'Manual Server Sync'}
          </Button>
        </div>
      </Card>

      {/* Usage Instructions */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-bold mb-2">How It Works</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Your session data is automatically saved every 30 seconds</li>
          <li>Close and reopen the browser - your state will be restored</li>
          <li>Create snapshots to save specific states you want to restore later</li>
          <li>Share data to all your active browser tabs/devices</li>
          <li>Open multiple tabs to test cross-tab synchronization</li>
        </ul>
      </Card>
    </div>
  );
}

// Example of using just the context reading hook
export function SessionContextDisplay() {
  const { sessionId, contextData } = useSessionRecovery();

  return (
    <div className="p-4">
      <h4>Current Session</h4>
      <p>ID: {sessionId}</p>
      <p>Theme: {(contextData.theme as string) || 'not set'}</p>
    </div>
  );
}

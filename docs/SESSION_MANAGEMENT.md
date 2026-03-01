# Session Management System

This document describes the comprehensive session management system for QuantFident, enabling session persistence, cross-session state sharing, and session recovery.

## Overview

The session management system provides three key capabilities:

1. **Session Persistence** - User session data and application state are automatically saved across browser restarts
2. **Cross-Session State Sharing** - Share data between concurrent sessions (multiple browser tabs, devices, etc.)
3. **Session Recovery** - Restore previous session states from snapshots

## Architecture

### Database Models

Three new Prisma models track sessions:

- **`UserSession`** - Tracks active and historical user sessions with device/browser info
- **`SessionContext`** - Stores session-specific UI state, preferences, and application data
- **`SessionSnapshot`** - Historical snapshots for session recovery (auto-expire after 30 days)

### Components

#### Server-Side (`src/lib/services/session-service.ts`)
- `SessionService` class with static methods for all session operations
- Database operations using Prisma
- Session creation, context management, snapshots, and cleanup

#### API Routes
- `POST /api/sessions` - Fetch all active sessions
- `POST /api/sessions/context` - Update/get session context
- `POST /api/sessions/snapshots` - Create/list snapshots
- `POST /api/sessions/snapshots/[id]/restore` - Restore from snapshot
- `POST /api/sessions/share` - Share context across all sessions

#### Client-Side (`src/lib/client/session-storage.ts`)
- IndexedDB and localStorage integration
- Session ID generation and management
- Local persistence and server sync
- Cross-tab communication via BroadcastChannel API

#### React Hook (`src/hooks/useSessionRecovery.ts`)
- `useSessionRecovery` - Complete session management hook
- `useSessionContext` - Simplified context reading hook

## Usage

### Basic Setup in Components

```tsx
'use client';

import { useSessionRecovery } from '@/hooks/useSessionRecovery';

export function MyComponent() {
  const {
    sessionId,
    contextData,
    isLoading,
    updateContext,
    createSnapshot,
    restoreSnapshot,
  } = useSessionRecovery({
    autoSaveInterval: 30000,      // Auto-save every 30 seconds
    restoreOnMount: true,          // Restore from local storage on mount
    syncWithServerOnMount: true,   // Sync with server on mount
  });

  if (isLoading) return <div>Loading session...</div>;

  return (
    <div>
      <p>Session ID: {sessionId}</p>
      <p>Saved state: {JSON.stringify(contextData)}</p>
    </div>
  );
}
```

### Updating Session State

```tsx
const { updateContext } = useSessionRecovery();

// Update context (automatically saves locally and syncs to server)
updateContext({
  currentPage: 'blog',
  userPreferences: { theme: 'dark' },
  lastScrollPosition: 500,
});
```

### Creating and Restoring Snapshots

```tsx
const { createSnapshot, restoreSnapshot, snapshots, loadSnapshots } = 
  useSessionRecovery();

// Create a named snapshot
const snapshotId = await createSnapshot('My Saved State');

// List available snapshots
await loadSnapshots();

// Restore from a snapshot
await restoreSnapshot(snapshotId);
```

### Cross-Session State Sharing

Share data between all user's active sessions (browser tabs, devices):

```tsx
const { shareContext } = useSessionRecovery();

// Updates all active sessions with this data
await shareContext('theme', 'dark');
await shareContext('notificationCount', 5);
```

### Listening to Storage Changes (Other Tabs)

```tsx
import { onSessionStorageChange } from '@/lib/client/session-storage';

useEffect(() => {
  const unsubscribe = onSessionStorageChange((data) => {
    console.log('Other tab updated:', data);
    // Update local state or UI
  });

  return unsubscribe;
}, []);
```

## API Reference

### SessionService (Server)

#### `createSession(input: CreateSessionInput)`
Creates a new user session with device information.

```typescript
const session = await SessionService.createSession({
  userId: 'user123',
  deviceName: 'Chrome on Windows',
  deviceType: 'desktop',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});
```

#### `getUserActiveSessions(userId: string)`
Retrieves all active sessions for a user.

```typescript
const sessions = await SessionService.getUserActiveSessions(userId);
```

#### `updateSessionContext(sessionId: string, contextData: SessionContextData)`
Updates session context data (merged with existing data).

```typescript
await SessionService.updateSessionContext(sessionId, {
  theme: 'dark',
  language: 'vi',
});
```

#### `createSessionSnapshot(userId: string, sessionId: string, snapshotData: SessionContextData, snapshotName?: string)`
Creates a snapshot for recovery.

```typescript
const snapshot = await SessionService.createSessionSnapshot(
  userId,
  sessionId,
  { page: 'blog', scrollPosition: 500 },
  'Before navigation' // Optional name
);
```

#### `getUserSessionSnapshots(userId: string, limit?: number)`
Retrieves recent snapshots for a user (auto-expire after 30 days).

```typescript
const snapshots = await SessionService.getUserSessionSnapshots(userId, 10);
```

#### `restoreFromSnapshot(snapshotId: string, userId: string)`
Restores data from a snapshot.

```typescript
const restored = await SessionService.restoreFromSnapshot(snapshotId, userId);
// Returns: { snapshotData, createdAt, snapshotName }
```

#### `shareContextAcrossSessions(userId: string, contextKey: string, contextValue: unknown)`
Updates context in all active user sessions.

```typescript
await SessionService.shareContextAcrossSessions(userId, 'theme', 'dark');
```

### Client Functions

#### Session ID Management
```typescript
import {
  getOrCreateSessionId,
  generateClientSessionId,
} from '@/lib/client/session-storage';

const sessionId = getOrCreateSessionId(); // Get or create persistent ID
const newId = generateClientSessionId();   // Generate new ID
```

#### Local Storage
```typescript
import {
  saveSessionContextLocal,
  loadSessionContextLocal,
  saveSnapshotLocal,
  loadSnapshotLocal,
} from '@/lib/client/session-storage';

// Save/load context locally (IndexedDB or localStorage)
await saveSessionContextLocal(sessionId, { theme: 'dark' });
const context = await loadSessionContextLocal(sessionId);

// Save/load snapshots locally
await saveSnapshotLocal(snapshotId, snapshotData);
```

#### Server Operations
```typescript
import {
  updateSessionContextServer,
  getSessionContextServer,
  createSnapshotServer,
  restoreSnapshotServer,
  listSnapshotsServer,
} from '@/lib/client/session-storage';

// Sync with server
await updateSessionContextServer(sessionId, { theme: 'dark' });
const context = await getSessionContextServer(sessionId);

// Snapshot operations
const snapshot = await createSnapshotServer(sessionId, data, 'My Snapshot');
const restored = await restoreSnapshotServer(snapshotId);
const list = await listSnapshotsServer(10);
```

#### Cross-Tab Communication
```typescript
import {
  broadcastSessionUpdate,
  onSessionStorageChange,
} from '@/lib/client/session-storage';

// Broadcast to other tabs
broadcastSessionUpdate('theme', 'dark');

// Listen for changes from other tabs
const unsubscribe = onSessionStorageChange((data) => {
  console.log('Update from other tab:', data);
});
```

## Database Schema

### UserSession
```prisma
model UserSession {
  id            String   @id @default(cuid())
  userId        String
  sessionId     String   @unique
  deviceName    String?
  deviceType    String?  // "desktop", "mobile", "tablet"
  ipAddress     String?
  userAgent     String?
  isActive      Boolean  @default(true)
  lastActivityAt DateTime @default(now()) @updatedAt
  createdAt     DateTime @default(now())
  expiresAt     DateTime
  
  context       SessionContext?
  snapshots     SessionSnapshot[]
}
```

### SessionContext
```prisma
model SessionContext {
  id           String   @id @default(cuid())
  userId       String
  sessionId    String   @unique
  contextData  Json     @default("{}")
  updatedAt    DateTime @updatedAt
  createdAt    DateTime @default(now())
}
```

### SessionSnapshot
```prisma
model SessionSnapshot {
  id           String   @id @default(cuid())
  userId       String
  sessionId    String?
  snapshotData Json     @default("{}")
  snapshotName String?
  createdAt    DateTime @default(now())
  expiresAt    DateTime @default(dbgenerated("now() + interval '30 days'"))
  isManual     Boolean  @default(false)
  source       String   @default("auto")
}
```

## Implementation Checklist

To implement session management in your application:

- [ ] Run Prisma migration: `npx prisma migrate dev --name add_session_models`
- [ ] Test API endpoints with Postman or curl
- [ ] Add `useSessionRecovery` hook to your main layout or app provider
- [ ] Update state management to use session context
- [ ] Test local persistence (reload page, data persists)
- [ ] Test cross-tab sync (open multiple browser tabs)
- [ ] Test snapshot creation and restoration
- [ ] Configure auto-save interval based on needs
- [ ] Set up session cleanup cron job (optional, auto-cleanup runs on demand)

## Configuration

### Auto-Save Interval
Adjust how often session context syncs to server:

```tsx
useSessionRecovery({
  autoSaveInterval: 60000, // 60 seconds (default: 30s)
})
```

Setting to `0` disables auto-save; manual `syncWithServer()` required.

### Snapshot Expiration
Snapshots auto-expire after 30 days. Modify in `schema.prisma`:

```prisma
expiresAt DateTime @default(dbgenerated("now() + interval '7 days'"))
```

### Local Storage Priority
The system tries IndexedDB first (better capacity), falls back to localStorage:
- IndexedDB: ~50MB per domain
- localStorage: ~5-10MB per domain

## Performance Considerations

1. **Large Context Objects** - Keep session context reasonably sized (< 1MB)
2. **Auto-Save Frequency** - Balance between data loss protection and server load
3. **Snapshot Cleanup** - Run manual cleanup periodically or via scheduled job
4. **Database Indexing** - Indexes on `userId` and `sessionId` are included

## Security Notes

- Session context is stored in user's browser (IndexedDB/localStorage)
- Sensitive data (passwords, tokens) should NOT be stored in context
- All server endpoints verify session cookie before responding
- X-Session-ID header sent by client is validated on server
- Snapshots expire automatically after 30 days

## Troubleshooting

### Snapshots Not Appearing
- Check browser's IndexedDB is enabled
- Verify expired snapshots are being deleted (call `SessionService.cleanupExpiredData()`)
- Check browser DevTools → Application → IndexedDB

### Cross-Tab Sync Not Working
- Verify BroadcastChannel API support (all modern browsers)
- Check localStorage events are firing (`onSessionStorageChange`)
- Ensure pages are from same origin

### Data Not Persisting After Reload
- Verify IndexedDB quota is not exceeded
- Check localStorage is enabled in browser
- Verify session ID is being set (`getOrCreateSessionId()`)
- Check network tab for failed API calls

## Future Enhancements

- [ ] Encryption for sensitive context data
- [ ] Session sharing between users (collaborative sessions)
- [ ] Real-time sync using WebSocket
- [ ] Advanced conflict resolution for concurrent updates
- [ ] Session analytics and audit logs
- [ ] Mobile app session sync

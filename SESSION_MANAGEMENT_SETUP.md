# Session Management System Implementation Guide

## What Was Implemented

I've created a comprehensive session management system for your QuantFident codespace that enables:

### ✅ 1. Session Persistence
- Automatically save user session data (UI state, preferences, context) 
- Data persists across browser restarts and window closures
- Dual storage: IndexedDB (primary, ~50MB) with localStorage fallback (~5-10MB)
- 30-second auto-save interval (configurable)

### ✅ 2. Cross-Session State Sharing  
- Share data between concurrent sessions (browser tabs, devices)
- Real-time updates across tabs using BroadcastChannel API
- Server-side coordination for multi-device sync
- Share specific context keys with all active sessions

### ✅ 3. Session Recovery
- Create named snapshots of session state at any time
- Restore from previous snapshots (30-day retention)
- Automatic snapshot creation (can be queried later)
- One-click session restoration

## Architecture Overview

### Database Layer
**3 New Prisma Models:**
- `UserSession` - Tracks individual sessions with device info
- `SessionContext` - JSON storage for session state
- `SessionSnapshot` - Historical snapshots for recovery

### Server Layer  
**Server-Side Service** (`src/lib/services/session-service.ts`)
- `SessionService` class with comprehensive session management
- Database operations via Prisma
- Server-side session validation and context merging

**API Endpoints**
- `GET /api/sessions` - List user's active sessions
- `GET|POST /api/sessions/context` - Get/update session context
- `GET|POST /api/sessions/snapshots` - List/create snapshots  
- `POST /api/sessions/snapshots/[id]/restore` - Restore snapshot
- `POST /api/sessions/share` - Share context to all sessions

### Client Layer
**Storage Utilities** (`src/lib/client/session-storage.ts`)
- IndexedDB/localStorage management
- Session ID generation and persistence
- Server sync functions
- Cross-tab communication (BroadcastChannel)

**React Hook** (`src/hooks/useSessionRecovery.ts`)
- `useSessionRecovery()` - Complete session management
- `useSessionContext()` - Simple context reading
- Auto-save, error handling, state management

## Files Created

```
src/
├── lib/
│   ├── services/
│   │   └── session-service.ts          # Core session service
│   └── client/
│       └── session-storage.ts          # Client-side storage utilities
├── hooks/
│   └── useSessionRecovery.ts           # React session recovery hook
├── components/examples/
│   └── SessionRecoveryExample.tsx      # Example implementation
└── app/api/sessions/
    ├── route.ts                        # List sessions
    ├── context/route.ts                # Get/update context
    ├── share/route.ts                  # Share context
    └── snapshots/
        ├── route.ts                    # List/create snapshots
        └── [id]/
            └── restore/route.ts        # Restore snapshot

prisma/
└── schema.prisma                       # Updated with 3 new models

docs/
└── SESSION_MANAGEMENT.md               # Comprehensive documentation

scripts/
└── setup-session-management.sh         # Setup script
```

## Quick Start

### 1. Run Database Migration
```bash
npx prisma migrate dev --name add_session_models
```

### 2. Use Session Recovery Hook in Your Components
```tsx
'use client';

import { useSessionRecovery } from '@/hooks/useSessionRecovery';

export function YourComponent() {
  const {
    contextData,
    updateContext,
    createSnapshot,
    restoreSnapshot,
  } = useSessionRecovery();

  return (
    // Your component using contextData and update functions
  );
}
```

### 3. Update State (Auto-Saves)
```tsx
updateContext({
  currentPage: 'blog',
  userTheme: 'dark',
  scrollPosition: 500,
});
```

### 4. Create & Restore Snapshots
```tsx
// Save current state
const snapshotId = await createSnapshot('Before navigation');

// Later, restore it
await restoreSnapshot(snapshotId);
```

## Key Features

### 🔄 Automatic Persistence
- Session context auto-saves every 30 seconds
- Survives browser restarts
- Configurable save interval

### 📱 Cross-Tab Sync  
```tsx
// Share data with all tabs
await shareContext('theme', 'dark');

// Listen for changes from other tabs
onSessionStorageChange((data) => {
  setLocalState(data);
});
```

### 📸 Snapshot Management
```tsx
const snapshots = await listSnapshotsServer(10);
// Returns: [{ id, snapshotName, createdAt, source }, ...]

const restored = await restoreSnapshotServer(snapshotId);
// Returns: { snapshotData, createdAt, snapshotName }
```

### 🔐 Security
- Session validation via existing auth system
- Sensitive data NOT stored in context
- Auto-expiring snapshots (30 days)
- HTTPS cookies for production

## Usage Examples

### Example 1: Chat Application
```tsx
const { contextData, updateContext, createSnapshot } = useSessionRecovery({
  autoSaveInterval: 5000, // Save every 5 seconds
});

// Save chat state
useEffect(() => {
  updateContext({
    currentChat: chatId,
    messages: messages.slice(-100), // Last 100 messages
    unreadCount: unreadCount,
  });
}, [chatId, messages, unreadCount]);
```

### Example 2: Form State Recovery
```tsx
const { contextData, updateContext } = useSessionRecovery();

// Load saved form data
const formData = contextData.formData || {};

// Auto-save form as user types
const handleChange = (e) => {
  setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  updateContext({ formData: { ...formData, [e.target.name]: e.target.value } });
};
```

### Example 3: Multi-Device Sync
```tsx
const { shareContext } = useSessionRecovery();

// User changes theme on phone
await shareContext('theme', 'dark');

// All desktop tabs automatically update
useEffect(() => {
  const unsub = onSessionStorageChange((data) => {
    if (data.theme) setTheme(data.theme);
  });
  return unsub;
}, []);
```

## Configuration Options

```tsx
useSessionRecovery({
  // Auto-save interval in milliseconds (0 to disable)
  autoSaveInterval: 30000,
  
  // Restore from local storage on mount
  restoreOnMount: true,
  
  // Sync with server on mount  
  syncWithServerOnMount: true,
  
  // Restore from specific snapshot on mount
  initialSnapshotId: 'snapshot_123',
})
```

## API Reference

### SessionService Methods

| Method | Purpose |
|--------|---------|
| `createSession()` | Create new user session |
| `getUserActiveSessions()` | Fetch all active sessions |
| `updateSessionContext()` | Update session state |
| `createSessionSnapshot()` | Save state snapshot |
| `restoreFromSnapshot()` | Load from snapshot |
| `shareContextAcrossSessions()` | Update all user sessions |
| `cleanupExpiredData()` | Remove old snapshots |

### Client Storage Methods

| Method | Purpose |
|--------|---------|
| `getOrCreateSessionId()` | Get/create browser session ID |
| `saveSessionContextLocal()` | Save to IndexedDB/localStorage |
| `loadSessionContextLocal()` | Load from local storage |
| `updateSessionContextServer()` | Sync to server |
| `getSessionContextServer()` | Fetch from server |
| `createSnapshotServer()` | Create server snapshot |
| `broadcastSessionUpdate()` | Notify other tabs |

## Performance Considerations

- **Context Size**: Keep < 1MB (avoid storing large objects)
- **Auto-Save Frequency**: 30s default; increase for less bandwidth
- **Snapshot Limit**: 10 snapshots recommended per user
- **IndexedDB**: ~50MB per domain, plenty for typical use

## Troubleshooting

### Sessions Not Persisting
1. Check browser's IndexedDB is enabled
2. Verify Session ID: `localStorage.getItem('quantfident_session_id')`
3. Check browser DevTools → Application → Storage

### Cross-Tab Sync Not Working
1. Verify BroadcastChannel API: `new BroadcastChannel('test')`
2. Check localStorage events firing: `onSessionStorageChange()`
3. Ensure same origin (localhost:3000 not localhost:3001)

### Build Errors
```bash
# Regenerate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

## Next Steps

1. **Run migration**: `npx prisma migrate dev --name add_session_models`
2. **Test API endpoints**: Use Postman or curl
3. **Add hook to components**: Start with one component
4. **Configure auto-save**: Adjust interval based on needs
5. **Test persistence**: Close/reopen browser
6. **Test snapshots**: Create and restore in different scenarios

## Advanced Features (Future)

- Encryption for sensitive context data
- Real-time sync via WebSocket
- Session sharing between users
- Conflict resolution for concurrent updates
- Session analytics and audit logs
- Mobile app sync support

## Documentation Reference

See `docs/SESSION_MANAGEMENT.md` for:
- Complete API documentation
- Database schema details
- Security considerations
- Configuration options
- Advanced usage patterns

## Support & Integration

The session management system integrates with your existing:
- ✅ Firebase authentication
- ✅ Prisma database
- ✅ Next.js API routes
- ✅ React components

No breaking changes to existing code!

---

**Status**: ✅ Ready to use after running Prisma migration

**Questions?** Refer to `docs/SESSION_MANAGEMENT.md` or check the example component at `src/components/examples/SessionRecoveryExample.tsx`

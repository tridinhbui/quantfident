# Session Management Quick Reference

## 🚀 Implementation Summary

I've built a complete session management system with three key capabilities:

### What You Get

| Feature | Capability |
|---------|-----------|
| **Session Persistence** | Auto-save user state across browser restarts (30s interval) |
| **Cross-Session Sharing** | Share data between browser tabs, devices, concurrent sessions |
| **Session Recovery** | Create snapshots, restore previous states (30-day retention) |

## 📁 Files Created

- **Database Service**: `src/lib/services/session-service.ts`
- **Client Utilities**: `src/lib/client/session-storage.ts`
- **React Hook**: `src/hooks/useSessionRecovery.ts`
- **API Endpoints**: `src/app/api/sessions/*` (5 routes)
- **Example Component**: `src/components/examples/SessionRecoveryExample.tsx`
- **Documentation**: `docs/SESSION_MANAGEMENT.md`

## 🔧 Next Steps

### Step 1: Run Database Migration
```bash
npx prisma migrate dev --name add_session_models
```

### Step 2: Use in Your Components
```tsx
'use client';
import { useSessionRecovery } from '@/hooks/useSessionRecovery';

export function MyComponent() {
  const { contextData, updateContext } = useSessionRecovery();
  
  // Auto-saves every 30 seconds
  const handleUpdate = () => {
    updateContext({ myData: 'value' });
  };
  
  return <div>Session: {JSON.stringify(contextData)}</div>;
}
```

### Step 3: Test
- Open app, change state, reload → data persists ✓
- Open 2 tabs: call `shareContext('key', 'value')` → updates both tabs ✓
- Create snapshot: `createSnapshot('name')` → restore later ✓

## 💡 Common Usage Patterns

### Save Form State
```tsx
const { contextData, updateContext } = useSessionRecovery();

useEffect(() => {
  updateContext({ formData });
}, [formData]);

// User closes browser, reopens, formData is restored
```

### Sync Theme Across Devices
```tsx
const { shareContext } = useSessionRecovery();

await shareContext('theme', 'dark');
// All user's active sessions get updated
```

### Create Recovery Point
```tsx
const snapshotId = await createSnapshot('Before complex operation');
// Later, restore if needed:
await restoreSnapshot(snapshotId);
```

### Listen for Other Tab Changes
```tsx
useEffect(() => {
  const unsubscribe = onSessionStorageChange((data) => {
    // Another tab updated data
    setLocalState(data);
  });
  return unsubscribe;
}, []);
```

## 🔌 API Endpoints

```
GET  /api/sessions                    # List your sessions
GET  /api/sessions/context            # Get session context
POST /api/sessions/context            # Update context
GET  /api/sessions/snapshots          # List snapshots
POST /api/sessions/snapshots          # Create snapshot
POST /api/sessions/snapshots/[id]/restore  # Restore snapshot
POST /api/sessions/share              # Share to all sessions
```

## ⚙️ Configuration

```tsx
useSessionRecovery({
  autoSaveInterval: 30000,        // Save every 30s (default)
  restoreOnMount: true,            // Restore saved state on load
  syncWithServerOnMount: true,     // Sync with server
})
```

## 🔒 Security Notes

✅ Your server validates all requests via existing auth
✅ Session cookies protect against unauthorized access
✅ Snapshots auto-expire after 30 days
⚠️ Don't store passwords/tokens in context

## 📊 Storage Limits

| Type | Limit | Fallback |
|------|-------|----------|
| IndexedDB | ~50MB | localStorage |
| localStorage | ~5-10MB | None |

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Data not persisting | Check localStorage: `localStorage.getItem('quantfident_session_id')` |
| Cross-tab sync not working | Ensure same origin (localhost:3000, not :3001) |
| Build error | Run `npx prisma generate` |
| Migration failed | Check DATABASE_URL in .env |

## 📚 Detailed Docs

👉 See `docs/SESSION_MANAGEMENT.md` for complete API reference

## 🧪 Test Implementation

Run the example component to see it in action:

```tsx
import { SessionRecoveryExample } from '@/components/examples/SessionRecoveryExample';

export default function TestPage() {
  return <SessionRecoveryExample />;
}
```

## ✨ What's Automatic

- ✅ Auto-save every 30 seconds
- ✅ Auto-restore on page reload
- ✅ Auto-expire snapshots after 30 days
- ✅ Auto-cleanup expired data
- ✅ Auto-sync across tabs via BroadcastChannel

## 🎯 Quick Stats

- **3 database models** added
- **5 API endpoints** ready
- **100+ lines** of client utilities
- **2 React hooks** for easy use
- **Zero breaking changes** to existing code

---

**Ready?** Run `npx prisma migrate dev --name add_session_models` and start using `useSessionRecovery()` in your components!

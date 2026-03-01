# Auth Enforcement Strategy: Firebase Sessions + Supabase Server-Side Writes

## Overview
QuantFident uses **Firebase Authentication** for identity (Google Sign-In) and **server-side Supabase writes** for data mutation. This hybrid approach simplifies implementation and avoids complex multi-auth schemes.

## Current Architecture

### Client-Side Auth
- **Provider**: Firebase Authentication (Google Sign-In only)
- **Session**: HTTP-only `quantfident_session` cookie (set via `/api/auth/session-login`)
- **Cookie Lifetime**: 5 days (configurable via `SESSION_MAX_AGE_MS` in `server-auth.ts`)
- **Validation**: `verifySessionCookie()` decodes and validates via Firebase Admin SDK

### Server-Side Auth
- **Supabase Credentials**: Service role key (trusted server-only)
- **Write Pattern**: All Supabase mutations (likes, comments, avatar, etc.) are **server-initiated**
- **User Context**: Extracted from Firebase session cookie, passed explicitly to Supabase via payload
- **RLS Enforcement**: Database rows are constrained by `user_id` columns; application code enforces ownership checks

---

## Why Server-Side Writes? (Not Direct Supabase Auth)

### Option A: Server-Side Writes (Current ✅)
**Pros:**
- Single sign-in method (Google → Firebase)
- Session cookie provides UX familiarity (session logout = browser session logout)
- Clear boundary: API server is the only Supabase client
- Easier to debug: server logs contain full context
- No need to sync two separate auth systems
- All rate limiting and audit logging happen server-side

**Cons:**
- No realtime subscriptions from browser (yet; this is optional in P2)
- Slightly more API calls (browser → server → Supabase vs direct)

### Option B: Direct Supabase Auth JWT (Not Chosen)
**Pros:**
- Native browser subscriptions (realtime)
- Reduced server load (direct writes)

**Cons:**
- Requires Supabase Sign-Up UI (adds auth management burden)
- Two auth systems (Firebase + Supabase) risk drift/confusion
- RLS policies become the only security gate (higher risk for misconfiguration)
- Signing out is fragmented (Firebase logout ≠ Supabase state)
- Complex credential refresh on browser

---

## RLS Policies: What They Protect

The RLS policies in `002_rls_policies.sql` assume all **dangerous writes happen via service role** (i.e., the server). They are **not actively protecting client-side writes** because client writes don't exist in this model.

### Example: Likes Table

```sql
-- Allow users to read all likes (public information)
create policy "likes_select_all"
  on public.likes for select
  to authenticated
  using (true);

-- Prevent direct client deletes; server enforces ownership
-- (This policy is defensive in case RLS is misconfigured)
create policy "likes_delete_own"
  on public.likes for delete
  to authenticated
  using (auth.uid()::text = user_id);
```

**In practice:**
- Client **cannot** directly INSERT/UPDATE/DELETE via Supabase SDK (Firebase ≠ Supabase Auth)
- Server INSERT via service role: `postLike()` in `/api/likes` validates session + ownership, then inserts
- RLS is a **defense-in-depth** layer, not the primary gate

---

## When to Reconsider This Strategy

Migrate to Supabase Auth (Option B) if:

1. **Realtime subscriptions become core** (e.g., live comment streams, user-facing notifications)
2. **Offline-first client apps** (React Native, Flutter) require direct API access
3. **Server-side request volume** exceeds sustainable scaling (very high user count)
4. **Session duration** conflicts with OAuth token lifetimes

Migrating is possible because:
- Tables already have `user_id` columns suitable for RLS
- Policies are already in place
- Add Supabase Sign-Up UI alongside Firebase
- Replace server write validation with RLS policy validation
- Update clients to authenticate with Supabase JWT

**For now**: Focus on P0 → P1 with server-side writes. Revisit in P2 only if realtime is critical.

---

## Implementation Checklist

### On Each API That Writes to Supabase

- [ ] Extract Firebase session from `request.cookies`
- [ ] Call `verifySessionCookie(cookie, checkRevoked=true)`
- [ ] Get user ID from verified session
- [ ] Use `getSupabaseServer()` (service role, never export to browser)
- [ ] Include `user_id` explicitly in INSERT/UPDATE payload
- [ ] Return error if user is not authenticated (401)
- [ ] Log mutation with user ID for audit trail

### Example (From `/api/likes`)

```typescript
export async function POST(request: NextRequest) {
  // 1. Get session
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return jsonError('Authentication required', 401, 'likes_auth_required');
  }

  // 2. Verify session → get user
  const user = await verifySessionCookie(sessionCookie, true);
  if (!user) {
    return jsonError('Invalid session', 401, 'session_invalid');
  }

  // 3. Use server Supabase client
  const supabaseServer = getSupabaseServer();

  // 4. Perform mutation with explicit user_id
  const { data, error } = await supabaseServer
    .from('likes')
    .insert({ post_id: postId, user_id: user.uid });

  if (error) {
    console.error('Like insert failed:', error);
    return jsonError('Failed to save like', 500, 'like_save_failed');
  }

  return NextResponse.json({ liked: true, totalLikes });
}
```

---

## Testing Verification

| Scenario | Expected | Notes |
|----------|----------|-------|
| Unauthenticated POST /api/likes | 401 | Session cookie missing |
| Authenticated POST /api/likes (first time) | Insert succeeds, liked=true | User ID from session |
| Authenticated POST /api/likes (second time) | Delete succeeds, liked=false | Toggle behavior |
| GET /api/likes (unauthenticated) | Shows totalLikes, liked=false | Public read allowed |
| User A directly tries to insert into likes with User B's ID (via RLS) | Fails (no path in RLS) | Server is sole writer |

---

## Future: Realtime Without Direct Client Writes

Option for P2: Keep server writes but add **read subscriptions** for realtime counters:

```typescript
// Browser can listen to like count changes without direct write access
const subscription = supabaseClient
  .from('likes')
  .on('*', (payload) => {
    // Update UI with like count
  })
  .subscribe();
```

This provides realtime UX without exposing write paths to clients.

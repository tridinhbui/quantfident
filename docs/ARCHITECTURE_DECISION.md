# Architecture Decision: Hybrid Prisma + Supabase

Date: 2026-02-12
Status: Accepted

## Context
The current blog core uses Prisma/Postgres for CRUD and admin workflows. Auth is already modernized around Firebase Google Sign-In and server session cookies. Planned collaborative features (likes, comments, version history, avatar storage) need row-level security (RLS) and realtime-friendly behavior that fit Supabase well.

A full migration from Prisma/Postgres to Supabase would be high-risk and slow delivery. We need a low-risk path that preserves existing admin features while enabling new social features quickly.

## Decision
Adopt a hybrid strategy:
- Keep Prisma/Postgres as the source of truth for current blog core CRUD and admin operations.
- Introduce Supabase as the backend for new collaborative and realtime-centric features (likes, comments, version history, avatar storage).

## Scope and Boundaries
- Prisma scope: blog posts CRUD, admin workflows, existing analytics fields (views, likes counters if present).
- Supabase scope: likes, comments, version history, profiles, avatar storage, realtime counters.
- Auth: Firebase remains the primary identity provider; session cookies are the server-side access gate.

## Security
- Middleware provides UX gating only and must not be the sole enforcement layer.
- API handlers and Supabase RLS policies enforce actual authorization rules.

## Migration Trigger (Future)
A full migration to Supabase for blog core may be considered if any of the following occur:
- Realtime collaboration becomes a core admin requirement.
- Prisma schema maintenance becomes a blocker for feature velocity.
- Operational overhead for dual data paths exceeds expected effort.

## Risks and Mitigations
- Dual data paths: keep ownership boundaries explicit and documented.
- Inconsistent counters: prefer Supabase as the source for likes/comments counts; keep Prisma likes counter optional or sync periodically.
- Auth drift: document expected session flow and ensure all new features use the same session cookie checks and RLS policies.

## Next Steps
- Add middleware route protection for admin paths (UX gating).
- Scaffold Supabase SDK clients (server and client modules).
- Implement likes toggle API and UI against Supabase tables.

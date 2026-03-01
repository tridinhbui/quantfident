# Supabase Setup (P1)

This repo uses Supabase for social and realtime-centric features (likes, comments, version history, avatar storage).
Apply the SQL migrations in order and then configure the env variables.

## SQL Migrations
1. Run [supabase/migrations/001_social_tables.sql](../../supabase/migrations/001_social_tables.sql)
2. Run [supabase/migrations/002_rls_policies.sql](../../supabase/migrations/002_rls_policies.sql)
3. Run [supabase/migrations/003_storage.sql](../../supabase/migrations/003_storage.sql)

## Env Vars (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

See the environment matrix in [docs/public/ENVIRONMENT.md](ENVIRONMENT.md) for Local/Preview/Prod guidance.

## Verification Checklist
1. Confirm tables exist: `profiles`, `likes`, `comments`, `post_versions`.
2. Confirm RLS is enabled on all four tables.
3. Confirm bucket exists: `avatars`.
4. Confirm policies are attached:
	- `likes_*` select/insert/delete
	- `comments_*` select/insert/update/delete
	- `profiles_*` select/modify
	- `post_versions_*` admin only
	- `avatars_*` storage policies
5. Run the smoke script locally:
	```bash
	NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/supabase-smoke.js
	```
6. Validate like toggle:
	- Authenticated user can like/unlike a post (second click unlikes).
	- Anonymous user gets 401 from `POST /api/likes`.
	- `GET /api/likes?postId=...` returns counts without auth.
7. Optional admin smoke for new endpoints:
	- `GET /api/comments?postId=...` (requires admin token)
	- `GET /api/history/{postId}` (requires admin token)

## Notes
- RLS policies assume Supabase Auth for client writes. If Firebase-only auth is used for client writes, keep client operations read-only and perform writes via server APIs with the service role key.
- The avatars bucket expects object paths prefixed with the authenticated user id.

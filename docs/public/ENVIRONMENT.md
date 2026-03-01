# Environment Matrix

This project uses separate environment variables for Local, Preview, and Production. Do not commit secrets.

## Local (Development)
Set in `.env.local` (not committed).

Required:
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL` (optional)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Vercel Preview
Set in Vercel Project Settings → Environment Variables (Preview).

Recommended:
- Use Preview-specific Firebase + Supabase projects if possible.
- Ensure `NEXT_PUBLIC_SITE_URL` points to the preview domain.

## Vercel Production
Set in Vercel Project Settings → Environment Variables (Production).

Recommended:
- Use production Firebase + Supabase projects.
- Ensure `NEXT_PUBLIC_SITE_URL` is the canonical domain.
- Rotate service role keys on a schedule.

## Verification
- `GET /api/auth/me` returns authenticated user when logged in.
- `POST /api/likes` returns 401 when not logged in.
- `GET /api/likes?postId=...` returns counts without auth.
- Admin-only routes under `/admin/*` redirect without session cookie.
- `GET /api/comments?postId=...` requires admin bearer token.
- `GET /api/history/{postId}` requires admin bearer token.
- `POST /api/history/{postId}/revert` requires admin bearer token and a `versionId` body.

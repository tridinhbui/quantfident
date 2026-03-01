-- Row Level Security policies
-- NOTE: These assume Supabase Auth. If you use Firebase-only auth for client writes,
-- rely on server-side service role calls and keep strict RLS for public access.
--
-- PERFORMANCE: All auth function calls use (select auth.<fn>()) pattern to avoid
-- per-row re-evaluation. See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.post_versions enable row level security;

-- Profiles: Public read, owner-only write
-- Split into separate policies to avoid multiple permissive SELECT policies
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check ((select auth.uid())::text = id);

create policy "profiles_update_own"
  on public.profiles for update
  using ((select auth.uid())::text = id)
  with check ((select auth.uid())::text = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using ((select auth.uid())::text = id);

-- Likes: Public read, owner insert/delete
create policy "likes_select_public"
  on public.likes for select
  using (true);

create policy "likes_insert_own"
  on public.likes for insert
  with check ((select auth.uid())::text = user_id);

create policy "likes_delete_own"
  on public.likes for delete
  using ((select auth.uid())::text = user_id);

-- Comments: Public read, owner CRUD
create policy "comments_select_public"
  on public.comments for select
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  with check ((select auth.uid())::text = user_id);

create policy "comments_update_own"
  on public.comments for update
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

create policy "comments_delete_own"
  on public.comments for delete
  using ((select auth.uid())::text = user_id);

-- Post versions (admin/server only; keep RLS strict)
create policy "post_versions_select_admin"
  on public.post_versions for select
  using ((select auth.role()) = 'service_role');

create policy "post_versions_insert_admin"
  on public.post_versions for insert
  with check ((select auth.role()) = 'service_role');

create policy "post_versions_update_admin"
  on public.post_versions for update
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "post_versions_delete_admin"
  on public.post_versions for delete
  using ((select auth.role()) = 'service_role');

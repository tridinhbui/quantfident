-- Migration: Fix RLS policy performance warnings
-- Addresses: auth_rls_initplan and multiple_permissive_policies linter warnings
-- 
-- Changes:
-- 1. Wrap auth.uid() and auth.role() in (select ...) to avoid per-row re-evaluation
-- 2. Replace profiles_modify_own (for all) with separate INSERT/UPDATE/DELETE policies
--    to avoid multiple permissive SELECT policies overlap
--
-- Run this on existing Supabase instances that applied 002_rls_policies.sql

-- Drop existing policies first
drop policy if exists "profiles_modify_own" on public.profiles;
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

drop policy if exists "likes_select_public" on public.likes;
drop policy if exists "likes_insert_own" on public.likes;
drop policy if exists "likes_delete_own" on public.likes;

drop policy if exists "comments_select_public" on public.comments;
drop policy if exists "comments_insert_own" on public.comments;
drop policy if exists "comments_update_own" on public.comments;
drop policy if exists "comments_delete_own" on public.comments;

drop policy if exists "post_versions_select_admin" on public.post_versions;
drop policy if exists "post_versions_insert_admin" on public.post_versions;
drop policy if exists "post_versions_update_admin" on public.post_versions;
drop policy if exists "post_versions_delete_admin" on public.post_versions;

-- Recreate policies with (select auth.<fn>()) pattern for performance

-- Profiles: Public read, owner-only write (separate policies to avoid overlap)
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

-- Post versions (admin/server only)
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

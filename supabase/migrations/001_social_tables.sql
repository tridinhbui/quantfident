-- Social tables for likes, comments, profiles, and post versions
-- Apply in Supabase SQL editor or via migrations tool.

create table if not exists public.profiles (
  id text primary key,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id text not null,
  user_id text not null,
  created_at timestamptz not null default now(),
  constraint likes_unique_user_post unique (user_id, post_id)
);

create index if not exists likes_post_id_idx on public.likes (post_id);
create index if not exists likes_user_id_idx on public.likes (user_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id text not null,
  user_id text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments (post_id, created_at);
create index if not exists comments_user_id_idx on public.comments (user_id);

create table if not exists public.post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id text not null,
  editor_id text not null,
  title text not null,
  content text not null,
  excerpt text,
  created_at timestamptz not null default now()
);

create index if not exists post_versions_post_id_idx on public.post_versions (post_id, created_at);
create index if not exists post_versions_editor_id_idx on public.post_versions (editor_id);

create extension if not exists pgcrypto;
create table if not exists public.users (
 id uuid primary key default gen_random_uuid(), email text not null unique,
 password_hash text not null, created_at timestamptz not null default now()
);
create table if not exists public.refresh_tokens (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
 token_hash text not null, jti text not null unique, expires_at timestamptz not null, revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists refresh_tokens_user_idx on public.refresh_tokens(user_id);
create table if not exists public.urls (
 id uuid primary key default gen_random_uuid(), code varchar(32) not null unique,
 original_url text not null, owner_id uuid not null references public.users(id) on delete cascade,
 expires_at timestamptz, password_hash text, total_clicks bigint not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists urls_owner_created_idx on public.urls(owner_id,created_at desc);
create table if not exists public.clicks (
 id bigint generated always as identity primary key, url_id uuid not null references public.urls(id) on delete cascade,
 timestamp timestamptz not null default now(), country text, device text, browser text, os text, referrer text, ip_hash text
);
create index if not exists clicks_url_timestamp_idx on public.clicks(url_id,timestamp desc);
create index if not exists clicks_timestamp_idx on public.clicks(timestamp desc);
-- API uses the Supabase service-role key only on the server. Do not ship it to clients.

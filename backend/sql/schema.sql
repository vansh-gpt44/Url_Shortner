CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    jti TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx
    ON public.refresh_tokens (user_id);

CREATE TABLE IF NOT EXISTS public.urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    password_hash TEXT,
    total_clicks BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS urls_owner_created_idx
    ON public.urls (owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.clicks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    url_id UUID NOT NULL REFERENCES public.urls (id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    country TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    referrer TEXT,
    ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS clicks_url_timestamp_idx
    ON public.clicks (url_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS clicks_timestamp_idx
    ON public.clicks (timestamp DESC);

-- API uses the Supabase service-role key only on the server. Do not ship it to clients.

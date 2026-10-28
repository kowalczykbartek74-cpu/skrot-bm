-- Atrapa Supabase do testów lokalnych (PostgreSQL 16 albo PGlite). Nigdy nie uruchamiaj na produkcji.
-- Kolejność: stub.sql → wszystkie pliki z supabase/ (kolejność z README) → skrot-v13-gry.sql (dwa razy) → test/v13.sql.
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth; create schema extensions; create extension if not exists pgcrypto schema extensions;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', last_sign_in_at timestamptz, created_at timestamptz default now());
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
grant usage on schema auth to anon, authenticated; grant execute on all functions in schema auth to anon, authenticated;
grant usage on schema public, extensions to anon, authenticated;

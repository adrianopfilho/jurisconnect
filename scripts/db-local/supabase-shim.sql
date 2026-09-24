-- =============================================================================
-- SHIM LOCAL DO SUPABASE — SOMENTE PARA TESTES pgTAP FORA DO SUPABASE CLI
-- =============================================================================
-- Reproduz o mínimo do ambiente Supabase num Postgres puro (sem Docker):
--   * papéis anon, authenticated e service_role
--   * schemas auth e extensions
--   * auth.users (mínima) e as funções auth.uid(), auth.role(), auth.jwt()
--   * privilégios padrão do schema public iguais aos do Supabase
--
-- ATENÇÃO: este arquivo NUNCA deve ser copiado para supabase/migrations.
-- No Supabase real, o schema auth pertence ao serviço GoTrue e já existe.
-- scripts/check-migrations.mjs falha se alguma migration tentar recriá-lo.
-- Fluxo oficial de testes: `supabase test db`.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

create schema if not exists extensions;
create schema if not exists auth;

grant usage on schema public, extensions, auth to anon, authenticated, service_role;

-- Tabela mínima de usuários (o Supabase real tem muitas outras colunas).
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  email_confirmed_at timestamptz,
  banned_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on auth.users to service_role;

-- Mesmas assinaturas das funções do Supabase: leem as claims do JWT da sessão
-- (em testes: set local request.jwt.claims = '{"sub": "...", "role": "authenticated"}').
create or replace function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

grant execute on function auth.jwt(), auth.uid(), auth.role() to anon, authenticated, service_role;

-- Privilégios padrão do Supabase: tabelas novas no schema public ficam
-- acessíveis a anon/authenticated e a proteção real é feita por RLS.
-- Reproduzir isso é essencial para que os testes de RLS sejam realistas.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- search_path igual ao do Supabase (funções do pgTAP ficam em "extensions").
do $$
begin
  execute format('alter database %I set search_path = "$user", public, extensions', current_database());
end
$$;

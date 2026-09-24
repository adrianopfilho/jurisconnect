-- =============================================================================
-- Fase 1 · Núcleo multi-tenant: escritórios, perfis, vínculos e funções de acesso
-- =============================================================================
-- Princípios:
--  * Toda autorização é derivada de public.tenant_members (e não de claims do
--    JWT), para que desativar um membro corte o acesso imediatamente.
--  * O "escritório ativo" do usuário fica em profiles.active_tenant_id e só pode
--    ser alterado por public.set_active_tenant(), que valida o vínculo.
--  * Perfis admin e lawyer só têm acesso ao escritório com sessão MFA (aal2).
--  * Não há DELETE em nenhuma tabela: desativação/soft delete.
--  * Privilégios de tabela são revogados e concedidos explicitamente, pois o
--    Supabase concede ALL por padrão a anon/authenticated no schema public.
-- =============================================================================

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'lawyer', 'intern', 'finance', 'reception', 'dpo', 'client');
create type public.member_status as enum ('active', 'disabled');

-- -----------------------------------------------------------------------------
-- Utilitário: updated_at
-- -----------------------------------------------------------------------------
create function private.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- tenants (escritórios)
-- -----------------------------------------------------------------------------
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  cnpj text check (cnpj ~ '^[0-9]{14}$'),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id),
  constraint tenants_deleted_consistency check ((deleted_at is null) = (deleted_by is null))
);

comment on table public.tenants is 'Escritórios (tenants). Exclusão somente lógica.';

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- profiles (dados do usuário, independentes de escritório)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  email text not null,
  phone text check (phone ~ '^[0-9]{10,11}$'),
  oab_number text check (oab_number ~ '^[0-9]{1,7}$'),
  oab_state char(2) check (oab_state ~ '^[A-Z]{2}$'),
  active_tenant_id uuid references public.tenants (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_key on public.profiles (lower(email));

comment on table public.profiles is 'Perfil pessoal do usuário. active_tenant_id só muda via set_active_tenant().';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- tenant_members (vínculo usuário × escritório, com perfil de acesso)
-- -----------------------------------------------------------------------------
create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  user_id uuid not null references auth.users (id) on delete restrict,
  role public.app_role not null,
  status public.member_status not null default 'active',
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  disabled_at timestamptz,
  disabled_by uuid references auth.users (id),
  constraint tenant_members_unique unique (tenant_id, user_id),
  constraint tenant_members_disabled_consistency
    check ((status = 'disabled') = (disabled_at is not null))
);

create index tenant_members_user_idx on public.tenant_members (user_id);

comment on table public.tenant_members is 'Vínculos e perfis de acesso. Membros são desativados, nunca excluídos.';

create trigger tenant_members_set_updated_at
  before update on public.tenant_members
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Funções de contexto de acesso (usadas pelas políticas RLS)
-- -----------------------------------------------------------------------------
create function private.role_requires_mfa(p_role public.app_role) returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_role in ('admin'::public.app_role, 'lawyer'::public.app_role)
$$;

create function private.session_aal() returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1')
$$;

-- Vínculo ativo do usuário no escritório ativo. Vazio quando: sem escritório
-- ativo, vínculo desativado, escritório excluído ou perfil exige MFA e a sessão
-- não é aal2.
create function private.current_membership()
returns table (tenant_id uuid, role public.app_role)
language sql
stable
security definer
set search_path = ''
as $$
  select m.tenant_id, m.role
    from public.profiles p
    join public.tenant_members m
      on m.tenant_id = p.active_tenant_id
     and m.user_id = p.id
     and m.status = 'active'
    join public.tenants t
      on t.id = m.tenant_id
     and t.deleted_at is null
   where p.id = auth.uid()
     and (not private.role_requires_mfa(m.role) or private.session_aal() = 'aal2')
$$;

create function private.current_tenant_id() returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select tenant_id from private.current_membership()
$$;

create function private.current_app_role() returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from private.current_membership()
$$;

create function private.has_role(p_roles public.app_role[]) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select role = any (p_roles) from private.current_membership()), false)
$$;

-- Perfis internos do escritório (todos exceto o cliente do portal).
create function private.staff_roles() returns public.app_role[]
language sql
immutable
set search_path = ''
as $$
  select array['admin', 'lawyer', 'intern', 'finance', 'reception', 'dpo']::public.app_role[]
$$;

revoke all on function
  private.set_updated_at(),
  private.role_requires_mfa(public.app_role),
  private.session_aal(),
  private.current_membership(),
  private.current_tenant_id(),
  private.current_app_role(),
  private.has_role(public.app_role[]),
  private.staff_roles()
from public;

grant execute on function
  private.role_requires_mfa(public.app_role),
  private.session_aal(),
  private.current_membership(),
  private.current_tenant_id(),
  private.current_app_role(),
  private.has_role(public.app_role[]),
  private.staff_roles()
to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Proteção: o escritório nunca fica sem admin ativo
-- -----------------------------------------------------------------------------
create function private.ensure_active_admin() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin' and old.status = 'active'
     and (new.role <> 'admin' or new.status <> 'active')
     and not exists (
       select 1 from public.tenant_members m
        where m.tenant_id = old.tenant_id
          and m.id <> old.id
          and m.role = 'admin'
          and m.status = 'active'
     ) then
    raise exception 'O escritório precisa ter ao menos um administrador ativo.'
      using errcode = 'P0001', hint = 'last_admin';
  end if;
  return new;
end;
$$;

create trigger tenant_members_ensure_active_admin
  before update on public.tenant_members
  for each row execute function private.ensure_active_admin();

-- Vínculo não pode mudar de escritório/usuário depois de criado.
create function private.freeze_member_identity() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tenant_id <> old.tenant_id or new.user_id <> old.user_id then
    raise exception 'tenant_id e user_id de um vínculo são imutáveis.';
  end if;
  return new;
end;
$$;

create trigger tenant_members_freeze_identity
  before update on public.tenant_members
  for each row execute function private.freeze_member_identity();

-- -----------------------------------------------------------------------------
-- Cadastro: novo usuário
--  * Autocadastro (sem app_metadata.invited) cria SOMENTE um escritório novo,
--    com o usuário como admin. Exige user_metadata.office_name.
--  * Usuários convidados são criados pelo servidor (service_role) com
--    app_metadata.invited = true; o vínculo nasce ao aceitar o convite.
--  app_metadata não pode ser alterado pelo próprio usuário.
-- -----------------------------------------------------------------------------
create function private.slugify(p_text text) returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    btrim(
      regexp_replace(
        lower(translate(p_text,
          'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ',
          'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn')),
        '[^a-z0-9]+', '-', 'g'),
      '-'),
    '')
$$;

create function private.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text := btrim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  v_office_name text := btrim(coalesce(new.raw_user_meta_data ->> 'office_name', ''));
  v_invited boolean := coalesce((new.raw_app_meta_data ->> 'invited')::boolean, false);
  v_tenant_id uuid;
begin
  if char_length(v_full_name) < 2 then
    v_full_name := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, full_name, email)
  values (new.id, v_full_name, lower(new.email));

  if v_invited then
    return new;
  end if;

  if char_length(v_office_name) < 2 then
    raise exception 'Cadastro público exige o nome do escritório.'
      using errcode = 'P0001', hint = 'office_name_required';
  end if;

  insert into public.tenants (name, slug, created_by)
  values (
    v_office_name,
    left(coalesce(private.slugify(v_office_name), 'escritorio'), 60) || '-'
      || substr(md5(gen_random_uuid()::text), 1, 6),
    new.id
  )
  returning id into v_tenant_id;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (v_tenant_id, new.id, 'admin');

  update public.profiles set active_tenant_id = v_tenant_id where id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Mantém o e-mail do perfil sincronizado com o Auth.
create function private.handle_user_email_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = lower(new.email) where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();

revoke all on function
  private.ensure_active_admin(),
  private.freeze_member_identity(),
  private.slugify(text),
  private.handle_new_user(),
  private.handle_user_email_change()
from public;

-- -----------------------------------------------------------------------------
-- RLS e privilégios: tenants
-- -----------------------------------------------------------------------------
alter table public.tenants enable row level security;

revoke all on table public.tenants from anon, authenticated;
grant select on table public.tenants to authenticated;
grant update (name, cnpj, settings) on table public.tenants to authenticated;

-- Qualquer membro ativo lê o próprio escritório ativo.
create policy tenants_select_member on public.tenants
  for select to authenticated
  using (id = (select private.current_tenant_id()));

-- Somente admin altera dados do escritório.
create policy tenants_update_admin on public.tenants
  for update to authenticated
  using (id = (select private.current_tenant_id()) and (select private.has_role(array['admin']::public.app_role[])))
  with check (id = (select private.current_tenant_id()));

-- -----------------------------------------------------------------------------
-- RLS e privilégios: profiles
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, phone, oab_number, oab_state) on table public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- A equipe do escritório vê os perfis dos membros do escritório ativo.
create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (
    (select private.has_role(private.staff_roles()))
    and exists (
      select 1 from public.tenant_members m
       where m.user_id = profiles.id
         and m.tenant_id = (select private.current_tenant_id())
    )
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- RLS e privilégios: tenant_members
-- Alterações de perfil/status apenas via public.update_member() (auditada).
-- -----------------------------------------------------------------------------
alter table public.tenant_members enable row level security;

revoke all on table public.tenant_members from anon, authenticated;
grant select on table public.tenant_members to authenticated;

-- O usuário vê os próprios vínculos (necessário para escolher o escritório e
-- saber se precisa de MFA).
create policy tenant_members_select_own on public.tenant_members
  for select to authenticated
  using (user_id = (select auth.uid()));

-- A equipe vê os vínculos do escritório ativo; clientes não.
create policy tenant_members_select_staff on public.tenant_members
  for select to authenticated
  using (
    tenant_id = (select private.current_tenant_id())
    and (select private.has_role(private.staff_roles()))
  );

-- -----------------------------------------------------------------------------
-- RPC: meus vínculos (lista para o seletor de escritório)
-- -----------------------------------------------------------------------------
create function public.my_memberships()
returns table (
  tenant_id uuid,
  tenant_name text,
  role public.app_role,
  requires_mfa boolean,
  is_active boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.tenant_id,
         t.name,
         m.role,
         private.role_requires_mfa(m.role),
         p.active_tenant_id = m.tenant_id
    from public.tenant_members m
    join public.tenants t on t.id = m.tenant_id and t.deleted_at is null
    join public.profiles p on p.id = m.user_id
   where m.user_id = auth.uid()
     and m.status = 'active'
   order by t.name
$$;

-- RPC: troca o escritório ativo (valida o vínculo ativo).
create function public.set_active_tenant(p_tenant_id uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;

  if not exists (
    select 1
      from public.tenant_members m
      join public.tenants t on t.id = m.tenant_id and t.deleted_at is null
     where m.user_id = auth.uid()
       and m.tenant_id = p_tenant_id
       and m.status = 'active'
  ) then
    raise exception 'Sem vínculo ativo com este escritório.' using errcode = '42501';
  end if;

  update public.profiles set active_tenant_id = p_tenant_id where id = auth.uid();
end;
$$;

revoke all on function public.my_memberships(), public.set_active_tenant(uuid) from public, anon;
grant execute on function public.my_memberships(), public.set_active_tenant(uuid) to authenticated;

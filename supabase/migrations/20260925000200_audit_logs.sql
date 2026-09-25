-- =============================================================================
-- Fase 1 · Trilha de auditoria (append-only, com cadeia de hashes)
-- =============================================================================
--  * Ninguém (anon, authenticated, service_role) tem INSERT/UPDATE/DELETE direto.
--  * Gravação somente pelas funções abaixo, que derivam autor/escritório da
--    sessão (não podem ser forjados pelo chamador autenticado).
--  * Triggers bloqueiam UPDATE, DELETE e TRUNCATE para qualquer papel.
--  * Cada registro guarda o hash do anterior do mesmo escritório: qualquer
--    alteração direta no banco quebra a cadeia (verificável por
--    public.verify_audit_chain()).
--  * Leitura: somente admin e dpo do escritório ativo.
-- =============================================================================

create table public.audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid references public.tenants (id),
  actor_id uuid references auth.users (id),
  actor_role public.app_role,
  action text not null check (action ~ '^[a-z][a-z_]*(\.[a-z][a-z_]*)+$'),
  entity_type text check (entity_type ~ '^[a-z][a-z_]*$'),
  entity_id text,
  ip inet,
  user_agent text check (char_length(user_agent) <= 512),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  prev_hash text,
  hash text not null
);

create index audit_logs_tenant_created_idx on public.audit_logs (tenant_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

comment on table public.audit_logs is
  'Trilha de auditoria imutável (LGPD). Escrita apenas via funções; sem UPDATE/DELETE.';

-- -----------------------------------------------------------------------------
-- Imutabilidade
-- -----------------------------------------------------------------------------
create function private.audit_logs_immutable() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs é append-only: % não é permitido.', tg_op
    using errcode = '42501';
end;
$$;

create trigger audit_logs_no_update
  before update or delete on public.audit_logs
  for each row execute function private.audit_logs_immutable();

create trigger audit_logs_no_truncate
  before truncate on public.audit_logs
  for each statement execute function private.audit_logs_immutable();

-- -----------------------------------------------------------------------------
-- Escrita interna
-- -----------------------------------------------------------------------------
create function private.audit_hash(
  p_prev_hash text,
  p_tenant_id uuid,
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_metadata jsonb,
  p_created_at timestamptz
) returns text
language sql
immutable
set search_path = ''
as $$
  select encode(
    sha256(convert_to(concat_ws('|',
      coalesce(p_prev_hash, ''),
      coalesce(p_tenant_id::text, ''),
      coalesce(p_actor_id::text, ''),
      p_action,
      coalesce(p_entity_type, ''),
      coalesce(p_entity_id, ''),
      coalesce(p_metadata, '{}'::jsonb)::text,
      to_char(p_created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US')
    ), 'UTF8')),
    'hex')
$$;

create function private.write_audit_log(
  p_tenant_id uuid,
  p_actor_id uuid,
  p_actor_role public.app_role,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_metadata jsonb,
  p_ip inet,
  p_user_agent text
) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prev_hash text;
  v_created_at timestamptz;
  v_id bigint;
begin
  -- Serializa a cadeia por escritório (ou a cadeia global, sem escritório).
  perform pg_advisory_xact_lock(hashtextextended('audit:' || coalesce(p_tenant_id::text, 'global'), 0));

  select a.hash into v_prev_hash
    from public.audit_logs a
   where a.tenant_id is not distinct from p_tenant_id
   order by a.id desc
   limit 1;

  v_created_at := clock_timestamp();

  insert into public.audit_logs (
    tenant_id, actor_id, actor_role, action, entity_type, entity_id,
    ip, user_agent, metadata, created_at, prev_hash, hash
  ) values (
    p_tenant_id, p_actor_id, p_actor_role, p_action, p_entity_type, p_entity_id,
    p_ip, left(p_user_agent, 512), coalesce(p_metadata, '{}'::jsonb), v_created_at, v_prev_hash,
    private.audit_hash(v_prev_hash, p_tenant_id, p_actor_id, p_action, p_entity_type,
                       p_entity_id, coalesce(p_metadata, '{}'::jsonb), v_created_at)
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- IP e user agent da requisição HTTP atual (PostgREST expõe os headers).
-- O servidor Next.js repassa o IP do usuário em x-jc-client-ip.
create function private.request_ip() returns inet
language plpgsql
stable
set search_path = ''
as $$
declare
  v_headers jsonb := nullif(current_setting('request.headers', true), '')::jsonb;
  v_raw text;
begin
  v_raw := coalesce(
    nullif(btrim(v_headers ->> 'x-jc-client-ip'), ''),
    nullif(btrim(split_part(v_headers ->> 'x-forwarded-for', ',', 1)), '')
  );
  return v_raw::inet;
exception when others then
  return null;
end;
$$;

create function private.request_user_agent() returns text
language sql
stable
set search_path = ''
as $$
  select left(nullif(current_setting('request.headers', true), '')::jsonb ->> 'user-agent', 512)
$$;

-- -----------------------------------------------------------------------------
-- API pública de auditoria
-- -----------------------------------------------------------------------------

-- Evento do usuário autenticado no escritório ativo. Autor, perfil,
-- escritório, IP e user agent são derivados da sessão.
create function public.log_audit_event(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_metadata jsonb default '{}'::jsonb
) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid := private.current_tenant_id();
begin
  if auth.uid() is null or v_tenant_id is null then
    raise exception 'Sessão sem escritório ativo.' using errcode = '42501';
  end if;

  return private.write_audit_log(
    v_tenant_id, auth.uid(), private.current_app_role(), p_action, p_entity_type, p_entity_id,
    p_metadata, private.request_ip(), private.request_user_agent()
  );
end;
$$;

-- Evento registrado pelo servidor (service_role), p.ex. falhas de login.
create function public.log_system_audit_event(
  p_action text,
  p_tenant_id uuid default null,
  p_actor_id uuid default null,
  p_entity_type text default null,
  p_entity_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_ip inet default null,
  p_user_agent text default null
) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  if p_tenant_id is not null and p_actor_id is not null then
    select m.role into v_role
      from public.tenant_members m
     where m.tenant_id = p_tenant_id and m.user_id = p_actor_id;
  end if;

  return private.write_audit_log(
    p_tenant_id, p_actor_id, v_role, p_action, p_entity_type, p_entity_id,
    p_metadata, p_ip, p_user_agent
  );
end;
$$;

-- Verifica a integridade da cadeia do escritório ativo (admin/dpo).
create function public.verify_audit_chain()
returns table (valid boolean, checked bigint, first_invalid_id bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid := private.current_tenant_id();
  v_prev text := null;
  v_count bigint := 0;
  r record;
begin
  if v_tenant_id is null
     or not private.has_role(array['admin', 'dpo']::public.app_role[]) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  for r in
    select * from public.audit_logs a where a.tenant_id = v_tenant_id order by a.id
  loop
    v_count := v_count + 1;
    if r.prev_hash is distinct from v_prev
       or r.hash <> private.audit_hash(r.prev_hash, r.tenant_id, r.actor_id, r.action,
                                       r.entity_type, r.entity_id, r.metadata, r.created_at) then
      return query select false, v_count, r.id;
      return;
    end if;
    v_prev := r.hash;
  end loop;

  return query select true, v_count, null::bigint;
end;
$$;

revoke all on function
  private.audit_logs_immutable(),
  private.audit_hash(text, uuid, uuid, text, text, text, jsonb, timestamptz),
  private.write_audit_log(uuid, uuid, public.app_role, text, text, text, jsonb, inet, text),
  private.request_ip(),
  private.request_user_agent(),
  public.log_audit_event(text, text, text, jsonb),
  public.log_system_audit_event(text, uuid, uuid, text, text, jsonb, inet, text),
  public.verify_audit_chain()
from public, anon, authenticated;

grant execute on function public.log_audit_event(text, text, text, jsonb) to authenticated;
grant execute on function public.verify_audit_chain() to authenticated;
grant execute on function public.log_system_audit_event(text, uuid, uuid, text, text, jsonb, inet, text)
  to service_role;

-- -----------------------------------------------------------------------------
-- RLS e privilégios
-- -----------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

revoke all on table public.audit_logs from anon, authenticated, service_role;
grant select on table public.audit_logs to authenticated, service_role;

create policy audit_logs_select_admin_dpo on public.audit_logs
  for select to authenticated
  using (
    tenant_id = (select private.current_tenant_id())
    and (select private.has_role(array['admin', 'dpo']::public.app_role[]))
  );

-- -----------------------------------------------------------------------------
-- Auditoria automática de alterações em escritórios e vínculos
-- -----------------------------------------------------------------------------
create function private.audit_row_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_new jsonb := to_jsonb(new);
  v_changes jsonb;
  v_tenant_id uuid;
  v_entity_type text := tg_argv[0];
  v_actor_id uuid;
begin
  v_tenant_id := case when tg_table_name = 'tenants' then (v_new ->> 'id')::uuid
                      else (v_new ->> 'tenant_id')::uuid end;

  select coalesce(jsonb_object_agg(n.key, jsonb_build_object('from', v_old -> n.key, 'to', n.value)), '{}'::jsonb)
    into v_changes
    from jsonb_each(v_new) n
   where n.key not in ('updated_at')
     and (v_old is null or v_old -> n.key is distinct from n.value);

  if tg_op = 'UPDATE' and v_changes = '{}'::jsonb then
    return new;
  end if;

  -- Sem sessão (ex.: cadastro feito pelo Auth), o autor é quem criou o registro.
  v_actor_id := coalesce(auth.uid(), (v_new ->> 'created_by')::uuid, (v_new ->> 'user_id')::uuid);

  perform private.write_audit_log(
    v_tenant_id,
    v_actor_id,
    (select m.role from public.tenant_members m
      where m.tenant_id = v_tenant_id and m.user_id = v_actor_id),
    v_entity_type || case when tg_op = 'INSERT' then '.created' else '.updated' end,
    v_entity_type,
    v_new ->> 'id',
    jsonb_build_object('changes', v_changes),
    private.request_ip(),
    private.request_user_agent()
  );

  return new;
end;
$$;

revoke all on function private.audit_row_change() from public, anon, authenticated;

create trigger tenants_audit
  after insert or update on public.tenants
  for each row execute function private.audit_row_change('tenant');

create trigger tenant_members_audit
  after insert or update on public.tenant_members
  for each row execute function private.audit_row_change('tenant_member');

-- Troca de escritório ativo passa a ser auditada.
create or replace function public.set_active_tenant(p_tenant_id uuid) returns void
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

  perform private.write_audit_log(
    p_tenant_id, auth.uid(),
    (select m.role from public.tenant_members m where m.tenant_id = p_tenant_id and m.user_id = auth.uid()),
    'session.tenant_switched', 'tenant', p_tenant_id::text, '{}'::jsonb,
    private.request_ip(), private.request_user_agent()
  );
end;
$$;

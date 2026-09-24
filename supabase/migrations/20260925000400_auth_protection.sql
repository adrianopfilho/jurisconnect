-- =============================================================================
-- Fase 1 · Proteção de autenticação: bloqueio por tentativas e rate limiting
-- =============================================================================
--  * 5 falhas de login em 15 minutos bloqueiam a conta por 15 minutos.
--  * O admin do escritório pode desbloquear um membro.
--  * O e-mail é guardado apenas como hash (inclusive de e-mails inexistentes).
--  * Rate limiting por janela fixa para rotas de autenticação (e, nas próximas
--    fases, de exportação).
--  * Tabelas no schema private (fora da API) com RLS e política de negação.
-- =============================================================================

create table private.auth_throttle (
  email_hash text primary key check (email_hash ~ '^[0-9a-f]{64}$'),
  failures integer not null default 0 check (failures >= 0),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table private.rate_limits (
  bucket text not null check (char_length(bucket) between 1 and 200),
  window_start timestamptz not null,
  hits integer not null default 0 check (hits >= 0),
  primary key (bucket, window_start)
);

-- Tabelas internas: nenhum acesso pela API; somente funções security definer.
alter table private.auth_throttle enable row level security;
alter table private.rate_limits enable row level security;

revoke all on table private.auth_throttle, private.rate_limits from public, anon, authenticated, service_role;

create policy auth_throttle_deny_all on private.auth_throttle
  as restrictive for all to anon, authenticated, service_role
  using (false) with check (false);

create policy rate_limits_deny_all on private.rate_limits
  as restrictive for all to anon, authenticated, service_role
  using (false) with check (false);

-- -----------------------------------------------------------------------------
-- Parâmetros
-- -----------------------------------------------------------------------------
create function private.lock_max_failures() returns integer
language sql immutable set search_path = '' as $$ select 5 $$;

create function private.lock_window() returns interval
language sql immutable set search_path = '' as $$ select interval '15 minutes' $$;

create function private.lock_duration() returns interval
language sql immutable set search_path = '' as $$ select interval '15 minutes' $$;

create function private.email_hash(p_email text) returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(lower(btrim(p_email)), 'UTF8')), 'hex')
$$;

-- -----------------------------------------------------------------------------
-- Bloqueio de login (service_role)
-- -----------------------------------------------------------------------------
create function public.auth_login_locked_until(p_email text) returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select t.locked_until
    from private.auth_throttle t
   where t.email_hash = private.email_hash(p_email)
     and t.locked_until > now()
$$;

create function public.auth_register_failure(
  p_email text,
  p_ip inet default null,
  p_user_agent text default null
) returns table (failures integer, locked_until timestamptz, just_locked boolean)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_hash text := private.email_hash(p_email);
  v_row private.auth_throttle%rowtype;
  v_user_id uuid;
  v_tenant record;
begin
  insert into private.auth_throttle (email_hash) values (v_hash)
  on conflict (email_hash) do nothing;

  select * into v_row from private.auth_throttle where email_hash = v_hash for update;

  -- Já bloqueado: não prolonga o bloqueio.
  if v_row.locked_until is not null and v_row.locked_until > now() then
    return query select v_row.failures, v_row.locked_until, false;
    return;
  end if;

  -- Janela expirada ou bloqueio vencido: recomeça a contagem.
  if v_row.window_started_at < now() - private.lock_window()
     or v_row.locked_until is not null then
    v_row.failures := 0;
    v_row.window_started_at := now();
    v_row.locked_until := null;
  end if;

  v_row.failures := v_row.failures + 1;

  if v_row.failures >= private.lock_max_failures() then
    v_row.locked_until := now() + private.lock_duration();
  end if;

  update private.auth_throttle
     set failures = v_row.failures,
         window_started_at = v_row.window_started_at,
         locked_until = v_row.locked_until,
         updated_at = now()
   where email_hash = v_hash;

  select u.id into v_user_id from auth.users u where lower(u.email) = lower(btrim(p_email));

  -- Falha isolada: trilha global (sem escritório), sem guardar o e-mail em claro.
  perform private.write_audit_log(
    null, v_user_id, null, 'auth.login_failed', 'user', v_user_id::text,
    jsonb_build_object('email_hash', v_hash, 'failures', v_row.failures), p_ip, p_user_agent
  );

  -- Bloqueio: registrado em cada escritório do usuário (visível a admin/dpo).
  if v_row.locked_until is not null and v_user_id is not null then
    for v_tenant in
      select m.tenant_id, m.role from public.tenant_members m where m.user_id = v_user_id
    loop
      perform private.write_audit_log(
        v_tenant.tenant_id, v_user_id, v_tenant.role, 'auth.account_locked', 'user',
        v_user_id::text, jsonb_build_object('locked_until', v_row.locked_until), p_ip, p_user_agent
      );
    end loop;
  end if;

  return query select v_row.failures, v_row.locked_until, v_row.locked_until is not null;
end;
$$;

create function public.auth_register_success(
  p_user_id uuid,
  p_ip inet default null,
  p_user_agent text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_tenant_id uuid;
begin
  select u.email into v_email from auth.users u where u.id = p_user_id;
  if v_email is null then
    return;
  end if;

  delete from private.auth_throttle where email_hash = private.email_hash(v_email);

  select p.active_tenant_id into v_tenant_id from public.profiles p where p.id = p_user_id;

  perform public.log_system_audit_event(
    p_action => 'auth.login_succeeded',
    p_tenant_id => v_tenant_id,
    p_actor_id => p_user_id,
    p_entity_type => 'user',
    p_entity_id => p_user_id::text,
    p_ip => p_ip,
    p_user_agent => p_user_agent
  );
end;
$$;

-- Membros bloqueados do escritório ativo (tela de usuários do admin).
create function public.locked_members()
returns table (member_id uuid, locked_until timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, t.locked_until
    from public.tenant_members m
    join public.profiles p on p.id = m.user_id
    join private.auth_throttle t on t.email_hash = private.email_hash(p.email)
   where m.tenant_id = private.current_tenant_id()
     and private.has_role(array['admin']::public.app_role[])
     and t.locked_until > now()
$$;

-- Desbloqueio manual pelo admin do escritório ativo.
create function public.unlock_member(p_member_id uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  if not private.has_role(array['admin']::public.app_role[]) then
    raise exception 'Somente administradores desbloqueiam membros.' using errcode = '42501';
  end if;

  select m.user_id, p.email into v_user_id, v_email
    from public.tenant_members m
    join public.profiles p on p.id = m.user_id
   where m.id = p_member_id
     and m.tenant_id = private.current_tenant_id();

  if v_user_id is null then
    raise exception 'Membro não encontrado.' using errcode = '42501';
  end if;

  delete from private.auth_throttle where email_hash = private.email_hash(v_email);

  perform public.log_audit_event('auth.account_unlocked', 'user', v_user_id::text, '{}'::jsonb);
end;
$$;

-- -----------------------------------------------------------------------------
-- Rate limiting (janela fixa). Retorna true se a requisição é permitida.
-- -----------------------------------------------------------------------------
create function public.rate_limit_hit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Parâmetros de rate limit inválidos.';
  end if;

  insert into private.rate_limits as r (bucket, window_start, hits)
  values (p_bucket, v_window_start, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;

  -- Limpeza oportunista de janelas antigas.
  if random() < 0.01 then
    delete from private.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function
  private.lock_max_failures(),
  private.lock_window(),
  private.lock_duration(),
  private.email_hash(text),
  public.auth_login_locked_until(text),
  public.auth_register_failure(text, inet, text),
  public.auth_register_success(uuid, inet, text),
  public.locked_members(),
  public.unlock_member(uuid),
  public.rate_limit_hit(text, integer, integer)
from public, anon, authenticated;

grant execute on function
  public.auth_login_locked_until(text),
  public.auth_register_failure(text, inet, text),
  public.auth_register_success(uuid, inet, text),
  public.rate_limit_hit(text, integer, integer)
to service_role;

grant execute on function public.locked_members(), public.unlock_member(uuid) to authenticated;

-- =============================================================================
-- Fase 1 · Convites e gestão de membros
-- =============================================================================
--  * Ninguém entra num escritório existente sem convite.
--  * Admin convida qualquer perfil; advogado convida apenas clientes do portal.
--  * O token do convite nunca é gravado: só o hash SHA-256 (hex). O token é
--    gerado pelo servidor e enviado por e-mail; expira em 24 horas e é de uso
--    único. Criar/aceitar convites é exclusivo do service_role (Server Actions),
--    para que nem o próprio admin consiga conhecer o token e se passar pelo
--    convidado.
--  * Convites não são excluídos: são revogados (revoked_at/revoked_by).
-- =============================================================================

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role public.app_role not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id),
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id),
  constraint invitations_single_outcome check (accepted_at is null or revoked_at is null),
  constraint invitations_accepted_consistency check ((accepted_at is null) = (accepted_by is null)),
  constraint invitations_revoked_consistency check ((revoked_at is null) = (revoked_by is null))
);

create unique index invitations_one_pending_per_email
  on public.invitations (tenant_id, email)
  where accepted_at is null and revoked_at is null;

create index invitations_tenant_idx on public.invitations (tenant_id, created_at desc);

comment on table public.invitations is
  'Convites para entrar num escritório. Guarda apenas o hash do token; uso único; 24h.';

-- -----------------------------------------------------------------------------
-- RLS e privilégios (token_hash não é legível por ninguém via API autenticada)
-- -----------------------------------------------------------------------------
alter table public.invitations enable row level security;

revoke all on table public.invitations from anon, authenticated;
grant select (id, tenant_id, email, role, expires_at, invited_by, created_at,
              accepted_at, accepted_by, revoked_at, revoked_by)
  on table public.invitations to authenticated;

create policy invitations_select_admin on public.invitations
  for select to authenticated
  using (
    tenant_id = (select private.current_tenant_id())
    and (select private.has_role(array['admin']::public.app_role[]))
  );

create policy invitations_select_lawyer_clients on public.invitations
  for select to authenticated
  using (
    tenant_id = (select private.current_tenant_id())
    and role = 'client'
    and (select private.has_role(array['lawyer']::public.app_role[]))
  );

-- -----------------------------------------------------------------------------
-- Regra de quem pode convidar quem
-- -----------------------------------------------------------------------------
create function private.can_invite(p_inviter_role public.app_role, p_target_role public.app_role)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_inviter_role = 'admin'
      or (p_inviter_role = 'lawyer' and p_target_role = 'client')
$$;

-- -----------------------------------------------------------------------------
-- Criar convite (somente service_role, chamado por Server Action após validar
-- a sessão MFA do autor)
-- -----------------------------------------------------------------------------
create function public.create_invitation(
  p_actor_id uuid,
  p_tenant_id uuid,
  p_email text,
  p_role public.app_role,
  p_token_hash text,
  p_ip inet default null,
  p_user_agent text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role public.app_role;
  v_email text := lower(btrim(p_email));
  v_id uuid;
begin
  select m.role into v_actor_role
    from public.tenant_members m
    join public.tenants t on t.id = m.tenant_id and t.deleted_at is null
   where m.tenant_id = p_tenant_id
     and m.user_id = p_actor_id
     and m.status = 'active';

  if v_actor_role is null or not private.can_invite(v_actor_role, p_role) then
    raise exception 'Sem permissão para convidar este perfil.' using errcode = '42501';
  end if;

  if exists (
    select 1
      from public.tenant_members m
      join public.profiles p on p.id = m.user_id
     where m.tenant_id = p_tenant_id
       and lower(p.email) = v_email
  ) then
    raise exception 'Este e-mail já possui vínculo com o escritório.'
      using errcode = 'P0001', hint = 'already_member';
  end if;

  -- Um convite pendente por e-mail: o anterior é revogado.
  update public.invitations
     set revoked_at = now(), revoked_by = p_actor_id
   where tenant_id = p_tenant_id
     and email = v_email
     and accepted_at is null
     and revoked_at is null;

  insert into public.invitations (tenant_id, email, role, token_hash, expires_at, invited_by)
  values (p_tenant_id, v_email, p_role, p_token_hash, now() + interval '24 hours', p_actor_id)
  returning id into v_id;

  perform private.write_audit_log(
    p_tenant_id, p_actor_id, v_actor_role, 'invitation.created', 'invitation', v_id::text,
    jsonb_build_object('email', v_email, 'role', p_role), p_ip, p_user_agent
  );

  return v_id;
end;
$$;

-- Consulta de convite pelo hash do token (tela de aceite).
create function public.get_invitation(p_token_hash text)
returns table (
  id uuid,
  tenant_id uuid,
  tenant_name text,
  email text,
  role public.app_role,
  expires_at timestamptz,
  status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.tenant_id, t.name, i.email, i.role, i.expires_at,
         case
           when i.accepted_at is not null then 'accepted'
           when i.revoked_at is not null then 'revoked'
           when i.expires_at <= now() then 'expired'
           else 'pending'
         end
    from public.invitations i
    join public.tenants t on t.id = i.tenant_id and t.deleted_at is null
   where i.token_hash = p_token_hash
$$;

-- Aceitar convite: cria o vínculo. O e-mail do usuário precisa ser o do convite.
create function public.accept_invitation(
  p_token_hash text,
  p_user_id uuid,
  p_ip inet default null,
  p_user_agent text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitations%rowtype;
  v_user_email text;
  v_member public.tenant_members%rowtype;
begin
  select * into v_inv from public.invitations where token_hash = p_token_hash for update;

  if not found or v_inv.revoked_at is not null or v_inv.accepted_at is not null
     or v_inv.expires_at <= now() then
    raise exception 'Convite inválido, expirado ou já utilizado.'
      using errcode = 'P0001', hint = 'invalid_invitation';
  end if;

  select lower(u.email) into v_user_email from auth.users u where u.id = p_user_id;

  if v_user_email is distinct from v_inv.email then
    raise exception 'O convite pertence a outro e-mail.'
      using errcode = 'P0001', hint = 'email_mismatch';
  end if;

  select * into v_member
    from public.tenant_members
   where tenant_id = v_inv.tenant_id and user_id = p_user_id;

  if found then
    raise exception 'Usuário já possui vínculo com este escritório.'
      using errcode = 'P0001', hint = 'already_member';
  end if;

  insert into public.tenant_members (tenant_id, user_id, role, invited_by)
  values (v_inv.tenant_id, p_user_id, v_inv.role, v_inv.invited_by);

  update public.invitations
     set accepted_at = now(), accepted_by = p_user_id
   where id = v_inv.id;

  update public.profiles
     set active_tenant_id = v_inv.tenant_id
   where id = p_user_id and active_tenant_id is null;

  perform private.write_audit_log(
    v_inv.tenant_id, p_user_id, v_inv.role, 'invitation.accepted', 'invitation', v_inv.id::text,
    jsonb_build_object('email', v_inv.email, 'role', v_inv.role), p_ip, p_user_agent
  );

  return v_inv.tenant_id;
end;
$$;

-- Revogar convite pendente (sessão do admin, ou do advogado para clientes).
create function public.revoke_invitation(p_invitation_id uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitations%rowtype;
  v_role public.app_role := private.current_app_role();
begin
  select * into v_inv
    from public.invitations
   where id = p_invitation_id
     and tenant_id = private.current_tenant_id()
   for update;

  if not found or v_role is null or not private.can_invite(v_role, v_inv.role) then
    raise exception 'Convite não encontrado ou sem permissão.' using errcode = '42501';
  end if;

  if v_inv.accepted_at is not null or v_inv.revoked_at is not null then
    raise exception 'O convite não está mais pendente.' using errcode = 'P0001', hint = 'not_pending';
  end if;

  update public.invitations
     set revoked_at = now(), revoked_by = auth.uid()
   where id = v_inv.id;

  perform public.log_audit_event('invitation.revoked', 'invitation', v_inv.id::text,
                                 jsonb_build_object('email', v_inv.email, 'role', v_inv.role));
end;
$$;

-- -----------------------------------------------------------------------------
-- Gestão de membros (admin do escritório ativo). Auditado pelo trigger de
-- tenant_members. Retorna se o usuário ainda tem outro vínculo ativo, para o
-- servidor decidir sobre bloquear/desbloquear o login no Auth.
-- -----------------------------------------------------------------------------
create function public.update_member(
  p_member_id uuid,
  p_role public.app_role,
  p_status public.member_status
) returns table (user_id uuid, has_other_active_membership boolean)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_member public.tenant_members%rowtype;
begin
  if not private.has_role(array['admin']::public.app_role[]) then
    raise exception 'Somente administradores gerenciam membros.' using errcode = '42501';
  end if;

  select * into v_member
    from public.tenant_members
   where id = p_member_id
     and tenant_id = private.current_tenant_id()
   for update;

  if not found then
    raise exception 'Membro não encontrado.' using errcode = '42501';
  end if;

  update public.tenant_members
     set role = p_role,
         status = p_status,
         disabled_at = case when p_status = 'disabled' then coalesce(disabled_at, now()) end,
         disabled_by = case when p_status = 'disabled' then coalesce(disabled_by, auth.uid()) end
   where id = v_member.id;

  return query
    select v_member.user_id,
           exists (
             select 1 from public.tenant_members m
              where m.user_id = v_member.user_id
                and m.id <> v_member.id
                and m.status = 'active'
           );
end;
$$;

revoke all on function
  private.can_invite(public.app_role, public.app_role),
  public.create_invitation(uuid, uuid, text, public.app_role, text, inet, text),
  public.get_invitation(text),
  public.accept_invitation(text, uuid, inet, text),
  public.revoke_invitation(uuid),
  public.update_member(uuid, public.app_role, public.member_status)
from public, anon, authenticated;

grant execute on function private.can_invite(public.app_role, public.app_role)
  to authenticated, service_role;

grant execute on function
  public.create_invitation(uuid, uuid, text, public.app_role, text, inet, text),
  public.get_invitation(text),
  public.accept_invitation(text, uuid, inet, text)
to service_role;

grant execute on function
  public.revoke_invitation(uuid),
  public.update_member(uuid, public.app_role, public.member_status)
to authenticated;

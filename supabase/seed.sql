-- =============================================================================
-- Seed do ambiente LOCAL (supabase db reset). TODOS OS DADOS SÃO FICTÍCIOS.
-- Domínio reservado .test (RFC 2606): nenhum e-mail real é usado.
-- Senha de todos os usuários de exemplo: Exemplo@Senha2026
-- Admins e advogados precisam cadastrar o MFA (TOTP) no primeiro login.
-- =============================================================================

create or replace function pg_temp.seed_user(p_email text, p_full_name text, p_office_name text default null)
returns uuid
language plpgsql
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('Exemplo@Senha2026', extensions.gen_salt('bf')), now(),
    '', '', '', '',
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'))
      || case when p_office_name is null then '{"invited": true}'::jsonb else '{}'::jsonb end,
    jsonb_strip_nulls(jsonb_build_object('full_name', p_full_name, 'office_name', p_office_name)),
    now(), now()
  );

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), v_id::text, v_id,
    jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  return v_id;
end;
$$;

create or replace function pg_temp.seed_member(p_user uuid, p_tenant uuid, p_role public.app_role)
returns void
language sql
as $$
  insert into public.tenant_members (tenant_id, user_id, role) values (p_tenant, p_user, p_role);
  update public.profiles set active_tenant_id = coalesce(active_tenant_id, p_tenant) where id = p_user;
$$;

do $$
declare
  v_modelo uuid;
  v_exemplo uuid;
  v_cliente uuid;
begin
  -- Escritório 1: um usuário por perfil
  perform pg_temp.seed_user('socia@modelo.test', 'Helena Modelo', 'Modelo Advocacia (fictício)');
  select active_tenant_id into v_modelo from public.profiles where email = 'socia@modelo.test';

  perform pg_temp.seed_member(pg_temp.seed_user('advogado@modelo.test', 'Rafael Exemplo'), v_modelo, 'lawyer');
  perform pg_temp.seed_member(pg_temp.seed_user('estagiaria@modelo.test', 'Júlia Teste'), v_modelo, 'intern');
  perform pg_temp.seed_member(pg_temp.seed_user('financeiro@modelo.test', 'Marcos Fictício'), v_modelo, 'finance');
  perform pg_temp.seed_member(pg_temp.seed_user('recepcao@modelo.test', 'Carla Demonstração'), v_modelo, 'reception');
  perform pg_temp.seed_member(pg_temp.seed_user('dpo@modelo.test', 'Bruno Encarregado'), v_modelo, 'dpo');

  -- Escritório 2
  perform pg_temp.seed_user('socio@exemplo-associados.test', 'Otávio Exemplo', 'Exemplo & Associados (fictício)');
  select active_tenant_id into v_exemplo from public.profiles where email = 'socio@exemplo-associados.test';
  perform pg_temp.seed_member(pg_temp.seed_user('advogada@exemplo-associados.test', 'Patrícia Amostra'), v_exemplo, 'lawyer');

  -- Cliente atendido pelos dois escritórios (demonstra o "escritório ativo")
  v_cliente := pg_temp.seed_user('cliente@pessoa.test', 'Cliente Fictício da Silva');
  perform pg_temp.seed_member(v_cliente, v_modelo, 'client');
  perform pg_temp.seed_member(v_cliente, v_exemplo, 'client');
end;
$$;

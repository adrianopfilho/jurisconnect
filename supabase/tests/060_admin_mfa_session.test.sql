-- Revisão da Fase 1:
--  (1) o último admin ativo não pode ser rebaixado nem desativado, nem por ele mesmo;
--  (2) o DPO exige MFA (aal2) para acessar o escritório e a auditoria;
--  (5) membro desativado perde o acesso na hora, mesmo com a sessão (JWT) ainda aberta.
begin;
\ir helpers/setup.psql

select plan(29);

select tests.seed_scenario();

create temp table t_ctx (key text primary key, value uuid);
insert into t_ctx values
  ('tenant_a', tests.tenant_of('admin.a@exemplo.test')),
  ('admin_a', tests.member_id('admin.a@exemplo.test', tests.tenant_of('admin.a@exemplo.test'))),
  ('intern_a', tests.member_id('intern.a@exemplo.test', tests.tenant_of('admin.a@exemplo.test')));
grant select on t_ctx to authenticated, service_role;

-- =============================================================================
-- (1) Último admin ativo
-- =============================================================================
select tests.authenticate_as('admin.a@exemplo.test');
select throws_ok(
  format($$ select * from public.update_member(%L, 'admin', 'disabled') $$, (select value from t_ctx where key = 'admin_a')),
  'P0001', 'O escritório precisa ter ao menos um administrador ativo.',
  '(1) o único admin não consegue se desativar');
select throws_ok(
  format($$ select * from public.update_member(%L, 'lawyer', 'active') $$, (select value from t_ctx where key = 'admin_a')),
  'P0001', 'O escritório precisa ter ao menos um administrador ativo.',
  '(1) o único admin não consegue se rebaixar');
select throws_ok(
  format($$ select * from public.update_member(%L, 'dpo', 'disabled') $$, (select value from t_ctx where key = 'admin_a')),
  'P0001', 'O escritório precisa ter ao menos um administrador ativo.',
  '(1) nem rebaixar e desativar ao mesmo tempo');

select tests.clear_authentication();
select throws_ok(
  format($$ update public.tenant_members set status = 'disabled', disabled_at = now() where id = %L $$,
         (select value from t_ctx where key = 'admin_a')),
  'P0001', 'O escritório precisa ter ao menos um administrador ativo.',
  '(1) a proteção vale até para alteração direta no banco (dono da tabela)');

-- Com um segundo admin, um pode rebaixar o outro, mas o último restante não se rebaixa.
select tests.add_member('socio2.a@exemplo.test', (select value from t_ctx where key = 'tenant_a'), 'admin');
select tests.authenticate_as('socio2.a@exemplo.test');
select lives_ok(
  format($$ select * from public.update_member(%L, 'lawyer', 'active') $$, (select value from t_ctx where key = 'admin_a')),
  '(1) com dois admins, um pode rebaixar o outro');
select throws_ok(
  format($$ select * from public.update_member(%L, 'lawyer', 'active') $$,
         tests.member_id('socio2.a@exemplo.test', (select value from t_ctx where key = 'tenant_a'))),
  'P0001', 'O escritório precisa ter ao menos um administrador ativo.',
  '(1) o admin que restou não consegue se rebaixar');
select tests.clear_authentication();
select is(
  (select count(*)::int from public.tenant_members
    where tenant_id = (select value from t_ctx where key = 'tenant_a') and role = 'admin' and status = 'active'),
  1, '(1) o escritório continua com exatamente um admin ativo');

-- Devolve o perfil original para os próximos testes.
select tests.authenticate_as('socio2.a@exemplo.test');
select * from public.update_member((select value from t_ctx where key = 'admin_a'), 'admin', 'active');
select tests.clear_authentication();

-- =============================================================================
-- (2) MFA obrigatório para o DPO
-- =============================================================================
select tests.authenticate_as('dpo.a@exemplo.test', 'aal1');
select is((select requires_mfa from public.my_memberships()), true, '(2) o vínculo do DPO informa que exige MFA');
select is((select count(*)::int from public.tenants), 0, '(2) DPO sem MFA não acessa o escritório');
select is((select count(*)::int from public.audit_logs), 0, '(2) DPO sem MFA não lê a auditoria');
select is((select count(*)::int from public.profiles where id <> tests.uid('dpo.a@exemplo.test')), 0,
  '(2) DPO sem MFA não vê perfis da equipe');
select throws_ok('select * from public.verify_audit_chain()', '42501', null, '(2) DPO sem MFA não verifica a cadeia');
select throws_ok('select public.log_audit_event(''x.y'')', '42501', null, '(2) DPO sem MFA não grava auditoria');

select tests.authenticate_as('dpo.a@exemplo.test', 'aal2');
select is((select count(*)::int from public.tenants), 1, '(2) DPO com MFA acessa o escritório');
select ok((select count(*) from public.audit_logs) > 0, '(2) DPO com MFA lê a auditoria');

select tests.authenticate_as('finance.a@exemplo.test', 'aal1');
select is((select count(*)::int from public.tenants), 1, '(2) perfis sem exigência de MFA seguem acessando');

-- =============================================================================
-- (5) Desativação com sessão aberta: as mesmas claims do JWT continuam em uso
-- =============================================================================
select tests.authenticate_as('intern.a@exemplo.test');
select is((select count(*)::int from public.tenants), 1, '(5) antes: estagiário acessa o escritório');
select is((select count(*)::int from public.profiles), 8, '(5) antes: estagiário vê a equipe');

select tests.authenticate_as('admin.a@exemplo.test');
select results_eq(
  format($$ select has_other_active_membership from public.update_member(%L, 'intern', 'disabled') $$,
         (select value from t_ctx where key = 'intern_a')),
  array[false], '(5) admin desativa o estagiário');

-- Mesma "sessão" (mesmo sub/aal no JWT), sem novo login:
select tests.authenticate_as('intern.a@exemplo.test');
select is((select count(*)::int from public.tenants), 0, '(5) depois: não vê mais o escritório');
select is((select count(*)::int from public.profiles where id <> tests.uid('intern.a@exemplo.test')), 0,
  '(5) depois: não vê mais a equipe');
select is((select count(*)::int from public.tenant_members where user_id <> tests.uid('intern.a@exemplo.test')), 0,
  '(5) depois: não vê mais os vínculos dos colegas');
select is((select count(*)::int from public.my_memberships()), 0, '(5) depois: não lista o escritório');
select throws_ok(
  format($$ select public.set_active_tenant(%L) $$, (select value from t_ctx where key = 'tenant_a')),
  '42501', null, '(5) depois: não consegue reativar o escritório por conta própria');
select throws_ok('select public.log_audit_event(''x.y'')', '42501', null, '(5) depois: não grava em nome do escritório');
select is((select status::text from public.tenant_members where user_id = tests.uid('intern.a@exemplo.test')), 'disabled',
  '(5) depois: enxerga apenas o próprio vínculo, marcado como desativado');

select tests.clear_authentication();
select ok(
  exists (select 1 from public.audit_logs
           where action = 'tenant_member.updated'
             and entity_id = (select value from t_ctx where key = 'intern_a')::text
             and actor_id = tests.uid('admin.a@exemplo.test')),
  '(5) a desativação ficou registrada na auditoria, com o autor');

-- Reativação devolve o acesso na hora.
select tests.authenticate_as('admin.a@exemplo.test');
select * from public.update_member((select value from t_ctx where key = 'intern_a'), 'intern', 'active');
select tests.authenticate_as('intern.a@exemplo.test');
select is((select count(*)::int from public.tenants), 1, '(5) reativado: volta a acessar sem novo login');
select is((select disabled_at from public.tenant_members where user_id = tests.uid('intern.a@exemplo.test')), null,
  '(5) reativado: data de desativação limpa');

select * from finish();
rollback;

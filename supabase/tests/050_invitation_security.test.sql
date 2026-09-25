-- Segurança do cadastro por convite (pedido de revisão da Fase 1):
--  (1) cadastro sem office_name e sem convite válido não vincula nem expõe dados;
--  (2) accept_invitation só vale para o e-mail do convite e só é chamável pelo servidor;
--  (3) convite expira, é de uso único e revogado não serve;
--  (4) o perfil é o do convite e ninguém se promove a admin.
begin;
\ir helpers/setup.psql

select plan(35);

select tests.seed_scenario();

create temp table t_ids (key text primary key, value uuid);
grant select, insert on t_ids to authenticated, service_role;

-- Convites do escritório A usados nos testes
select tests.authenticate_as_service_role();
insert into t_ids values
  ('inv_intern', public.create_invitation(tests.uid('admin.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'),
                                          'convidado.estagio@exemplo.test', 'intern', repeat('1', 64))),
  ('inv_client', public.create_invitation(tests.uid('lawyer.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'),
                                          'convidado.cliente@exemplo.test', 'client', repeat('2', 64))),
  ('inv_expira', public.create_invitation(tests.uid('admin.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'),
                                          'convidado.expira@exemplo.test', 'lawyer', repeat('3', 64))),
  ('inv_revoga', public.create_invitation(tests.uid('admin.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'),
                                          'convidado.revoga@exemplo.test', 'finance', repeat('4', 64)));
select tests.clear_authentication();

-- =============================================================================
-- (1) Cadastro sem office_name e sem convite válido
-- =============================================================================
-- Simula o Auth: INSERT sem office_name e app_metadata gravado depois.
select tests.create_user('avulso@exemplo.test');
update auth.users set raw_app_meta_data = '{"provider": "email", "invited": true}'
 where email = 'avulso@exemplo.test';

select is((select count(*)::int from public.tenant_members where user_id = tests.uid('avulso@exemplo.test')), 0,
  '(1) usuário avulso não tem vínculo com nenhum escritório');
select is((select active_tenant_id from public.profiles where id = tests.uid('avulso@exemplo.test')), null,
  '(1) usuário avulso não tem escritório ativo');
select is((select count(*)::int from public.tenants where created_by = tests.uid('avulso@exemplo.test')), 0,
  '(1) nenhum escritório foi criado para o usuário avulso');

select tests.authenticate_as('avulso@exemplo.test');
select is((select count(*)::int from public.tenants), 0, '(1) avulso não vê escritórios');
select results_eq('select user_id from public.tenant_members', 'select null::uuid where false',
  '(1) avulso não vê vínculos');
select results_eq('select id from public.profiles', array[tests.uid('avulso@exemplo.test')],
  '(1) avulso vê somente o próprio perfil');
select is((select count(*)::int from public.invitations), 0, '(1) avulso não vê convites');
select is((select count(*)::int from public.audit_logs), 0, '(1) avulso não vê a auditoria');
select is((select count(*)::int from public.my_memberships()), 0, '(1) avulso não lista escritórios');
select throws_ok(
  format($$ select public.set_active_tenant(%L) $$, tests.tenant_of('admin.a@exemplo.test')),
  '42501', null, '(1) avulso não consegue ativar um escritório existente');
select throws_ok(
  format($$ insert into public.tenant_members (tenant_id, user_id, role) values (%L, %L, 'admin') $$,
         tests.tenant_of('admin.a@exemplo.test'), tests.uid('avulso@exemplo.test')),
  '42501', null, '(1) avulso não consegue se inserir num escritório');
select throws_ok('select public.log_audit_event(''x.y'')', '42501', null,
  '(1) avulso não grava auditoria em nome de escritório algum');
select tests.clear_authentication();

-- =============================================================================
-- (2) accept_invitation: e-mail do convite e chamada restrita ao servidor
-- =============================================================================
select tests.create_user('convidado.estagio@exemplo.test');

select tests.authenticate_as('convidado.estagio@exemplo.test');
select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('1', 64), tests.uid('convidado.estagio@exemplo.test')),
  '42501', null, '(2) usuário logado não chama accept_invitation diretamente (só o servidor)');

select tests.authenticate_as_anon();
select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('1', 64), tests.uid('convidado.estagio@exemplo.test')),
  '42501', null, '(2) anônimo não chama accept_invitation');

select tests.authenticate_as_service_role();
select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('1', 64), tests.uid('avulso@exemplo.test')),
  'P0001', 'O convite pertence a outro e-mail.', '(2) convite recusado para usuário com outro e-mail');
select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('1', 64), tests.uid('lawyer.b@exemplo.test')),
  'P0001', 'O convite pertence a outro e-mail.', '(2) membro de outro escritório não usa o convite alheio');
select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('f', 64), tests.uid('convidado.estagio@exemplo.test')),
  'P0001', 'Convite inválido, expirado ou já utilizado.', '(2) token inexistente é recusado');
select is(
  public.accept_invitation(repeat('1', 64), tests.uid('convidado.estagio@exemplo.test')),
  tests.tenant_of('admin.a@exemplo.test'),
  '(2) convite aceito pelo usuário com o mesmo e-mail'
);

-- =============================================================================
-- (3) Expiração, uso único e revogação
-- =============================================================================
select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('1', 64), tests.uid('convidado.estagio@exemplo.test')),
  'P0001', 'Convite inválido, expirado ou já utilizado.', '(3) convite já usado não pode ser reutilizado');

select tests.clear_authentication();
select tests.create_user('convidado.expira@exemplo.test');
update public.invitations set expires_at = now() - interval '1 second'
 where id = (select value from t_ids where key = 'inv_expira');
select tests.authenticate_as_service_role();
select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('3', 64), tests.uid('convidado.expira@exemplo.test')),
  'P0001', 'Convite inválido, expirado ou já utilizado.', '(3) convite expirado é recusado');
select is((select status from public.get_invitation(repeat('3', 64))), 'expired', '(3) status do convite expirado');
select is(
  (select count(*)::int from public.tenant_members where user_id = tests.uid('convidado.expira@exemplo.test')),
  0, '(3) convite expirado não cria vínculo');

select tests.authenticate_as('admin.a@exemplo.test');
select public.revoke_invitation((select value from t_ids where key = 'inv_revoga'));
select tests.clear_authentication();
select tests.create_user('convidado.revoga@exemplo.test');
select tests.authenticate_as_service_role();
select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('4', 64), tests.uid('convidado.revoga@exemplo.test')),
  'P0001', 'Convite inválido, expirado ou já utilizado.', '(3) convite revogado é recusado');

-- =============================================================================
-- (4) Perfil definido no convite; ninguém se promove a admin
-- =============================================================================
select tests.clear_authentication();
select is(
  (select role::text from public.tenant_members
    where user_id = tests.uid('convidado.estagio@exemplo.test') and tenant_id = tests.tenant_of('admin.a@exemplo.test')),
  'intern', '(4) convidado recebe exatamente o perfil do convite (estagiário)');

select tests.create_user('convidado.cliente@exemplo.test');
select tests.authenticate_as_service_role();
select public.accept_invitation(repeat('2', 64), tests.uid('convidado.cliente@exemplo.test'));
select tests.clear_authentication();
select is(
  (select role::text from public.tenant_members where user_id = tests.uid('convidado.cliente@exemplo.test')),
  'client', '(4) convite feito por advogado gera perfil de cliente');

-- Tentativas de autopromoção
select tests.authenticate_as('convidado.estagio@exemplo.test');
select throws_ok(
  format($$ select * from public.update_member(%L, 'admin', 'active') $$,
         tests.member_id('convidado.estagio@exemplo.test', tests.tenant_of('admin.a@exemplo.test'))),
  '42501', null, '(4) estagiário não se promove via update_member');
select throws_ok($$ update public.tenant_members set role = 'admin' $$, '42501', null,
  '(4) estagiário não altera o próprio perfil diretamente');
select throws_ok(
  format($$ insert into public.tenant_members (tenant_id, user_id, role) values (%L, %L, 'admin') $$,
         tests.tenant_of('admin.b@exemplo.test'), tests.uid('convidado.estagio@exemplo.test')),
  '42501', null, '(4) estagiário não cria vínculo de admin em outro escritório');

select tests.authenticate_as('convidado.cliente@exemplo.test');
select throws_ok(
  format($$ select * from public.update_member(%L, 'admin', 'active') $$,
         tests.member_id('convidado.cliente@exemplo.test', tests.tenant_of('admin.a@exemplo.test'))),
  '42501', null, '(4) cliente não se promove via update_member');

select tests.authenticate_as('lawyer.a@exemplo.test');
select throws_ok(
  format($$ select * from public.update_member(%L, 'admin', 'active') $$,
         tests.member_id('lawyer.a@exemplo.test', tests.tenant_of('admin.a@exemplo.test'))),
  '42501', null, '(4) advogado não se promove a admin');
select throws_ok(
  format($$ select public.create_invitation(%L, %L, 'x@exemplo.test', 'admin', %L) $$,
         tests.uid('lawyer.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('5', 64)),
  '42501', null, '(4) advogado não cria convite (nem de admin) chamando a função diretamente');

select tests.authenticate_as_service_role();
select throws_ok(
  format($$ select public.create_invitation(%L, %L, 'x@exemplo.test', 'admin', %L) $$,
         tests.uid('lawyer.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('5', 64)),
  '42501', null, '(4) nem pelo servidor um advogado convida um admin');
select throws_ok(
  format($$ select public.create_invitation(%L, %L, 'x@exemplo.test', 'admin', %L) $$,
         tests.uid('convidado.estagio@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('6', 64)),
  '42501', null, '(4) estagiário convidado não convida ninguém');

select tests.clear_authentication();
select is(
  (select count(*)::int from public.tenant_members
    where tenant_id = tests.tenant_of('admin.a@exemplo.test') and role = 'admin'),
  1, '(4) o escritório A continua com um único admin após as tentativas');
select is(
  (select count(*)::int from public.invitations where role = 'admin'),
  0, '(4) nenhum convite de admin foi criado');

select * from finish();
rollback;

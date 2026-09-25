-- Isolamento multi-tenant: tenants, profiles e tenant_members.
begin;
\ir helpers/setup.psql

select plan(42);

select tests.seed_scenario();

-- -----------------------------------------------------------------------------
-- Cadastro
-- -----------------------------------------------------------------------------
select is(
  (select count(*)::int from public.tenant_members
    where user_id = tests.uid('admin.a@exemplo.test') and role = 'admin'),
  1,
  'autocadastro cria o escritório com quem se cadastrou como admin'
);

select isnt(tests.tenant_of('admin.a@exemplo.test'), tests.tenant_of('admin.b@exemplo.test'),
  'cada autocadastro cria um escritório novo');

-- O Auth grava app_metadata depois do INSERT: a decisão não pode depender dele.
select tests.create_user('sem.escritorio@exemplo.test');
update auth.users set raw_app_meta_data = '{"provider": "email"}' where email = 'sem.escritorio@exemplo.test';
select is(
  (select count(*)::int from public.tenant_members where user_id = tests.uid('sem.escritorio@exemplo.test')),
  0,
  'cadastro sem nome do escritório não cria escritório nem vínculo'
);
select isnt(
  (select id from public.profiles where email = 'sem.escritorio@exemplo.test'),
  null,
  'todo usuário novo ganha um perfil'
);

select tests.create_user('convidado@exemplo.test');
select is(
  (select count(*)::int from public.tenant_members where user_id = tests.uid('convidado@exemplo.test')),
  0,
  'usuário convidado não ganha vínculo nem escritório ao ser criado'
);

-- -----------------------------------------------------------------------------
-- tenants
-- -----------------------------------------------------------------------------
select tests.authenticate_as('admin.a@exemplo.test');
select results_eq(
  'select id from public.tenants',
  array[tests.tenant_of('admin.a@exemplo.test')],
  'admin A vê somente o escritório A'
);

select tests.authenticate_as('lawyer.b@exemplo.test');
select results_eq(
  'select id from public.tenants',
  array[tests.tenant_of('admin.b@exemplo.test')],
  'usuário do escritório B não vê o escritório A'
);

select tests.authenticate_as('client.a@exemplo.test');
select is((select count(*)::int from public.tenants), 1, 'cliente vê o próprio escritório');

select tests.authenticate_as_anon();
select throws_ok('select * from public.tenants', '42501', null, 'anônimo não tem acesso a escritórios');

-- MFA obrigatório para admin, lawyer e dpo
select tests.authenticate_as('admin.a@exemplo.test', 'aal1');
select is((select count(*)::int from public.tenants), 0, 'admin sem MFA (aal1) não acessa o escritório');

select tests.authenticate_as('lawyer.a@exemplo.test', 'aal1');
select is((select count(*)::int from public.tenant_members), 1,
  'advogado sem MFA vê apenas o próprio vínculo');

select tests.authenticate_as('intern.a@exemplo.test', 'aal1');
select is((select count(*)::int from public.tenants), 1, 'estagiário não depende de MFA');

-- Atualização
select tests.authenticate_as('admin.a@exemplo.test');
select lives_ok(
  $$ update public.tenants set name = 'Escritório A Renomeado' where true $$,
  'admin altera o nome do escritório'
);
select tests.clear_authentication();
select is((select name from public.tenants where id = tests.tenant_of('admin.a@exemplo.test')),
  'Escritório A Renomeado', 'alteração do admin persistida');

select tests.authenticate_as('lawyer.a@exemplo.test');
update public.tenants set name = 'Hack' where true;
select tests.clear_authentication();
select is((select name from public.tenants where id = tests.tenant_of('admin.a@exemplo.test')),
  'Escritório A Renomeado', 'advogado não altera o escritório');

select tests.authenticate_as('admin.b@exemplo.test');
update public.tenants set name = 'Hack' where id = tests.tenant_of('admin.a@exemplo.test');
select tests.clear_authentication();
select is((select name from public.tenants where id = tests.tenant_of('admin.a@exemplo.test')),
  'Escritório A Renomeado', 'admin de outro escritório não altera o escritório A');

select tests.authenticate_as('admin.a@exemplo.test');
select throws_ok(
  $$ update public.tenants set deleted_at = now() where true $$,
  '42501', null, 'admin não consegue excluir (soft delete) o escritório pela API'
);
select throws_ok($$ delete from public.tenants $$, '42501', null, 'DELETE em tenants é negado');
select throws_ok(
  $$ insert into public.tenants (name, slug) values ('Novo', 'novo') $$,
  '42501', null, 'INSERT direto em tenants é negado'
);

-- -----------------------------------------------------------------------------
-- tenant_members
-- -----------------------------------------------------------------------------
select tests.authenticate_as('reception.a@exemplo.test');
select is((select count(*)::int from public.tenant_members), 7, 'equipe vê os 7 vínculos do escritório A');

select tests.authenticate_as('client.a@exemplo.test');
select results_eq(
  'select user_id from public.tenant_members',
  array[tests.uid('client.a@exemplo.test')],
  'cliente vê somente o próprio vínculo'
);

select tests.authenticate_as('lawyer.b@exemplo.test');
select is(
  (select count(*)::int from public.tenant_members where tenant_id = tests.tenant_of('admin.a@exemplo.test')),
  0,
  'usuário do escritório B não vê membros do escritório A'
);

select tests.authenticate_as('admin.a@exemplo.test');
select throws_ok(
  $$ update public.tenant_members set role = 'admin' where true $$,
  '42501', null, 'UPDATE direto em tenant_members é negado (somente via update_member)'
);
select throws_ok(
  format($$ insert into public.tenant_members (tenant_id, user_id, role) values (%L, %L, 'admin') $$,
         tests.tenant_of('admin.a@exemplo.test'), tests.uid('lawyer.b@exemplo.test')),
  '42501', null, 'INSERT direto em tenant_members é negado'
);

-- -----------------------------------------------------------------------------
-- update_member: desativação imediata e proteção do último admin
-- -----------------------------------------------------------------------------
select tests.authenticate_as('lawyer.a@exemplo.test');
select throws_ok(
  format($$ select * from public.update_member(%L, 'admin', 'active') $$,
         tests.member_id('intern.a@exemplo.test', tests.tenant_of('admin.a@exemplo.test'))),
  '42501', null, 'advogado não gerencia membros'
);

select tests.authenticate_as('admin.b@exemplo.test');
select throws_ok(
  format($$ select * from public.update_member(%L, 'intern', 'disabled') $$,
         tests.member_id('lawyer.a@exemplo.test', tests.tenant_of('admin.a@exemplo.test'))),
  '42501', null, 'admin de outro escritório não gerencia membros do escritório A'
);

select tests.authenticate_as('admin.a@exemplo.test');
select throws_ok(
  format($$ select * from public.update_member(%L, 'lawyer', 'active') $$,
         tests.member_id('admin.a@exemplo.test', tests.tenant_of('admin.a@exemplo.test'))),
  'P0001', 'O escritório precisa ter ao menos um administrador ativo.',
  'último admin não pode ser rebaixado'
);

select tests.authenticate_as('lawyer.a@exemplo.test');
select is((select count(*)::int from public.tenants), 1, 'advogado ativo acessa o escritório');

select tests.authenticate_as('admin.a@exemplo.test');
select results_eq(
  format($$ select has_other_active_membership from public.update_member(%L, 'lawyer', 'disabled') $$,
         tests.member_id('lawyer.a@exemplo.test', tests.tenant_of('admin.a@exemplo.test'))),
  array[false],
  'admin desativa o advogado (sem outro vínculo ativo)'
);

select tests.authenticate_as('lawyer.a@exemplo.test');
select is((select count(*)::int from public.tenants), 0, 'advogado desativado perde o acesso imediatamente');
select is((select count(*)::int from public.profiles where id <> tests.uid('lawyer.a@exemplo.test')), 0,
  'advogado desativado não vê perfis de colegas');

select tests.clear_authentication();
select isnt(
  (select disabled_by from public.tenant_members
    where id = tests.member_id('lawyer.a@exemplo.test', tests.tenant_of('admin.a@exemplo.test'))),
  null, 'desativação preserva o vínculo e registra quem desativou'
);

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
select tests.authenticate_as('client.a@exemplo.test');
select results_eq('select id from public.profiles', array[tests.uid('client.a@exemplo.test')],
  'cliente vê somente o próprio perfil');

select tests.authenticate_as('finance.a@exemplo.test');
select is((select count(*)::int from public.profiles), 7, 'equipe vê os perfis do escritório ativo');
select is(
  (select count(*)::int from public.profiles where id = tests.uid('admin.b@exemplo.test')),
  0, 'equipe não vê perfis de outro escritório'
);

select lives_ok($$ update public.profiles set full_name = 'Financeiro A' where true $$,
  'usuário altera o próprio nome');
select tests.clear_authentication();
select is((select count(*)::int from public.profiles where full_name = 'Financeiro A'), 1,
  'somente o próprio perfil foi alterado');

select tests.authenticate_as('finance.a@exemplo.test');
select throws_ok(
  format($$ update public.profiles set active_tenant_id = %L $$, tests.tenant_of('admin.b@exemplo.test')),
  '42501', null, 'usuário não altera active_tenant_id diretamente'
);

-- -----------------------------------------------------------------------------
-- Escritório ativo (usuário com vínculo em dois escritórios)
-- -----------------------------------------------------------------------------
select tests.clear_authentication();
select tests.add_member('client.a@exemplo.test', tests.tenant_of('admin.b@exemplo.test'), 'client');

select tests.authenticate_as('client.a@exemplo.test');
select is((select count(*)::int from public.my_memberships()), 2, 'usuário lista seus dois escritórios');

select lives_ok(
  format($$ select public.set_active_tenant(%L) $$, tests.tenant_of('admin.b@exemplo.test')),
  'usuário troca para o escritório B'
);
select results_eq('select id from public.tenants', array[tests.tenant_of('admin.b@exemplo.test')],
  'após a troca, vê somente o escritório B');

select throws_ok(
  format($$ select public.set_active_tenant(%L) $$, gen_random_uuid()),
  '42501', null, 'não é possível ativar escritório sem vínculo'
);

select * from finish();
rollback;

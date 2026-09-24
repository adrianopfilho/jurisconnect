-- audit_logs: append-only, cadeia de hashes e visibilidade restrita a admin/dpo.
begin;
\ir helpers/setup.psql

select plan(20);

select tests.seed_scenario();

-- Eventos gerados pelo cadastro e por ações do usuário
select tests.authenticate_as('lawyer.a@exemplo.test');
select lives_ok(
  $$ select public.log_audit_event('client.viewed', 'client', 'c-123', '{"campo": "cpf"}') $$,
  'membro registra evento de auditoria'
);

select tests.authenticate_as('lawyer.b@exemplo.test');
select lives_ok(
  $$ select public.log_audit_event('client.viewed', 'client', 'c-999') $$,
  'membro do escritório B registra evento'
);

select tests.clear_authentication();
select is(
  (select actor_id from public.audit_logs where entity_id = 'c-123'),
  tests.uid('lawyer.a@exemplo.test'),
  'autor derivado da sessão'
);
select is(
  (select tenant_id from public.audit_logs where entity_id = 'c-123'),
  tests.tenant_of('admin.a@exemplo.test'),
  'escritório derivado da sessão'
);
select is(
  (select actor_role::text from public.audit_logs where entity_id = 'c-123'),
  'lawyer',
  'perfil do autor registrado'
);
select ok(
  exists (select 1 from public.audit_logs
           where tenant_id = tests.tenant_of('admin.a@exemplo.test') and action = 'tenant.created'),
  'criação do escritório foi auditada'
);

-- Leitura
select tests.authenticate_as('admin.a@exemplo.test');
select ok((select count(*) from public.audit_logs where entity_id = 'c-123') = 1, 'admin lê a auditoria do escritório');
select is((select count(*)::int from public.audit_logs where entity_id = 'c-999'), 0,
  'admin não lê a auditoria de outro escritório');

select tests.authenticate_as('dpo.a@exemplo.test');
select ok((select count(*) from public.audit_logs where entity_id = 'c-123') = 1, 'dpo lê a auditoria do escritório');

select tests.authenticate_as('lawyer.a@exemplo.test');
select is((select count(*)::int from public.audit_logs), 0, 'advogado não lê a auditoria');

select tests.authenticate_as('finance.a@exemplo.test');
select is((select count(*)::int from public.audit_logs), 0, 'financeiro não lê a auditoria');

select tests.authenticate_as('client.a@exemplo.test');
select is((select count(*)::int from public.audit_logs), 0, 'cliente não lê a auditoria');

select tests.authenticate_as('admin.a@exemplo.test', 'aal1');
select is((select count(*)::int from public.audit_logs), 0, 'admin sem MFA não lê a auditoria');

-- Imutabilidade
select tests.authenticate_as('admin.a@exemplo.test');
select throws_ok(
  $$ insert into public.audit_logs (action, hash) values ('fake.event', 'x') $$,
  '42501', null, 'INSERT direto é negado'
);
select throws_ok($$ update public.audit_logs set action = 'x.y' $$, '42501', null, 'UPDATE é negado');
select throws_ok($$ delete from public.audit_logs $$, '42501', null, 'DELETE é negado');

select tests.authenticate_as_service_role();
select throws_ok($$ delete from public.audit_logs $$, '42501', null, 'DELETE é negado até para service_role');

select tests.clear_authentication();
select throws_ok(
  $$ update public.audit_logs set action = 'x.y' where entity_id = 'c-123' $$,
  '42501', null, 'UPDATE é bloqueado por trigger até para o dono da tabela'
);

-- Integridade da cadeia
select tests.authenticate_as('admin.a@exemplo.test');
select is((select valid from public.verify_audit_chain()), true, 'cadeia de hashes íntegra');

select tests.authenticate_as('lawyer.a@exemplo.test');
select throws_ok($$ select * from public.verify_audit_chain() $$, '42501', null,
  'advogado não verifica a cadeia');

select * from finish();
rollback;

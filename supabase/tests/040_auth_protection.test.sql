-- Bloqueio após 5 falhas de login, desbloqueio pelo admin e rate limiting.
begin;
\ir helpers/setup.psql

select plan(14);

select tests.seed_scenario();

select tests.authenticate_as('admin.a@exemplo.test');
select throws_ok($$ select public.auth_register_failure('lawyer.a@exemplo.test') $$, '42501', null,
  'usuário autenticado não manipula o contador de falhas');
select throws_ok($$ select public.rate_limit_hit('x', 1, 60) $$, '42501', null,
  'usuário autenticado não manipula o rate limit');

select tests.authenticate_as_anon();
select throws_ok($$ select public.auth_login_locked_until('lawyer.a@exemplo.test') $$, '42501', null,
  'anônimo não consulta bloqueios');

select tests.authenticate_as_service_role();
select is((select locked_until from public.auth_register_failure('Lawyer.A@exemplo.test')), null, '1ª falha não bloqueia');
select public.auth_register_failure('lawyer.a@exemplo.test');
select public.auth_register_failure('lawyer.a@exemplo.test');
select is((select failures from public.auth_register_failure('lawyer.a@exemplo.test')), 4, 'falhas contadas sem diferenciar maiúsculas');
select is((select just_locked from public.auth_register_failure('lawyer.a@exemplo.test')), true, '5ª falha bloqueia a conta');
select ok(public.auth_login_locked_until('lawyer.a@exemplo.test') > now() + interval '14 minutes',
  'bloqueio de 15 minutos');
select is((select just_locked from public.auth_register_failure('lawyer.a@exemplo.test')), false,
  'falhas durante o bloqueio não o prolongam');

select tests.clear_authentication();
select ok(
  exists (select 1 from public.audit_logs
           where action = 'auth.account_locked' and tenant_id = tests.tenant_of('admin.a@exemplo.test')),
  'bloqueio auditado no escritório do usuário'
);

-- Visão e desbloqueio pelo admin
select tests.authenticate_as('admin.a@exemplo.test');
select is((select count(*)::int from public.locked_members()), 1, 'admin vê o membro bloqueado');

select tests.authenticate_as('admin.b@exemplo.test');
select is((select count(*)::int from public.locked_members()), 0, 'admin de outro escritório não vê o bloqueio');
select throws_ok(
  format($$ select public.unlock_member(%L) $$, tests.member_id('lawyer.a@exemplo.test', tests.tenant_of('admin.a@exemplo.test'))),
  '42501', null, 'admin de outro escritório não desbloqueia'
);

select tests.authenticate_as('admin.a@exemplo.test');
select public.unlock_member(tests.member_id('lawyer.a@exemplo.test', tests.tenant_of('admin.a@exemplo.test')));
select tests.authenticate_as_service_role();
select is(public.auth_login_locked_until('lawyer.a@exemplo.test'), null, 'admin desbloqueia o membro');

-- Rate limit
select public.rate_limit_hit('login:10.0.0.1', 2, 60);
select public.rate_limit_hit('login:10.0.0.1', 2, 60);
select is(public.rate_limit_hit('login:10.0.0.1', 2, 60), false, 'rate limit bloqueia acima do limite');

select * from finish();
rollback;

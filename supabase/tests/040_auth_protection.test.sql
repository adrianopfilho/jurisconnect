-- Bloqueio após 5 falhas de login (por e-mail + IP), desbloqueio pelo admin e rate limiting.
begin;
\ir helpers/setup.psql

select plan(19);

select tests.seed_scenario();

select tests.authenticate_as('admin.a@exemplo.test');
select throws_ok($$ select public.auth_register_failure('lawyer.a@exemplo.test') $$, '42501', null,
  'usuário autenticado não manipula o contador de falhas');
select throws_ok($$ select public.rate_limit_hit('x', 1, 60) $$, '42501', null,
  'usuário autenticado não manipula o rate limit');

select tests.authenticate_as_anon();
select throws_ok($$ select public.auth_login_locked_until('lawyer.a@exemplo.test') $$, '42501', null,
  'anônimo não consulta bloqueios');

-- Atacante (203.0.113.10) erra a senha do advogado 5 vezes
select tests.authenticate_as_service_role();
select is((select locked_until from public.auth_register_failure('Lawyer.A@exemplo.test', '203.0.113.10')), null,
  '1ª falha não bloqueia');
select public.auth_register_failure('lawyer.a@exemplo.test', '203.0.113.10');
select public.auth_register_failure('lawyer.a@exemplo.test', '203.0.113.10');
select is((select failures from public.auth_register_failure('lawyer.a@exemplo.test', '203.0.113.10')), 4,
  'falhas contadas sem diferenciar maiúsculas');
select is((select just_locked from public.auth_register_failure('lawyer.a@exemplo.test', '203.0.113.10')), true,
  '5ª falha bloqueia e-mail + IP do atacante');
select ok(public.auth_login_locked_until('lawyer.a@exemplo.test', '203.0.113.10') > now() + interval '14 minutes',
  'bloqueio de 15 minutos para a origem das falhas');
select is((select just_locked from public.auth_register_failure('lawyer.a@exemplo.test', '203.0.113.10')), false,
  'falhas durante o bloqueio não o prolongam');

-- O titular, de outro IP, não é travado pelo atacante
select is(public.auth_login_locked_until('lawyer.a@exemplo.test', '198.51.100.20'), null,
  'o mesmo e-mail continua liberado a partir de outro IP (o titular não é travado)');
select is((select failures from public.auth_register_failure('lawyer.a@exemplo.test', '198.51.100.20')), 1,
  'falhas de outro IP têm contagem própria');
select is(public.auth_login_locked_until('outra.pessoa@exemplo.test', '203.0.113.10'), null,
  'o IP bloqueado continua podendo tentar outras contas (limitadas pelo rate limit por IP)');

select tests.clear_authentication();
select ok(
  exists (select 1 from public.audit_logs
           where action = 'auth.account_locked' and tenant_id = tests.tenant_of('admin.a@exemplo.test')
             and ip = '203.0.113.10'),
  'bloqueio auditado no escritório do usuário, com o IP de origem'
);
select is((select count(*)::int from private.auth_throttle where email_hash ~ '@'), 0,
  'e-mail nunca é guardado em claro');

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
select is(public.auth_login_locked_until('lawyer.a@exemplo.test', '203.0.113.10'), null, 'admin desbloqueia o membro');

-- Login bem-sucedido limpa as falhas de todas as origens
select public.auth_register_failure('lawyer.a@exemplo.test', '192.0.2.1');
select public.auth_register_success(tests.uid('lawyer.a@exemplo.test'), '198.51.100.20');
select tests.clear_authentication();
select is(
  (select count(*)::int from private.auth_throttle where email_hash = encode(sha256(convert_to('lawyer.a@exemplo.test', 'UTF8')), 'hex')),
  0, 'login bem-sucedido zera as falhas do e-mail em todas as origens');

-- Rate limit
select tests.authenticate_as_service_role();
select public.rate_limit_hit('login:10.0.0.1', 2, 60);
select public.rate_limit_hit('login:10.0.0.1', 2, 60);
select is(public.rate_limit_hit('login:10.0.0.1', 2, 60), false, 'rate limit bloqueia acima do limite');

select * from finish();
rollback;

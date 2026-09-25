-- Convites: quem convida quem, token nunca legível, uso único e expiração.
begin;
\ir helpers/setup.psql

select plan(25);

select tests.seed_scenario();

create temp table t_ids (key text primary key, value uuid);
grant select, insert on t_ids to authenticated, service_role;

-- Criação (service_role em nome do autor)
select tests.authenticate_as_service_role();

select lives_ok(
  format($$ insert into t_ids values ('inv_lawyer', public.create_invitation(%L, %L, 'Novo.Advogado@exemplo.test', 'lawyer', %L)) $$,
         tests.uid('admin.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('a', 64)),
  'admin convida advogado'
);

select lives_ok(
  format($$ insert into t_ids values ('inv_client', public.create_invitation(%L, %L, 'novo.cliente@exemplo.test', 'client', %L)) $$,
         tests.uid('lawyer.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('b', 64)),
  'advogado convida cliente'
);

select throws_ok(
  format($$ select public.create_invitation(%L, %L, 'x@exemplo.test', 'intern', %L) $$,
         tests.uid('lawyer.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('c', 64)),
  '42501', null, 'advogado não convida membro da equipe'
);

select throws_ok(
  format($$ select public.create_invitation(%L, %L, 'x@exemplo.test', 'client', %L) $$,
         tests.uid('reception.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('c', 64)),
  '42501', null, 'recepção não convida'
);

select throws_ok(
  format($$ select public.create_invitation(%L, %L, 'x@exemplo.test', 'lawyer', %L) $$,
         tests.uid('admin.b@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('c', 64)),
  '42501', null, 'admin de outro escritório não convida para o escritório A'
);

select throws_ok(
  format($$ select public.create_invitation(%L, %L, 'lawyer.a@exemplo.test', 'intern', %L) $$,
         tests.uid('admin.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('c', 64)),
  'P0001', 'Este e-mail já possui vínculo com o escritório.', 'não convida quem já é membro'
);

select tests.clear_authentication();
select is((select email from public.invitations where id = (select value from t_ids where key = 'inv_lawyer')),
  'novo.advogado@exemplo.test', 'e-mail do convite normalizado em minúsculas');
select ok(
  (select expires_at between now() + interval '23 hours 59 minutes' and now() + interval '24 hours 1 minute'
     from public.invitations where id = (select value from t_ids where key = 'inv_lawyer')),
  'convite expira em 24 horas'
);

-- Leitura
select tests.authenticate_as('admin.a@exemplo.test');
select is((select count(*)::int from public.invitations), 2, 'admin vê os convites do escritório');
select throws_ok('select token_hash from public.invitations', '42501', null,
  'ninguém lê o hash do token pela API');

select tests.authenticate_as('lawyer.a@exemplo.test');
select results_eq('select role::text from public.invitations', array['client'],
  'advogado vê apenas convites de clientes');

select tests.authenticate_as('reception.a@exemplo.test');
select is((select count(*)::int from public.invitations), 0, 'recepção não vê convites');

select tests.authenticate_as('admin.b@exemplo.test');
select is((select count(*)::int from public.invitations), 0, 'admin de outro escritório não vê os convites');

select tests.authenticate_as('admin.a@exemplo.test');
select throws_ok(
  format($$ select public.create_invitation(%L, %L, 'y@exemplo.test', 'lawyer', %L) $$,
         tests.uid('admin.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('d', 64)),
  '42501', null, 'usuário autenticado não cria convite diretamente (somente o servidor)'
);
select throws_ok(
  format($$ select * from public.get_invitation(%L) $$, repeat('a', 64)),
  '42501', null, 'usuário autenticado não consulta convite pelo token'
);

-- Aceite
select tests.clear_authentication();
select tests.create_user('novo.advogado@exemplo.test');
select tests.create_user('intruso@exemplo.test');

select tests.authenticate_as_service_role();
select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('a', 64), tests.uid('intruso@exemplo.test')),
  'P0001', 'O convite pertence a outro e-mail.', 'convite não é aceito por outro e-mail'
);

select is(
  public.accept_invitation(repeat('a', 64), tests.uid('novo.advogado@exemplo.test')),
  tests.tenant_of('admin.a@exemplo.test'),
  'convidado aceita o convite'
);

select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('a', 64), tests.uid('novo.advogado@exemplo.test')),
  'P0001', 'Convite inválido, expirado ou já utilizado.', 'convite é de uso único'
);

select tests.clear_authentication();
select is(
  (select role::text from public.tenant_members
    where user_id = tests.uid('novo.advogado@exemplo.test') and tenant_id = tests.tenant_of('admin.a@exemplo.test')),
  'lawyer', 'vínculo criado com o perfil do convite'
);

-- Expiração
update public.invitations set expires_at = now() - interval '1 second'
 where id = (select value from t_ids where key = 'inv_client');
select tests.create_user('novo.cliente@exemplo.test');
select tests.authenticate_as_service_role();
select throws_ok(
  format($$ select public.accept_invitation(%L, %L) $$, repeat('b', 64), tests.uid('novo.cliente@exemplo.test')),
  'P0001', 'Convite inválido, expirado ou já utilizado.', 'convite expirado é recusado'
);
select is((select status from public.get_invitation(repeat('b', 64))), 'expired', 'status expirado');

-- Revogação
select lives_ok(
  format($$ insert into t_ids values ('inv_rev', public.create_invitation(%L, %L, 'revogar@exemplo.test', 'client', %L)) $$,
         tests.uid('admin.a@exemplo.test'), tests.tenant_of('admin.a@exemplo.test'), repeat('e', 64)),
  'admin convida cliente'
);

select tests.authenticate_as('lawyer.b@exemplo.test');
select throws_ok(
  format($$ select public.revoke_invitation(%L) $$, (select value from t_ids where key = 'inv_rev')),
  '42501', null, 'usuário de outro escritório não revoga o convite'
);

select tests.authenticate_as('lawyer.a@exemplo.test');
select lives_ok(
  format($$ select public.revoke_invitation(%L) $$, (select value from t_ids where key = 'inv_rev')),
  'advogado revoga convite de cliente'
);

select tests.authenticate_as_service_role();
select is((select status from public.get_invitation(repeat('e', 64))), 'revoked', 'convite revogado');

select * from finish();
rollback;

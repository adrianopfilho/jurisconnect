-- Testes de baseline do banco e guardas globais de RLS.
-- Estes testes valem para TODAS as fases: qualquer tabela futura no schema
-- public sem RLS ou sem política faz a suíte falhar.
begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

select has_extension('pgcrypto', 'pgcrypto instalado');

select is(
  (select count(*)::int
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity),
  0,
  'todas as tabelas dos schemas public e private têm RLS habilitado'
);

select is(
  (select count(*)::int
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
      and c.relkind in ('r', 'p')
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)),
  0,
  'todas as tabelas dos schemas public e private têm ao menos uma política'
);

select is(
  (select count(*)::int
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and not coalesce(
        (select bool_or(opt = 'security_invoker=true' or opt = 'security_invoker=on')
           from unnest(c.reloptions) opt),
        false)),
  0,
  'todas as views do schema public usam security_invoker (respeitam RLS)'
);

select * from finish();
rollback;

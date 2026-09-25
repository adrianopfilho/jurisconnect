# JurisConnect

Sistema SaaS multi-tenant de gestão para escritórios de advocacia, construído para cumprir a
LGPD (Lei 13.709/2018), o sigilo profissional (Lei 8.906/94) e o Código de Ética da OAB.

> As regras do projeto (stack, segurança e convenções) estão em [`CLAUDE.md`](./CLAUDE.md).

## Stack

- Next.js 15 (App Router) + TypeScript strict + Tailwind CSS 4 + shadcn/ui
- Supabase: Auth (MFA TOTP), Postgres com RLS, Storage privado, Edge Functions
- Zod, React Hook Form, TanStack Query
- Testes: Vitest, pgTAP, Playwright
- pnpm

## Primeiros passos

```bash
pnpm install
cp .env.example .env.local   # preencha com os valores de `pnpm db:start`
pnpm db:start                # sobe o Supabase local (requer Docker)
pnpm dev
```

## Comandos

| Comando                           | O que faz                                                          |
| --------------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                        | Ambiente local em http://localhost:3000                            |
| `pnpm lint` / `pnpm typecheck`    | ESLint e TypeScript (rodam também no pre-commit)                   |
| `pnpm format`                     | Formata o código com Prettier                                      |
| `pnpm test`                       | Testes unitários (Vitest)                                          |
| `pnpm e2e`                        | Testes end-to-end (Playwright)                                     |
| `pnpm db:start` / `pnpm db:reset` | Sobe / recria o banco local do Supabase                            |
| `pnpm db:test`                    | Testes pgTAP de RLS: **fluxo oficial** (`supabase test db`)        |
| `pnpm db:test:local`              | Testes pgTAP em Postgres puro, sem Docker (ver abaixo)             |
| `pnpm db:check`                   | Verifica se toda tabela nova tem RLS e política na mesma migration |
| `pnpm db:types`                   | Gera os tipos TypeScript do banco                                  |

### Usuários de exemplo (seed)

`pnpm db:reset` carrega dados **fictícios** (`supabase/seed.sql`), todos com a senha
`Exemplo@Senha2026`:

| E-mail                             | Escritório                      | Perfil        |
| ---------------------------------- | ------------------------------- | ------------- |
| `socia@modelo.test`                | Modelo Advocacia (fictício)     | Administrador |
| `advogado@modelo.test`             | Modelo Advocacia (fictício)     | Advogado      |
| `estagiaria@modelo.test`           | Modelo Advocacia (fictício)     | Estagiário    |
| `financeiro@modelo.test`           | Modelo Advocacia (fictício)     | Financeiro    |
| `recepcao@modelo.test`             | Modelo Advocacia (fictício)     | Recepção      |
| `dpo@modelo.test`                  | Modelo Advocacia (fictício)     | DPO           |
| `socio@exemplo-associados.test`    | Exemplo & Associados (fictício) | Administrador |
| `advogada@exemplo-associados.test` | Exemplo & Associados (fictício) | Advogado      |
| `cliente@pessoa.test`              | ambos                           | Cliente       |

Administradores, advogados e o DPO cadastram o MFA (TOTP) no primeiro login. Os e-mails (confirmação,
convites, avisos de bloqueio) chegam no Mailpit local: http://127.0.0.1:54324.

### pgTAP sem Docker

O fluxo oficial é `supabase test db`. Onde não há Docker, `pnpm db:test:local` cria um banco
temporário num PostgreSQL 15+ local, aplica um **shim mínimo do Supabase**
(`scripts/db-local/supabase-shim.sql`: papéis `anon`/`authenticated`/`service_role`, schema
`auth` com `auth.uid()`/`auth.jwt()`), as migrations, o seed e roda `supabase/tests` com
`pg_prove`.

Requisitos: `postgresql-XX-pgtap` e `pg_prove` (`libtap-parser-sourcehandler-pgtap-perl`).
A conexão usa as variáveis do libpq (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`).

O shim existe **somente** em `scripts/`. `pnpm db:check` falha se alguma migration tentar
criar o schema `auth` ou objetos nele.

### Playwright com Chromium já instalado

Defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/caminho/do/chrome` para usar um navegador existente em
vez de `pnpm exec playwright install chromium`.

## Modo protótipo (demonstração navegável)

Com `NEXT_PUBLIC_PROTOTYPE=true` o app roda **sem Supabase e sem nenhuma outra variável**, com
dados fictícios, para validar layout e fluxos:

```bash
NEXT_PUBLIC_PROTOTYPE=true pnpm dev   # ou: pnpm build && pnpm start com a mesma variável
```

Abra http://localhost:3000 e clique em **Entrar na demonstração** (login de demonstração, sem senha).
Telas: painel, clientes (lista e ficha), processos (lista e ficha com timeline), agenda de prazos,
financeiro resumido e portal do cliente.

Garantias:

- As rotas ficam em `src/app/(prototype)/prototipo` e os dados em `src/features/<módulo>/mocks`.
- Sem a variável, `/prototipo` responde 404 (middleware, layout e rotas verificam o modo).
- Com a variável, o sistema real (`/app`, `/login`, `/portal`…) fica inacessível e nenhuma
  chamada ao Supabase é feita; o e2e `e2e/prototype` falha se houver qualquer requisição a ele.
- O ESLint impede importar `mocks` fora das páginas do protótipo e dos testes.
- CPF continua mascarado por padrão; a CSP e os headers de segurança continuam ativos.

## Estrutura

```
src/
  app/
    (public)/    páginas públicas: início, política de privacidade, termos, cookies
    (auth)/      login, cadastro, MFA, recuperação de senha
    (app)/       área interna do escritório (sidebar)
    (portal)/    portal do cliente
  components/
    ui/          componentes shadcn/ui
    layout/      tema, sidebar, cabeçalhos
  features/      um diretório por módulo: components/, hooks/, services/, schemas/
  hooks/         hooks compartilhados
  lib/
    config/      locale pt-BR, fuso America/Recife, formatação de data e moeda
    env/         validação de variáveis de ambiente (Zod)
    security/    headers HTTP e CSP
    supabase/    clientes browser, server, middleware e admin (server-only)
    validation/  schemas Zod compartilhados (CPF, CNPJ, CNJ...)
supabase/
  migrations/    migrations versionadas (toda tabela nasce com RLS + políticas)
  tests/         testes pgTAP
  functions/     Edge Functions (Deno)
  seed.sql       dados de exemplo FICTÍCIOS
scripts/         utilitários de desenvolvimento (shim local, verificação de migrations)
e2e/             testes Playwright
```

## Segurança

- Nenhum segredo no repositório: use `.env.local` (ignorado pelo git); `.env.example` documenta as variáveis.
- A `SUPABASE_SERVICE_ROLE_KEY` só é lida em `src/lib/env/server.ts`/`src/lib/supabase/admin.ts`,
  protegidos por `server-only` (o build falha se forem importados no client).
- CSP com nonce por requisição e headers de segurança em todas as rotas.
- Bloqueio de login por **e-mail + IP** (5 falhas em 15 min bloqueiam aquela combinação por 15 min,
  com aviso por e-mail ao titular). O IP vem só de header confiável: `x-real-ip` na Vercel, ou o
  header definido em `TRUSTED_IP_HEADER` em outra hospedagem; sem isso o bloqueio vale por e-mail.

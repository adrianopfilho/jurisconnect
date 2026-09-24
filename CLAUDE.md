# JurisConnect — Regras do Projeto

## O que é
Sistema SaaS multi-tenant de gestão para escritórios de advocacia no Brasil. Lida com dados pessoais e sensíveis de clientes e partes processuais. Deve cumprir a LGPD (Lei 13.709/2018), o sigilo profissional (Lei 8.906/94) e o Código de Ética da OAB.

## Stack (não trocar sem perguntar)
- Next.js 15 (App Router) + TypeScript strict + Tailwind + shadcn/ui
- Supabase: Auth, Postgres com RLS, Storage privado, Edge Functions
- Supabase CLI com migrations versionadas em supabase/migrations
- Zod para validação, React Hook Form para formulários, TanStack Query para dados
- Testes: Vitest (unitários), pgTAP (políticas RLS), Playwright (e2e)
- pnpm como gerenciador de pacotes

## Comandos
- pnpm dev — ambiente local
- pnpm lint && pnpm typecheck — rodar antes de todo commit
- pnpm test — testes unitários
- supabase start / supabase db reset — banco local
- supabase test db — testes pgTAP de RLS
- pnpm e2e — testes Playwright

## Regras de segurança INEGOCIÁVEIS
1. Toda tabela nova nasce com RLS habilitado E políticas na MESMA migration. Nunca criar tabela sem política.
2. Toda tabela de negócio tem tenant_id; toda política filtra por tenant_id do usuário autenticado.
3. Toda nova tabela ou política ganha teste pgTAP provando que: usuário de outro tenant NÃO lê; perfil sem permissão NÃO lê; perfil correto lê.
4. Nunca usar a service_role key no client. Operações privilegiadas só em Edge Functions ou Server Actions no servidor.
5. Nenhum segredo commitado. Usar .env.local e manter .env.example atualizado.
6. Storage sempre privado; acesso somente por signed URLs com expiração de 5 minutos.
7. Toda ação sensível (ver, editar, exportar, excluir, revelar dado mascarado, baixar documento) grava em audit_logs via função do banco. audit_logs é append-only: sem UPDATE/DELETE para nenhum perfil.
8. Exclusão é sempre soft delete (deleted_at, deleted_by). Exclusão definitiva só pelo fluxo de eliminação LGPD.
9. CPF, RG e dados sensíveis exibidos mascarados por padrão.
10. Validar entradas com Zod no client E no servidor.
11. Dados de exemplo (seed) sempre fictícios.

## Convenções
- Interface em português do Brasil; código, nomes de tabelas e variáveis em inglês.
- Datas dd/mm/aaaa, moeda R$, fuso America/Recife.
- Commits no padrão Conventional Commits, um commit por etapa concluída.
- Componentes pequenos, lógica de dados em hooks/services, sem any.

## Forma de trabalhar
- Antes de cada fase, apresentar o plano e aguardar aprovação.
- Ao terminar uma fase: rodar lint, typecheck e todos os testes; corrigir falhas; resumir o que foi feito, listar as políticas RLS criadas e PARAR para confirmação.
- Em dúvida sobre regra jurídica ou de negócio, perguntar em vez de supor.

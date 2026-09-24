-- Fase 0: baseline do banco.
-- Somente extensões; nenhuma tabela é criada nesta migration.
-- pgTAP NÃO é instalado aqui: ele é criado dentro de cada arquivo de teste
-- (supabase/tests), para nunca existir no banco de produção.

-- pgcrypto: hashing e criptografia de colunas sensíveis (dados de saúde e criminais).
create extension if not exists pgcrypto with schema extensions;

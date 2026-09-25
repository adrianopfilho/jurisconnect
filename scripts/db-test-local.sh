#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Testes pgTAP em Postgres local, SEM Docker/Supabase CLI.
# Alternativa ao fluxo oficial (`pnpm db:test` = `supabase test db`).
#
# 1. Cria um banco temporário
# 2. Aplica o shim do Supabase (scripts/db-local/supabase-shim.sql)
# 3. Aplica supabase/migrations/*.sql em ordem
# 4. Roda supabase/tests/**/*.sql com pg_prove
# 5. Remove o banco temporário
#
# Requisitos: PostgreSQL 15+ com pgTAP instalado (pacote postgresql-XX-pgtap)
# e pg_prove (pacote libtap-parser-sourcehandler-pgtap-perl).
# Conexão pelas variáveis padrão do libpq: PGHOST, PGPORT, PGUSER, PGPASSWORD.
# -----------------------------------------------------------------------------
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"
DB_NAME="${JC_TEST_DB:-jurisconnect_test_$$}"

for bin in psql pg_prove pg_isready; do
  command -v "$bin" >/dev/null || { echo "Erro: '$bin' não encontrado no PATH." >&2; exit 1; }
done

pg_isready -q || { echo "Erro: Postgres não está respondendo em $PGHOST:$PGPORT." >&2; exit 1; }

cleanup() {
  psql -q -d postgres -c "drop database if exists \"$DB_NAME\" with (force);" >/dev/null 2>&1 || true
}
trap cleanup EXIT

psql -q -v ON_ERROR_STOP=1 -d postgres -c "create database \"$DB_NAME\";" >/dev/null

run_sql() {
  psql -q -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$1" >/dev/null
}

echo "==> Shim local do Supabase"
run_sql "$ROOT_DIR/scripts/db-local/supabase-shim.sql"

echo "==> Migrations"
shopt -s nullglob
migrations=("$ROOT_DIR"/supabase/migrations/*.sql)
for file in "${migrations[@]}"; do
  echo "    $(basename "$file")"
  run_sql "$file"
done

seed="$ROOT_DIR/supabase/seed.sql"
if [[ "${JC_SKIP_SEED:-0}" != "1" && -f "$seed" ]]; then
  echo "==> Seed"
  run_sql "$seed"
fi

echo "==> Testes pgTAP"
mapfile -t tests < <(find "$ROOT_DIR/supabase/tests" -type f -name '*.sql' | sort)
if [[ ${#tests[@]} -eq 0 ]]; then
  echo "Nenhum teste encontrado em supabase/tests." >&2
  exit 1
fi
pg_prove --dbname "$DB_NAME" --failures "${tests[@]}"

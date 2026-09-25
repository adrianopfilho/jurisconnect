#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Gera src/lib/supabase/database.types.ts sem Docker/Supabase CLI.
# Alternativa ao fluxo oficial (`pnpm db:types` = `supabase gen types --local`).
# Cria um banco temporário, aplica o shim e as migrations e faz a introspecção.
# Conexão pelas variáveis padrão do libpq: PGHOST, PGPORT, PGUSER, PGPASSWORD.
# -----------------------------------------------------------------------------
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"
DB_NAME="jurisconnect_types_$$"
OUT="$ROOT_DIR/src/lib/supabase/database.types.ts"

cleanup() {
  psql -q -d postgres -c "drop database if exists \"$DB_NAME\" with (force);" >/dev/null 2>&1 || true
}
trap cleanup EXIT

psql -q -v ON_ERROR_STOP=1 -d postgres -c "create database \"$DB_NAME\";" >/dev/null
psql -q -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$ROOT_DIR/scripts/db-local/supabase-shim.sql" >/dev/null
for file in "$ROOT_DIR"/supabase/migrations/*.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$file" >/dev/null
done

url="postgres://${PGUSER}${PGPASSWORD:+:$PGPASSWORD}@${PGHOST}:${PGPORT}/${DB_NAME}"
DATABASE_URL="$url" node "$ROOT_DIR/scripts/db-local/gen-types.mjs" > "$OUT"
pnpm exec prettier --write "$OUT" >/dev/null
echo "Tipos gerados em ${OUT#"$ROOT_DIR"/}"

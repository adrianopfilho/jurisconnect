#!/usr/bin/env node
/**
 * Verificação estática das migrations (regras 1 e 2 do CLAUDE.md e isolamento do shim local).
 *
 * Falha se alguma migration em supabase/migrations:
 *  - criar tabela sem habilitar RLS e sem política NA MESMA migration;
 *  - tentar criar/alterar o schema auth ou suas funções (isso é do Supabase;
 *    o shim de testes locais vive só em scripts/db-local).
 *
 * É uma checagem heurística e complementar: a garantia final são os testes pgTAP.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(import.meta.dirname, "..", "supabase", "migrations");

const stripComments = (sql) => sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

const normalizeName = (raw) => {
  const name = raw.replace(/"/g, "").toLowerCase();
  return name.includes(".") ? name : `public.${name}`;
};

const IDENT = String.raw`((?:"[^"]+"|[\w]+)(?:\s*\.\s*(?:"[^"]+"|[\w]+))?)`;
const createTableRe = new RegExp(
  String.raw`create\s+(?:unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?${IDENT}`,
  "gi",
);
const enableRlsRe = new RegExp(
  String.raw`alter\s+table\s+(?:only\s+)?(?:if\s+exists\s+)?${IDENT}\s+enable\s+row\s+level\s+security`,
  "gi",
);
const policyRe = new RegExp(String.raw`create\s+policy\s+(?:"[^"]+"|\w+)\s+on\s+${IDENT}`, "gi");
const forbiddenAuthRe =
  /create\s+schema\s+(?:if\s+not\s+exists\s+)?"?auth"?\b|create\s+(?:or\s+replace\s+)?function\s+"?auth"?\s*\.|create\s+table\s+(?:if\s+not\s+exists\s+)?"?auth"?\s*\./i;

const collect = (re, sql) => new Set([...sql.matchAll(re)].map((m) => normalizeName(m[1])));

const errors = [];
const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  const sql = stripComments(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));

  if (forbiddenAuthRe.test(sql)) {
    errors.push(
      `${file}: migrations não podem criar o schema auth nem objetos nele (use o Supabase real; o shim fica em scripts/db-local).`,
    );
  }

  const tables = collect(createTableRe, sql);
  const rls = collect(enableRlsRe, sql);
  const policies = collect(policyRe, sql);

  for (const table of tables) {
    if (!rls.has(table))
      errors.push(`${file}: tabela ${table} criada sem "enable row level security".`);
    if (!policies.has(table))
      errors.push(`${file}: tabela ${table} criada sem nenhuma política (create policy).`);
  }
}

if (errors.length > 0) {
  console.error(
    "Falha na verificação das migrations:\n" + errors.map((e) => `  - ${e}`).join("\n"),
  );
  process.exit(1);
}

console.log(`Migrations OK (${files.length} arquivo(s) verificados).`);

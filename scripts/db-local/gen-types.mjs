#!/usr/bin/env node
// Gera os tipos TypeScript do banco com o mesmo motor do `supabase gen types`
// (@supabase/postgrest-typegen), a partir de um Postgres já migrado.
// Uso: DATABASE_URL=postgres://... node scripts/db-local/gen-types.mjs
import pg from "pg";
import { introspect } from "@supabase/postgrest-typegen/introspection";
import { generateTypescript, sortGeneratorMetadata } from "@supabase/postgrest-typegen/generation";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const metadata = await introspect(pool, { includedSchemas: ["public"] });
  const types = await generateTypescript(sortGeneratorMetadata(metadata), {
    postgrestVersion: process.env.POSTGREST_VERSION ?? "13",
  });
  process.stdout.write(types);
} finally {
  await pool.end();
}

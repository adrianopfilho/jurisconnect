import { parseEnv, publicEnvSchema, type PublicEnv } from "./schema";

let cached: PublicEnv | undefined;

/**
 * Variáveis públicas validadas. Lidas sob demanda (não no carregamento do
 * módulo) para que o modo protótipo funcione sem nenhuma variável do Supabase.
 * Referências estáticas são obrigatórias para o Next.js embutir os valores no client.
 */
export function getPublicEnv(): PublicEnv {
  cached ??= parseEnv(
    publicEnvSchema,
    {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    "públicas",
  );
  return cached;
}

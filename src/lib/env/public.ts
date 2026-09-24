import { parseEnv, publicEnvSchema } from "./schema";

// Referências estáticas são obrigatórias para o Next.js embutir as variáveis no bundle do client.
export const publicEnv = parseEnv(
  publicEnvSchema,
  {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  "públicas",
);

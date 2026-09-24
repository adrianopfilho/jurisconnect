import { z } from "zod";

/** Variáveis expostas ao navegador (prefixo NEXT_PUBLIC_). Nunca colocar segredos aqui. */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

/** Variáveis exclusivas do servidor. */
export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseEnv<T extends z.ZodType>(
  schema: T,
  values: unknown,
  scope: string,
): z.infer<T> {
  const result = schema.safeParse(values);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Variáveis de ambiente (${scope}) ausentes ou inválidas: ${fields}`);
  }
  return result.data;
}

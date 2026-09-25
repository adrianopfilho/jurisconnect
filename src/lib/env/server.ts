import "server-only";

import { parseEnv, serverEnvSchema } from "./schema";

/**
 * Segredos do servidor. O import "server-only" faz o build falhar se este
 * arquivo for importado por um Client Component.
 */
export function getServerEnv() {
  return parseEnv(
    serverEnvSchema,
    { SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY },
    "servidor",
  );
}

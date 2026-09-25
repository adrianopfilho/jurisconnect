import "server-only";

import { emailEnvSchema, parseEnv, serverEnvSchema } from "./schema";

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

export function getEmailEnv() {
  return parseEnv(
    emailEnvSchema,
    {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER || undefined,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD || undefined,
      SMTP_FROM: process.env.SMTP_FROM,
    },
    "e-mail",
  );
}

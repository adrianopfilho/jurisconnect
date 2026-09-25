import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const RATE_LIMITS = {
  signIn: { limit: 20, windowSeconds: 5 * 60 },
  signUp: { limit: 5, windowSeconds: 60 * 60 },
  passwordReset: { limit: 5, windowSeconds: 15 * 60 },
  invitationAccept: { limit: 10, windowSeconds: 15 * 60 },
  invitationCreate: { limit: 30, windowSeconds: 60 * 60 },
} as const;

/**
 * Registra uma requisição no bucket e informa se está dentro do limite.
 * Falha fechada: se o banco não responder, a requisição é negada.
 */
export async function checkRateLimit(
  name: keyof typeof RATE_LIMITS,
  key: string | undefined,
): Promise<boolean> {
  const { limit, windowSeconds } = RATE_LIMITS[name];
  const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
    p_bucket: `${name}:${key ?? "desconhecido"}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) return false;
  return data === true;
}

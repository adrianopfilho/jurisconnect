/** Testes que dependem do Supabase local (Auth + Mailpit) só rodam com E2E_SUPABASE=1. */
export const hasSupabase = process.env.E2E_SUPABASE === "1";

export const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

/** Senha dos usuários fictícios do seed (supabase/seed.sql). */
export const SEED_PASSWORD = "Exemplo@Senha2026";

export const STRONG_PASSWORD = "Teste@Segura2026";

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@exemplo.test`;
}

import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicEnv } from "@/lib/env/public";
import { getRequestMeta } from "@/lib/http/request";

import { type Database } from "./database.types";

/**
 * Cliente para Server Components, Server Actions e Route Handlers, autenticado
 * com a sessão do usuário (cookies). Sujeito às políticas RLS.
 * Repassa o IP do usuário ao banco (x-jc-client-ip) para a trilha de auditoria.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { ip, userAgent } = await getRequestMeta();

  const forwarded: Record<string, string> = {};
  if (ip) forwarded["x-jc-client-ip"] = ip;
  if (userAgent) forwarded["user-agent"] = userAgent;

  return createServerClient<Database>(
    getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
    getPublicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: forwarded },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado a partir de um Server Component: o middleware renova a sessão.
          }
        },
      },
    },
  );
}

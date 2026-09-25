import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env/public";
import { getServerEnv } from "@/lib/env/server";

import { type Database } from "./database.types";

/**
 * Cliente com service_role: IGNORA RLS.
 * Uso restrito a Server Actions/Route Handlers para operações privilegiadas e
 * auditadas. Nunca importar em Client Components (o "server-only" bloqueia o build).
 */
export function createAdminClient() {
  return createClient<Database>(
    getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );
}

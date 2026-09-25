import { createBrowserClient } from "@supabase/ssr";

import { getPublicEnv } from "@/lib/env/public";

import { type Database } from "./database.types";

/** Cliente para Client Components. Usa apenas a anon key; toda autorização é feita por RLS. */
export function createClient() {
  return createBrowserClient<Database>(
    getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
    getPublicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

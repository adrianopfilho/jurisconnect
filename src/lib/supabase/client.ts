import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env/public";

import { type Database } from "./database.types";

/** Cliente para Client Components. Usa apenas a anon key; toda autorização é feita por RLS. */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/** Nome do usuário autenticado (perfil próprio, via RLS). */
export const getOwnProfileName = cache(async (userId: string): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.full_name ?? null;
});

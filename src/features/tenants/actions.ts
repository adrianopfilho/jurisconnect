"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { fail, type ActionResult } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";

const switchTenantSchema = z.object({ tenantId: z.uuid() });

export async function switchTenantAction(input: { tenantId: string }): Promise<ActionResult> {
  const parsed = switchTenantSchema.safeParse(input);
  if (!parsed.success) return fail("Escritório inválido.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_active_tenant", { p_tenant_id: parsed.data.tenantId });
  if (error) return fail("Não foi possível acessar este escritório.");

  redirect("/app");
}

import "server-only";

import { type AppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

import { AUDIT_PAGE_SIZE, recifeDayBoundary, type AuditFilters } from "./schemas";

export type AuditRow = {
  id: number;
  createdAt: string;
  actorName: string | null;
  actorRole: AppRole | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ip: string | null;
};

export async function listAuditLogs(
  tenantId: string,
  filters: AuditFilters,
): Promise<{ rows: AuditRow[]; total: number }> {
  const supabase = await createClient();
  const from = (filters.pagina - 1) * AUDIT_PAGE_SIZE;

  let query = supabase
    .from("audit_logs")
    .select("id, created_at, actor_id, actor_role, action, entity_type, entity_id, ip", {
      count: "exact",
    })
    .eq("tenant_id", tenantId)
    .order("id", { ascending: false })
    .range(from, from + AUDIT_PAGE_SIZE - 1);

  if (filters.de) query = query.gte("created_at", recifeDayBoundary(filters.de, "start"));
  if (filters.ate) query = query.lte("created_at", recifeDayBoundary(filters.ate, "end"));
  if (filters.usuario) query = query.eq("actor_id", filters.usuario);
  if (filters.acao) query = query.like("action", `${filters.acao}%`);

  const { data, count, error } = await query;
  if (error) throw new Error("Não foi possível carregar a auditoria.");

  const actorIds = [
    ...new Set((data ?? []).map((r) => r.actor_id).filter((id): id is string => Boolean(id))),
  ];
  const { data: profiles } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] as { id: string; full_name: string }[] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return {
    total: count ?? 0,
    rows: (data ?? []).map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      actorName: r.actor_id ? (names.get(r.actor_id) ?? "Usuário externo") : null,
      actorRole: r.actor_role,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      ip: typeof r.ip === "string" ? r.ip : null,
    })),
  };
}

export async function listTenantPeople(tenantId: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", tenantId);
  const ids = (members ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids)
    .order("full_name");
  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name }));
}

export async function verifyAuditChain(): Promise<{ valid: boolean; checked: number } | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("verify_audit_chain").maybeSingle();
  return data ? { valid: data.valid, checked: data.checked } : null;
}

/** Consultar a auditoria também é registrado na auditoria. */
export async function recordAuditView(filters: AuditFilters): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("log_audit_event", {
    p_action: "audit_log.viewed",
    p_entity_type: "audit_log",
    p_metadata: { filters },
  });
}

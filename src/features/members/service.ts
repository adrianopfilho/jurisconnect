import "server-only";

import { type AppRole, type MemberStatus } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type MemberRow = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: AppRole;
  status: MemberStatus;
  createdAt: string;
  lockedUntil: string | null;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: AppRole;
  expiresAt: string;
  createdAt: string;
};

/** Membros do escritório ativo (RLS garante o escopo). */
export async function listMembers(tenantId: string, includeLocks: boolean): Promise<MemberRow[]> {
  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from("tenant_members")
    .select("id, user_id, role, status, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at");
  if (error) throw new Error("Não foi possível carregar os membros.");

  const userIds = (members ?? []).map((m) => m.user_id);
  const [{ data: profiles }, locks] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, full_name, email").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; email: string }[] }),
    includeLocks
      ? supabase.rpc("locked_members")
      : Promise.resolve({ data: [] as { member_id: string; locked_until: string }[] }),
  ]);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const lockByMember = new Map((locks.data ?? []).map((l) => [l.member_id, l.locked_until]));

  return (members ?? []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    fullName: byId.get(m.user_id)?.full_name ?? "—",
    email: byId.get(m.user_id)?.email ?? "—",
    role: m.role,
    status: m.status,
    createdAt: m.created_at,
    lockedUntil: lockByMember.get(m.id) ?? null,
  }));
}

/** Convites pendentes visíveis ao usuário (admin: todos; advogado: de clientes). */
export async function listPendingInvitations(tenantId: string): Promise<PendingInvitation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role, expires_at, created_at")
    .eq("tenant_id", tenantId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os convites.");

  return (data ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    expiresAt: i.expires_at,
    createdAt: i.created_at,
  }));
}

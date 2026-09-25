import { type Database } from "@/lib/supabase/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type MemberStatus = Database["public"]["Enums"]["member_status"];

export const APP_ROLES = [
  "admin",
  "lawyer",
  "intern",
  "finance",
  "reception",
  "dpo",
  "client",
] as const satisfies readonly AppRole[];

export const STAFF_ROLES = [
  "admin",
  "lawyer",
  "intern",
  "finance",
  "reception",
  "dpo",
] as const satisfies readonly AppRole[];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador (sócio)",
  lawyer: "Advogado",
  intern: "Estagiário",
  finance: "Financeiro",
  reception: "Recepção",
  dpo: "Encarregado (DPO)",
  client: "Cliente",
};

/** Perfis que exigem MFA (TOTP) — espelha private.role_requires_mfa() no banco. */
export function roleRequiresMfa(role: AppRole): boolean {
  return role === "admin" || role === "lawyer";
}

/** Espelha private.can_invite() no banco. */
export function canInvite(inviter: AppRole, target: AppRole): boolean {
  return inviter === "admin" || (inviter === "lawyer" && target === "client");
}

export function invitableRoles(inviter: AppRole): AppRole[] {
  return APP_ROLES.filter((role) => canInvite(inviter, role));
}

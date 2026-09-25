import "server-only";

import { type AppRole } from "@/lib/auth/roles";
import { hashToken } from "@/lib/crypto/token";
import { createAdminClient } from "@/lib/supabase/admin";

import { invitationTokenSchema } from "./schemas";

export type InvitationStatus = "pending" | "expired" | "accepted" | "revoked";

export type InvitationView = {
  tenantName: string;
  email: string;
  role: AppRole;
  expiresAt: string;
  status: InvitationStatus;
  accountExists: boolean;
};

/** Busca o convite pelo token (somente o hash é consultado no banco). */
export async function findInvitation(token: string): Promise<InvitationView | null> {
  if (!invitationTokenSchema.safeParse(token).success) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .rpc("get_invitation", { p_token_hash: hashToken(token) })
    .maybeSingle();
  if (!data) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .maybeSingle();

  return {
    tenantName: data.tenant_name,
    email: data.email,
    role: data.role,
    expiresAt: data.expires_at,
    status: data.status as InvitationStatus,
    accountExists: Boolean(profile),
  };
}

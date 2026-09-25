"use server";

import { revalidatePath } from "next/cache";

import { fail, fromZodError, ok, type ActionResult } from "@/lib/actions/result";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { canInvite } from "@/lib/auth/roles";
import { requireActiveMember } from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/crypto/token";
import { sendEmail } from "@/lib/email/send";
import { invitationEmail } from "@/lib/email/templates";
import { getPublicEnv } from "@/lib/env/public";
import { getRequestMeta } from "@/lib/http/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  idSchema,
  inviteMemberSchema,
  updateMemberSchema,
  type InviteMemberInput,
  type UpdateMemberInput,
} from "./schemas";

const MEMBERS_PATH = "/app/usuarios";

export async function inviteMemberAction(input: InviteMemberInput): Promise<ActionResult> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const ctx = await requireActiveMember({ area: "app", roles: ["admin", "lawyer"] });
  const { email, role } = parsed.data;
  if (!canInvite(ctx.active.role, role))
    return fail("Você não tem permissão para convidar este perfil.");
  if (ctx.aal !== "aal2")
    return fail("Confirme sua identidade com o segundo fator antes de convidar.");
  if (!(await checkRateLimit("invitationCreate", ctx.userId))) {
    return fail("Limite de convites atingido. Tente novamente mais tarde.");
  }

  const token = generateToken();
  const { ip, userAgent } = await getRequestMeta();
  const admin = createAdminClient();

  const { data: invitationId, error } = await admin.rpc("create_invitation", {
    p_actor_id: ctx.userId,
    p_tenant_id: ctx.active.tenantId,
    p_email: email,
    p_role: role,
    p_token_hash: hashToken(token),
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error || !invitationId) {
    if (error?.hint === "already_member") {
      return fail("Este e-mail já tem vínculo com o escritório.", {
        email: "E-mail já vinculado ao escritório.",
      });
    }
    return fail("Não foi possível criar o convite.");
  }

  const [{ data: invitation }, { data: inviter }] = await Promise.all([
    admin.from("invitations").select("expires_at").eq("id", invitationId).single(),
    admin.from("profiles").select("full_name").eq("id", ctx.userId).single(),
  ]);

  try {
    await sendEmail(
      email,
      invitationEmail({
        tenantName: ctx.active.tenantName,
        inviterName: inviter?.full_name ?? "O administrador",
        role,
        url: `${getPublicEnv().NEXT_PUBLIC_SITE_URL}/convite/${token}`,
        expiresAt: new Date(invitation?.expires_at ?? Date.now() + 24 * 60 * 60 * 1000),
      }),
    );
  } catch {
    revalidatePath(MEMBERS_PATH);
    return fail(
      "O convite foi criado, mas o e-mail não pôde ser enviado. Use a opção de reenviar.",
    );
  }

  revalidatePath(MEMBERS_PATH);
  return ok(undefined, `Convite enviado para ${email}. O link expira em 24 horas.`);
}

export async function revokeInvitationAction(input: { id: string }): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return fail("Convite inválido.");

  await requireActiveMember({ area: "app", roles: ["admin", "lawyer"] });
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invitation", { p_invitation_id: parsed.data.id });
  if (error) return fail("Não foi possível revogar o convite.");

  revalidatePath(MEMBERS_PATH);
  return ok(undefined, "Convite revogado.");
}

export async function updateMemberAction(input: UpdateMemberInput): Promise<ActionResult> {
  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  await requireActiveMember({ area: "app", roles: ["admin"] });
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("update_member", {
      p_member_id: parsed.data.memberId,
      p_role: parsed.data.role,
      p_status: parsed.data.status,
    })
    .single();

  if (error || !data) {
    if (error?.hint === "last_admin")
      return fail("O escritório precisa ter ao menos um administrador ativo.");
    return fail("Não foi possível atualizar o membro.");
  }

  // Sem nenhum vínculo ativo, o login é bloqueado no Auth (a autoria e os logs
  // são preservados). O acesso aos dados já é cortado imediatamente pelo RLS.
  const admin = createAdminClient();
  if (parsed.data.status === "disabled" && !data.has_other_active_membership) {
    await admin.auth.admin.updateUserById(data.user_id, { ban_duration: "876000h" });
  } else if (parsed.data.status === "active") {
    await admin.auth.admin.updateUserById(data.user_id, { ban_duration: "none" });
  }

  revalidatePath(MEMBERS_PATH);
  return ok(
    undefined,
    parsed.data.status === "disabled" ? "Acesso desativado." : "Membro atualizado.",
  );
}

export async function unlockMemberAction(input: { id: string }): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return fail("Membro inválido.");

  await requireActiveMember({ area: "app", roles: ["admin"] });
  const supabase = await createClient();
  const { error } = await supabase.rpc("unlock_member", { p_member_id: parsed.data.id });
  if (error) return fail("Não foi possível desbloquear o membro.");

  revalidatePath(MEMBERS_PATH);
  return ok(undefined, "Acesso desbloqueado.");
}

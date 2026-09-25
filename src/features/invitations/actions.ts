"use server";

import { redirect } from "next/navigation";

import { fail, fromZodError, type ActionResult } from "@/lib/actions/result";
import { markActivity } from "@/lib/auth/activity";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { requireSession } from "@/lib/auth/session";
import { hashToken } from "@/lib/crypto/token";
import { getRequestMeta } from "@/lib/http/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TERMS_VERSION } from "@/features/auth/schemas";

import { acceptNewUserSchema, invitationTokenSchema, type AcceptNewUserInput } from "./schemas";
import { findInvitation } from "./service";

const INVALID =
  "Este convite é inválido, expirou ou já foi utilizado. Peça um novo convite ao escritório.";

/** Aceite por quem ainda não tem conta: cria o usuário e o vínculo. */
export async function acceptInvitationNewUserAction(
  input: AcceptNewUserInput,
): Promise<ActionResult> {
  const parsed = acceptNewUserSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { ip, userAgent } = await getRequestMeta();
  if (!(await checkRateLimit("invitationAccept", ip))) {
    return fail("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }

  const { token, fullName, password } = parsed.data;
  const invitation = await findInvitation(token);
  if (!invitation || invitation.status !== "pending") return fail(INVALID);
  if (invitation.accountExists)
    return fail("Já existe uma conta com este e-mail. Entre para aceitar o convite.");

  const admin = createAdminClient();
  // O link recebido por e-mail comprova a posse do endereço: e-mail já confirmado.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    app_metadata: { invited: true },
    user_metadata: {
      full_name: fullName,
      terms_version: TERMS_VERSION,
      terms_accepted_at: new Date().toISOString(),
    },
  });

  if (createError || !created.user) {
    if (createError?.code === "weak_password") {
      return fail("Senha fraca.", { password: "A senha não atende à política de segurança." });
    }
    return fail("Não foi possível criar sua conta. Tente novamente.");
  }

  const { error: acceptError } = await admin.rpc("accept_invitation", {
    p_token_hash: hashToken(token),
    p_user_id: created.user.id,
    p_ip: ip,
    p_user_agent: userAgent,
  });
  if (acceptError) return fail(INVALID);

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password,
  });
  if (signInError) redirect("/login");

  await markActivity();
  redirect("/app");
}

/** Aceite por quem já tem conta (entra em mais um escritório). */
export async function acceptInvitationExistingUserAction(input: {
  token: string;
}): Promise<ActionResult> {
  const parsedToken = invitationTokenSchema.safeParse(input.token);
  if (!parsedToken.success) return fail(INVALID);

  const ctx = await requireSession(`/convite/${parsedToken.data}`);
  const invitation = await findInvitation(parsedToken.data);
  if (!invitation || invitation.status !== "pending") return fail(INVALID);
  if (invitation.email !== ctx.email.toLowerCase()) {
    return fail("Este convite foi enviado para outro e-mail.");
  }

  const { ip, userAgent } = await getRequestMeta();
  const { data: tenantId, error } = await createAdminClient().rpc("accept_invitation", {
    p_token_hash: hashToken(parsedToken.data),
    p_user_id: ctx.userId,
    p_ip: ip,
    p_user_agent: userAgent,
  });
  if (error || !tenantId) {
    if (error?.hint === "already_member")
      return fail("Você já possui vínculo com este escritório.");
    return fail(INVALID);
  }

  const supabase = await createClient();
  await supabase.rpc("set_active_tenant", { p_tenant_id: tenantId });
  redirect("/app");
}

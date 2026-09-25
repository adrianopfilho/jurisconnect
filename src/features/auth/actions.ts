"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fail, fromZodError, ok, type ActionResult } from "@/lib/actions/result";
import { markActivity } from "@/lib/auth/activity";
import { IDLE_COOKIE } from "@/lib/auth/idle";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { getSessionContext } from "@/lib/auth/session";
import { accountLockedEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { publicEnv } from "@/lib/env/public";
import { formatDateTime } from "@/lib/config/locale";
import { getRequestMeta } from "@/lib/http/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/validation/common";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  TERMS_VERSION,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "./schemas";

const TOO_MANY = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

// -----------------------------------------------------------------------------
// Cadastro de novo escritório
// -----------------------------------------------------------------------------
export async function signUpAction(input: SignUpInput): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { ip } = await getRequestMeta();
  if (!(await checkRateLimit("signUp", ip))) return fail(TOO_MANY);

  const { officeName, fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      data: {
        full_name: fullName,
        office_name: officeName,
        terms_version: TERMS_VERSION,
        terms_accepted_at: new Date().toISOString(),
      },
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return fail("Senha fraca.", { password: "A senha não atende à política de segurança." });
    }
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return fail(TOO_MANY);
    }
    return fail("Não foi possível concluir o cadastro. Tente novamente.");
  }

  // Resposta idêntica para e-mail novo ou já cadastrado (evita enumeração).
  redirect(`/verificar-email?email=${encodeURIComponent(email)}`);
}

// -----------------------------------------------------------------------------
// Login com bloqueio após 5 falhas
// -----------------------------------------------------------------------------
export async function signInAction(input: SignInInput): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { ip, userAgent } = await getRequestMeta();
  if (!(await checkRateLimit("signIn", ip))) return fail(TOO_MANY);

  const { email, password, next } = parsed.data;
  const admin = createAdminClient();

  const { data: lockedUntil } = await admin.rpc("auth_login_locked_until", {
    p_email: email,
    p_ip: ip,
  });
  if (lockedUntil) {
    return fail(
      `Acesso bloqueado temporariamente nesta conexão por excesso de tentativas. Tente novamente após ${formatDateTime(lockedUntil)}.`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return fail("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
    }
    if (error?.code === "user_banned") {
      return fail("Seu acesso está desativado. Procure o administrador do escritório.");
    }

    const { data: failure } = await admin
      .rpc("auth_register_failure", { p_email: email, p_ip: ip, p_user_agent: userAgent })
      .single();

    if (failure?.just_locked && failure.locked_until) {
      await notifyAccountLocked(email, new Date(failure.locked_until));
    }
    if (failure?.locked_until) {
      return fail(
        `Acesso bloqueado temporariamente nesta conexão por excesso de tentativas. Tente novamente após ${formatDateTime(failure.locked_until)}.`,
      );
    }
    return fail("E-mail ou senha inválidos.");
  }

  await admin.rpc("auth_register_success", {
    p_user_id: data.user.id,
    p_ip: ip,
    p_user_agent: userAgent,
  });
  await markActivity();

  redirect(safeRedirectPath(next));
}

async function notifyAccountLocked(email: string, lockedUntil: Date) {
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (!profile) return;

  try {
    await sendEmail(
      email,
      accountLockedEmail({
        lockedUntil,
        resetUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/recuperar-senha`,
      }),
    );
  } catch {
    console.error("Falha ao enviar o aviso de bloqueio de conta.");
  }
}

// -----------------------------------------------------------------------------
// Logout
// -----------------------------------------------------------------------------
export async function signOutAction(reason?: "inatividade"): Promise<never> {
  const supabase = await createClient();
  const ctx = await getSessionContext();

  if (ctx) {
    const { ip, userAgent } = await getRequestMeta();
    await createAdminClient().rpc("log_system_audit_event", {
      p_tenant_id: ctx.active?.tenantId ?? undefined,
      p_actor_id: ctx.userId,
      p_action: reason === "inatividade" ? "auth.idle_logout" : "auth.logout",
      p_entity_type: "user",
      p_entity_id: ctx.userId,
      p_ip: ip,
      p_user_agent: userAgent,
    });
  }

  await supabase.auth.signOut({ scope: "local" });
  (await cookies()).delete(IDLE_COOKIE);
  redirect(reason === "inatividade" ? "/login?motivo=inatividade" : "/login");
}

/** Registra atividade do usuário (mantém a sessão viva no servidor). */
export async function touchActivityAction(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) await markActivity();
}

// -----------------------------------------------------------------------------
// Recuperação de senha
// -----------------------------------------------------------------------------
export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { ip } = await getRequestMeta();
  if (!(await checkRateLimit("passwordReset", ip))) return fail(TOO_MANY);

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/redefinir-senha`,
  });

  // Mesma resposta exista ou não a conta.
  return ok(
    undefined,
    "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
  );
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return fail("Link expirado. Solicite uma nova redefinição de senha.");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "insufficient_aal") redirect("/mfa?next=/redefinir-senha");
    if (error.code === "same_password") {
      return fail("A nova senha deve ser diferente da atual.", {
        password: "Use uma senha diferente da atual.",
      });
    }
    if (error.code === "weak_password") {
      return fail("Senha fraca.", { password: "A senha não atende à política de segurança." });
    }
    return fail("Não foi possível redefinir a senha. Solicite um novo link.");
  }

  const ctx = await getSessionContext();
  if (ctx) {
    const { ip, userAgent } = await getRequestMeta();
    const admin = createAdminClient();
    await admin.rpc("log_system_audit_event", {
      p_tenant_id: ctx.active?.tenantId ?? undefined,
      p_actor_id: ctx.userId,
      p_action: "auth.password_changed",
      p_entity_type: "user",
      p_entity_id: ctx.userId,
      p_ip: ip,
      p_user_agent: userAgent,
    });
    // Desbloqueia a conta, se estava bloqueada por tentativas.
    await admin.rpc("auth_register_success", {
      p_user_id: ctx.userId,
      p_ip: ip,
      p_user_agent: userAgent,
    });
  }

  // Encerra as outras sessões abertas com a senha antiga.
  await supabase.auth.signOut({ scope: "others" });
  await markActivity();
  redirect("/app");
}

// -----------------------------------------------------------------------------
// MFA
// -----------------------------------------------------------------------------
export async function recordMfaEventAction(event: "enrolled" | "verified"): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx) return;

  const { ip, userAgent } = await getRequestMeta();
  await createAdminClient().rpc("log_system_audit_event", {
    p_tenant_id: ctx.active?.tenantId ?? undefined,
    p_actor_id: ctx.userId,
    p_action: event === "enrolled" ? "auth.mfa_enrolled" : "auth.mfa_verified",
    p_entity_type: "user",
    p_entity_id: ctx.userId,
    p_ip: ip,
    p_user_agent: userAgent,
  });
  await markActivity();
}

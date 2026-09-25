import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { type AppRole } from "./roles";

export type Membership = {
  tenantId: string;
  tenantName: string;
  role: AppRole;
  requiresMfa: boolean;
  isActive: boolean;
};

export type SessionContext = {
  userId: string;
  email: string;
  aal: "aal1" | "aal2";
  /** Sessão ainda precisa do segundo fator (perfil exige MFA ou usuário tem MFA cadastrado). */
  needsMfa: boolean;
  memberships: Membership[];
  active: Membership | null;
};

/** Contexto da sessão atual (usuário, MFA e vínculos). Memoizado por requisição. */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const [{ data: aal }, { data: rows, error }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.rpc("my_memberships"),
  ]);
  if (error) throw new Error("Não foi possível carregar os vínculos do usuário.");

  const memberships: Membership[] = (rows ?? []).map((row) => ({
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    role: row.role,
    requiresMfa: row.requires_mfa,
    isActive: row.is_active,
  }));
  const active = memberships.find((m) => m.isActive) ?? null;
  const currentAal = claims.aal === "aal2" ? "aal2" : "aal1";

  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    aal: currentAal,
    needsMfa: currentAal !== "aal2" && (Boolean(active?.requiresMfa) || aal?.nextLevel === "aal2"),
    memberships,
    active,
  };
});

/** Exige usuário autenticado. */
export async function requireSession(next = "/app"): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(next)}`);
  return ctx;
}

export type ActiveSession = SessionContext & { active: Membership };

/**
 * Exige sessão completa no escritório ativo: MFA quando necessário, escritório
 * ativo escolhido e (opcionalmente) um dos perfis informados.
 */
export async function requireActiveMember(options: {
  area: "app" | "portal";
  roles?: readonly AppRole[];
  next?: string;
}): Promise<ActiveSession> {
  const ctx = await requireSession(options.next);
  if (ctx.needsMfa) redirect(`/mfa?next=${encodeURIComponent(options.next ?? "/app")}`);
  if (!ctx.active) redirect(ctx.memberships.length > 0 ? "/escritorios" : "/sem-acesso");

  const isClient = ctx.active.role === "client";
  if (options.area === "app" && isClient) redirect("/portal");
  if (options.area === "portal" && !isClient) redirect("/app");
  if (options.roles && !options.roles.includes(ctx.active.role)) redirect("/app");

  return ctx as ActiveSession;
}

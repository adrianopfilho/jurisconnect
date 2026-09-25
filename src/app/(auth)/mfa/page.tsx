import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { MfaEnroll } from "@/features/auth/components/mfa-enroll";
import { MfaVerify } from "@/features/auth/components/mfa-verify";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/validation/common";

export const metadata: Metadata = { title: "Verificação em dois fatores" };

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeRedirectPath((await searchParams).next);
  const ctx = await requireSession(`/mfa?next=${encodeURIComponent(next)}`);
  if (!ctx.needsMfa) redirect(next);

  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.totp[0];

  return (
    <AuthCard
      title={factor ? "Verificação em dois fatores" : "Ative a verificação em dois fatores"}
      description={
        factor
          ? "Confirme sua identidade com o código do aplicativo autenticador."
          : "Seu perfil exige verificação em dois fatores (TOTP) para proteger os dados do escritório e dos clientes."
      }
      footer={<SignOutButton variant="link" />}
    >
      {factor ? <MfaVerify factorId={factor.id} next={next} /> : <MfaEnroll next={next} />}
    </AuthCard>
  );
}

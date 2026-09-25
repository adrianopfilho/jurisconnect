import { type Metadata } from "next";

import { AuthCard } from "@/components/layout/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function ResetPasswordPage() {
  await requireSession("/redefinir-senha");

  return (
    <AuthCard
      title="Defina uma nova senha"
      description="As outras sessões abertas serão encerradas."
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}

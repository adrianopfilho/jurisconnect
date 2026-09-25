import { type Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/layout/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recuperar senha"
      description="Informe seu e-mail para receber um link de redefinição de senha."
      footer={
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline dark:text-accent"
        >
          Voltar para o login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}

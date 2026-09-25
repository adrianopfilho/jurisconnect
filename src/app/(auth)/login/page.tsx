import { type Metadata } from "next";
import Link from "next/link";

import { FormAlert } from "@/components/forms/form-alert";
import { AuthCard } from "@/components/layout/auth-card";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { safeRedirectPath } from "@/lib/validation/common";

export const metadata: Metadata = { title: "Entrar" };

const NOTICES: Record<string, string> = {
  inatividade: "Sua sessão foi encerrada após 30 minutos de inatividade. Entre novamente.",
  "link-invalido": "O link é inválido ou expirou. Solicite um novo.",
  "email-confirmado": "E-mail confirmado. Entre para continuar.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; motivo?: string }>;
}) {
  const { next, motivo } = await searchParams;
  const notice = motivo ? NOTICES[motivo] : undefined;

  return (
    <AuthCard
      title="Entrar"
      description="Acesse o JurisConnect com seu e-mail e senha."
      footer={
        <span>
          Ainda não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-primary underline-offset-4 hover:underline dark:text-accent"
          >
            Cadastre seu escritório
          </Link>
        </span>
      }
    >
      <div className="grid gap-4">
        {notice && <FormAlert success={notice} />}
        <SignInForm next={safeRedirectPath(next)} />
      </div>
    </AuthCard>
  );
}

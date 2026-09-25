import { MailCheck } from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/layout/auth-card";

export const metadata: Metadata = { title: "Confirme seu e-mail" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthCard
      title="Confirme seu e-mail"
      footer={
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline dark:text-accent"
        >
          Voltar para o login
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <MailCheck className="size-10 text-accent" aria-hidden />
        <p>
          Enviamos um link de confirmação para{" "}
          <strong>{email ? email : "o e-mail informado"}</strong>. Clique no link para ativar sua
          conta.
        </p>
        <p className="text-sm text-muted-foreground">
          Não recebeu? Verifique a caixa de spam. Se o e-mail já estiver cadastrado, use a opção de
          recuperar senha.
        </p>
      </div>
    </AuthCard>
  );
}

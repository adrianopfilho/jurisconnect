import { type Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/layout/auth-card";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = { title: "Cadastrar escritório" };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Cadastre seu escritório"
      description="Crie o escritório no JurisConnect. Você será o administrador e poderá convidar sua equipe."
      footer={
        <span>
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline dark:text-accent"
          >
            Entrar
          </Link>
        </span>
      }
    >
      <SignUpForm />
      <p className="mt-4 text-xs text-muted-foreground">
        Recebeu um convite de um escritório? Use o link enviado por e-mail: não é preciso se
        cadastrar aqui.
      </p>
    </AuthCard>
  );
}

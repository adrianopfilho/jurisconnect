import { ShieldOff } from "lucide-react";
import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sem acesso" };

export default async function NoAccessPage() {
  const ctx = await requireSession("/sem-acesso");
  if (ctx.memberships.length > 0) redirect("/app");

  return (
    <AuthCard title="Sem acesso a escritórios" footer={<SignOutButton variant="link" />}>
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldOff className="size-10 text-muted-foreground" aria-hidden />
        <p>Sua conta não possui vínculo ativo com nenhum escritório.</p>
        <p className="text-sm text-muted-foreground">
          Se você deveria ter acesso, peça um novo convite ao administrador do escritório.
        </p>
      </div>
    </AuthCard>
  );
}

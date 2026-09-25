import { Building2, ShieldCheck, UserRound } from "lucide-react";
import { type Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { requireActiveMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage() {
  const ctx = await requireActiveMember({ area: "app" });

  return (
    <>
      <PageHeader
        title="Painel"
        description="Visão geral do escritório. Os indicadores chegam com os próximos módulos."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Building2 className="size-4 text-accent" aria-hidden /> Escritório
            </CardDescription>
            <CardTitle className="text-lg">{ctx.active.tenantName}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <UserRound className="size-4 text-accent" aria-hidden /> Seu perfil de acesso
            </CardDescription>
            <CardTitle className="text-lg">{ROLE_LABELS[ctx.active.role]}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-accent" aria-hidden /> Segurança da sessão
            </CardDescription>
            <CardTitle className="text-lg">
              {ctx.aal === "aal2" ? "Verificação em dois fatores" : "Senha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={ctx.aal === "aal2" ? "accent" : "secondary"}>
              {ctx.aal === "aal2" ? "MFA ativo" : "MFA opcional para o seu perfil"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

import { type Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireActiveMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Portal do cliente" };

export default async function PortalPage() {
  const ctx = await requireActiveMember({ area: "portal", next: "/portal" });

  return (
    <>
      <PageHeader
        title="Portal do cliente"
        description={`Seu acesso ao escritório ${ctx.active.tenantName}.`}
      />
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá acompanhar seus processos, documentos, faturas e mensagens por
            aqui.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

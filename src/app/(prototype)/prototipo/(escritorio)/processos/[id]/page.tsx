import { ArrowLeft, Lock } from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseStatusBadge } from "@/features/cases/components/case-status-badge";
import { CaseTimeline } from "@/features/cases/components/case-timeline";
import { getMockCase } from "@/features/cases/mocks";
import { getMockClient } from "@/features/clients/mocks";
import { AGENDA_KIND_LABELS } from "@/features/deadlines/types";
import { getMockAgenda } from "@/features/deadlines/mocks";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/config/locale";
import { formatCnj } from "@/lib/format/documents";

export const metadata: Metadata = { title: "Ficha do processo" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function DemoCasePage({ params }: { params: Promise<{ id: string }> }) {
  const item = getMockCase((await params).id);
  if (!item) notFound();
  const client = getMockClient(item.clientId);
  const agenda = getMockAgenda()
    .filter((entry) => entry.caseId === item.id)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/prototipo/processos">
          <ArrowLeft aria-hidden /> Processos
        </Link>
      </Button>
      <PageHeader
        title={item.title}
        description={
          item.cnj ? `Processo ${formatCnj(item.cnj)}` : "Caso consultivo (sem processo judicial)"
        }
        actions={<CaseStatusBadge status={item.status} />}
      />
      {item.secret && (
        <Alert className="mb-4">
          <Lock aria-hidden />
          <AlertDescription>
            Segredo de justiça: visível apenas aos advogados designados e à administração do
            escritório.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Andamentos</CardTitle>
            <CardDescription>
              Atualizados manualmente e pela consulta ao DataJud (CNJ)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CaseTimeline movements={item.movements} />
          </CardContent>
        </Card>
        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do processo</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <Field label="Cliente">
                  {client ? (
                    <Link href={`/prototipo/clientes/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Field>
                <Field label="Área / fase">
                  {item.area} · {item.phase}
                </Field>
                {item.court && (
                  <Field label="Tribunal / vara / comarca">
                    {item.court} · {item.vara} · {item.comarca}
                  </Field>
                )}
                {item.side && <Field label="Polo do cliente">{item.side}</Field>}
                {item.claimValue !== undefined && (
                  <Field label="Valor da causa">{formatCurrency(item.claimValue)}</Field>
                )}
                <Field label="Início">{formatDate(item.startedAt)}</Field>
                <Field label="Responsáveis">{item.responsible.join(", ")}</Field>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Partes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm">
                {item.parties.map((party) => (
                  <li key={party.name} className="flex justify-between gap-2">
                    <span>{party.name}</span>
                    <span className="text-muted-foreground">{party.role}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prazos e compromissos</CardTitle>
            </CardHeader>
            <CardContent>
              {agenda.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum prazo cadastrado.</p>
              ) : (
                <ul className="grid gap-2 text-sm">
                  {agenda.map((entry) => (
                    <li key={entry.id} className="grid gap-0.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-medium">{entry.title}</span>
                        <Badge variant={entry.status === "pendente" ? "outline" : "secondary"}>
                          {entry.status === "pendente"
                            ? AGENDA_KIND_LABELS[entry.kind]
                            : entry.status === "cumprido"
                              ? "Cumprido"
                              : "Cancelado"}
                        </Badge>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.dueAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

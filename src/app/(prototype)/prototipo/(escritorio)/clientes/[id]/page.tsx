import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseStatusBadge } from "@/features/cases/components/case-status-badge";
import { getMockCases } from "@/features/cases/mocks";
import { MaskedDocument } from "@/features/clients/components/masked-document";
import { getMockClient } from "@/features/clients/mocks";
import { LEGAL_BASIS_LABELS } from "@/features/clients/types";
import { formatDate, formatDateTime } from "@/lib/config/locale";
import { formatCep, formatPhone } from "@/lib/format/documents";

export const metadata: Metadata = { title: "Ficha do cliente" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function DemoClientPage({ params }: { params: Promise<{ id: string }> }) {
  const client = getMockClient((await params).id);
  if (!client) notFound();
  const cases = getMockCases().filter((c) => c.clientId === client.id);
  const { address } = client;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/prototipo/clientes">
          <ArrowLeft aria-hidden /> Clientes
        </Link>
      </Button>
      <PageHeader
        title={client.name}
        description={`${client.kind === "PF" ? "Pessoa física" : "Pessoa jurídica"} · cliente desde ${formatDate(client.createdAt)}`}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Dados cadastrais</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Documento">
                <MaskedDocument
                  kind={client.kind}
                  document={client.document}
                  revealNotice="No sistema real, revelar o CPF é registrado na auditoria."
                />
              </Field>
              {client.rg && <Field label="RG">•••••{client.rg.slice(-2)}</Field>}
              <Field label="E-mail">{client.email}</Field>
              <Field label="Telefone">{formatPhone(client.phone)}</Field>
              <Field label="Endereço">
                {address.street}, {address.number} — {address.district}
                <br />
                {address.city}/{address.uf} · CEP {formatCep(address.cep)}
              </Field>
              <Field label="Responsável">{client.responsible}</Field>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-4 text-accent" aria-hidden /> LGPD
            </CardTitle>
            <CardDescription>Base legal e consentimento</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <Field label="Base legal do tratamento">
                {LEGAL_BASIS_LABELS[client.legalBasis]}
              </Field>
              {client.consent ? (
                <>
                  <Field label="Consentimento">
                    Aceito em {formatDateTime(client.consent.acceptedAt)} (termo{" "}
                    {client.consent.termVersion})
                  </Field>
                  <Field label="IP do aceite">{client.consent.ip}</Field>
                </>
              ) : (
                <Field label="Consentimento">Não aplicável para esta base legal</Field>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Processos e casos</CardTitle>
          </CardHeader>
          <CardContent>
            {cases.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum processo vinculado.</p>
            ) : (
              <ul className="grid gap-3">
                {cases.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <Link
                      href={`/prototipo/processos/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                    <span className="flex items-center gap-2">
                      {item.secret && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="size-3" aria-hidden /> Segredo de justiça
                        </span>
                      )}
                      <CaseStatusBadge status={item.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3">
              {[...client.history].reverse().map((entry) => (
                <li key={entry.at} className="grid gap-0.5 text-sm">
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(entry.at)} · {entry.actor}
                  </span>
                  <span>{entry.description}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

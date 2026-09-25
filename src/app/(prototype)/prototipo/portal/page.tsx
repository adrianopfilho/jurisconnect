import { FileText, Lock, MessageSquare, ShieldCheck } from "lucide-react";
import { type Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CaseStatusBadge } from "@/features/cases/components/case-status-badge";
import { CaseTimeline } from "@/features/cases/components/case-timeline";
import { getMockCases } from "@/features/cases/mocks";
import { getMockClient } from "@/features/clients/mocks";
import { LEGAL_BASIS_LABELS } from "@/features/clients/types";
import { InvoiceStatusBadge } from "@/features/finance/components/invoice-status-badge";
import { getMockInvoices } from "@/features/finance/mocks";
import { DataRights } from "@/features/portal/components/data-rights";
import {
  DEMO_PORTAL_CLIENT_ID,
  getMockMessages,
  getMockSharedDocuments,
} from "@/features/portal/mocks";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/config/locale";
import { maskCpf } from "@/lib/format/documents";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Portal do cliente" };

const SECTIONS = [
  { id: "processos", label: "Meus processos" },
  { id: "documentos", label: "Documentos" },
  { id: "faturas", label: "Faturas" },
  { id: "mensagens", label: "Mensagens" },
  { id: "meus-dados", label: "Meus dados" },
];

export default function DemoPortalPage() {
  const now = new Date();
  const client = getMockClient(DEMO_PORTAL_CLIENT_ID, now);
  const cases = getMockCases(now).filter((c) => c.clientId === DEMO_PORTAL_CLIENT_ID);
  const invoices = getMockInvoices(now).filter((i) => i.clientId === DEMO_PORTAL_CLIENT_ID);
  const documents = getMockSharedDocuments(now);
  const messages = getMockMessages(now);
  const firstName = client?.name.split(" ")[0] ?? "";

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}`}
        description="Acompanhe seus processos com o escritório Modelo Advocacia."
      />

      <nav aria-label="Seções do portal" className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="grid gap-6">
        <section id="processos" className="grid scroll-mt-4 gap-4">
          <h2 className="text-xl font-semibold">Meus processos</h2>
          {cases.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
                  {item.title}
                  <CaseStatusBadge status={item.status} />
                </CardTitle>
                <CardDescription>
                  {item.court ? `${item.vara} de ${item.comarca}` : "Atendimento consultivo"} ·
                  responsável: {item.responsible[0]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaseTimeline movements={item.movements} variant="simples" />
              </CardContent>
            </Card>
          ))}
        </section>

        <section id="documentos" className="scroll-mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="size-4 text-accent" aria-hidden /> Documentos compartilhados
              </CardTitle>
              <CardDescription>
                Na versão real, cada download usa um link temporário (5 minutos) e é registrado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2"
                  >
                    <span className="grid">
                      <span className="font-medium">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Compartilhado em {formatDate(doc.sharedAt)} · {doc.sizeKb} KB
                      </span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled
                      title="Indisponível na demonstração"
                    >
                      Baixar
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="faturas" className="scroll-mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Faturas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section id="mensagens" className="scroll-mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="size-4 text-accent" aria-hidden /> Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ol className="grid gap-3">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={cn(
                      "grid max-w-[85%] gap-1 rounded-lg px-3 py-2 text-sm",
                      message.from === "cliente"
                        ? "justify-self-end bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <span className="text-xs opacity-80">
                      {message.author} · {formatDateTime(message.at)}
                    </span>
                    {message.body}
                  </li>
                ))}
              </ol>
              <form className="flex gap-2" aria-label="Nova mensagem">
                <Input placeholder="Escreva uma mensagem (indisponível na demonstração)" disabled />
                <Button type="button" disabled>
                  Enviar
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section id="meus-dados" className="scroll-mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="size-4 text-accent" aria-hidden /> Meus dados
              </CardTitle>
              <CardDescription>
                Seus direitos como titular de dados (LGPD, art. 18).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {client && (
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Nome</dt>
                    <dd>{client.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">CPF</dt>
                    <dd className="tabular-nums">{maskCpf(client.document)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Base legal</dt>
                    <dd>{LEGAL_BASIS_LABELS[client.legalBasis]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Segurança</dt>
                    <dd className="flex items-center gap-1">
                      <Lock className="size-3" aria-hidden /> Verificação em dois fatores opcional
                    </dd>
                  </div>
                </dl>
              )}
              <DataRights notice="Na versão real, ele gera um protocolo com prazo de resposta de 15 dias." />
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

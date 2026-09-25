import { CircleAlert, HandCoins, Wallet } from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";

import { ColumnChart } from "@/components/charts/column-chart";
import { StatTile } from "@/components/dashboard/stat-tile";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMockClients } from "@/features/clients/mocks";
import { InvoiceStatusBadge } from "@/features/finance/components/invoice-status-badge";
import { getMockInvoices, getMockMonthlyReceipts } from "@/features/finance/mocks";
import { FEE_TYPE_LABELS } from "@/features/finance/types";
import { formatCurrency, formatDate } from "@/lib/config/locale";

export const metadata: Metadata = { title: "Financeiro" };

export default function DemoFinancePage() {
  const now = new Date();
  const invoices = [...getMockInvoices(now)].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const receipts = getMockMonthlyReceipts(now);
  const clientName = new Map(getMockClients(now).map((c) => [c.id, c.name]));

  const receivable = invoices.filter((i) => i.status !== "paga").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "vencida").reduce((s, i) => s + i.amount, 0);
  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const currentMonth = receipts.at(-1);

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Resumo de honorários, faturas e recebimentos (dados fictícios)."
      />

      <section aria-label="Indicadores financeiros" className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={Wallet}
          label="A receber"
          value={formatCurrency(receivable)}
          hint="Faturas em aberto e vencidas"
        />
        <StatTile
          icon={CircleAlert}
          label="Inadimplência"
          value={`${Math.round((overdue / billed) * 100)}%`}
          hint={`${formatCurrency(overdue)} vencidos`}
          tone="attention"
        />
        <StatTile
          icon={HandCoins}
          label="Recebido no mês"
          value={formatCurrency(currentMonth?.received ?? 0)}
          hint={currentMonth ? `${currentMonth.label} · fluxo de caixa` : undefined}
        />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recebimentos</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ColumnChart
              caption="Recebimentos dos últimos 6 meses"
              format="currency-compact"
              data={receipts.map((r) => ({
                label: r.label,
                value: r.received,
                tooltipLabel: r.label,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente / descrição</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/prototipo/clientes/${invoice.clientId}`}
                        className="font-medium hover:underline"
                      >
                        {clientName.get(invoice.clientId)}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {invoice.description}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {FEE_TYPE_LABELS[invoice.feeType]}
                    </TableCell>
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
      </div>
    </>
  );
}

import {
  AlarmClock,
  CalendarClock,
  CalendarDays,
  Gavel,
  ListChecks,
  Newspaper,
  Wallet,
} from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";

import { BarListChart } from "@/components/charts/bar-list-chart";
import { StatTile } from "@/components/dashboard/stat-tile";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockCases } from "@/features/cases/mocks";
import { buildDashboardSummary } from "@/features/dashboard/summary";
import { getMockAgenda } from "@/features/deadlines/mocks";
import { getMockInvoices } from "@/features/finance/mocks";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/config/locale";
import { dayDiff } from "@/lib/prototype/dates";

export const metadata: Metadata = { title: "Painel" };

export default function DemoDashboardPage() {
  const now = new Date();
  const cases = getMockCases(now);
  const agenda = getMockAgenda(now);
  const summary = buildDashboardSummary(cases, agenda, getMockInvoices(now), now);
  const caseTitle = new Map(cases.map((c) => [c.id, c.title]));

  return (
    <>
      <PageHeader title="Painel" description={`Visão geral do escritório em ${formatDate(now)}.`} />

      <section aria-label="Indicadores" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={AlarmClock}
          label="Prazos hoje"
          value={String(summary.deadlinesToday)}
          hint={`${summary.deadlinesIn3Days} em até 3 dias · ${summary.deadlinesIn7Days} em até 7 dias`}
          href="/prototipo/agenda"
          tone={summary.deadlinesToday > 0 ? "attention" : "default"}
        />
        <StatTile
          icon={Gavel}
          label="Audiências (30 dias)"
          value={String(summary.upcomingHearings.length)}
          hint={
            summary.upcomingHearings[0]
              ? `Próxima: ${formatDateTime(summary.upcomingHearings[0].dueAt)}`
              : "Nenhuma agendada"
          }
          href="/prototipo/agenda"
        />
        <StatTile
          icon={ListChecks}
          label="Tarefas atrasadas"
          value={String(summary.overdueTasks.length)}
          href="/prototipo/agenda"
          tone={summary.overdueTasks.length > 0 ? "attention" : "default"}
        />
        <StatTile
          icon={Wallet}
          label="Honorários a receber"
          value={formatCurrency(summary.receivable)}
          hint={`${formatCurrency(summary.overdueAmount)} vencidos`}
          href="/prototipo/financeiro"
        />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processos por situação</CardTitle>
            <CardDescription>{cases.length} processos e casos consultivos</CardDescription>
          </CardHeader>
          <CardContent>
            <BarListChart data={summary.byStatus} caption="Processos por situação" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processos por área</CardTitle>
            <CardDescription>Distribuição da carteira</CardDescription>
          </CardHeader>
          <CardContent>
            <BarListChart data={summary.byArea} caption="Processos por área" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="size-4 text-accent" aria-hidden /> Próximos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              {agenda
                .filter((item) => item.status === "pendente")
                .filter((item) => dayDiff(item.dueAt, now) >= 0 && dayDiff(item.dueAt, now) <= 7)
                .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
                .map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="grid gap-0.5">
                      <span className="font-medium">{item.title}</span>
                      {item.caseId && (
                        <Link
                          href={`/prototipo/processos/${item.caseId}`}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          {caseTitle.get(item.caseId)}
                        </Link>
                      )}
                    </span>
                    <span className="grid shrink-0 justify-items-end gap-1">
                      <span className="text-xs tabular-nums">{formatDateTime(item.dueAt)}</span>
                      <Badge variant={item.kind === "audiencia" ? "accent" : "outline"}>
                        {item.kind === "audiencia"
                          ? "Audiência"
                          : item.kind === "prazo"
                            ? "Prazo"
                            : "Tarefa"}
                      </Badge>
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Newspaper className="size-4 text-accent" aria-hidden /> Novos andamentos
            </CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              {summary.recentMovements.map((movement) => (
                <li key={`${movement.caseId}-${movement.at}`} className="grid gap-0.5 text-sm">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="size-3" aria-hidden />
                    {formatDateTime(movement.at)}
                  </span>
                  <span className="font-medium">{movement.title}</span>
                  <Link
                    href={`/prototipo/processos/${movement.caseId}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {movement.caseTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

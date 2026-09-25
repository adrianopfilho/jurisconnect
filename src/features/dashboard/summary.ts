import { type LegalCase, type CaseArea, type CaseStatus } from "@/features/cases/types";
import { type AgendaItem } from "@/features/deadlines/types";
import { type Invoice } from "@/features/finance/types";
import { dayDiff } from "@/lib/prototype/dates";

export type DashboardSummary = {
  deadlinesToday: number;
  deadlinesIn3Days: number;
  deadlinesIn7Days: number;
  upcomingHearings: AgendaItem[];
  overdueTasks: AgendaItem[];
  recentMovements: { caseId: string; caseTitle: string; at: string; title: string }[];
  receivable: number;
  overdueAmount: number;
  byStatus: { label: string; value: number }[];
  byArea: { label: string; value: number }[];
};

const STATUS_ORDER: CaseStatus[] = ["ativo", "suspenso", "arquivado", "encerrado"];
const STATUS_LABELS: Record<CaseStatus, string> = {
  ativo: "Ativos",
  suspenso: "Suspensos",
  arquivado: "Arquivados",
  encerrado: "Encerrados",
};

/** Indicadores do painel calculados a partir de processos, agenda e faturas. */
export function buildDashboardSummary(
  cases: LegalCase[],
  agenda: AgendaItem[],
  invoices: Invoice[],
  now = new Date(),
): DashboardSummary {
  const pending = agenda.filter((item) => item.status === "pendente");
  const deadlines = pending.filter((item) => item.kind === "prazo");
  const within = (item: AgendaItem, max: number) => {
    const diff = dayDiff(item.dueAt, now);
    return diff >= 0 && diff <= max;
  };

  const areaCounts = new Map<CaseArea, number>();
  for (const item of cases) areaCounts.set(item.area, (areaCounts.get(item.area) ?? 0) + 1);

  const recentMovements = cases
    .flatMap((item) =>
      item.movements
        .filter((m) => dayDiff(m.at, now) >= -7)
        .map((m) => ({ caseId: item.id, caseTitle: item.title, at: m.at, title: m.title })),
    )
    .sort((a, b) => b.at.localeCompare(a.at));

  return {
    deadlinesToday: deadlines.filter((item) => within(item, 0)).length,
    deadlinesIn3Days: deadlines.filter((item) => within(item, 3)).length,
    deadlinesIn7Days: deadlines.filter((item) => within(item, 7)).length,
    upcomingHearings: pending
      .filter((item) => item.kind === "audiencia" && within(item, 30))
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    overdueTasks: pending.filter((item) => item.kind === "tarefa" && dayDiff(item.dueAt, now) < 0),
    recentMovements,
    receivable: invoices.filter((i) => i.status !== "paga").reduce((sum, i) => sum + i.amount, 0),
    overdueAmount: invoices
      .filter((i) => i.status === "vencida")
      .reduce((sum, i) => sum + i.amount, 0),
    byStatus: STATUS_ORDER.map((status) => ({
      label: STATUS_LABELS[status],
      value: cases.filter((item) => item.status === status).length,
    })).filter((entry) => entry.value > 0),
    byArea: [...areaCounts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
  };
}

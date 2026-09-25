import { describe, expect, it } from "vitest";

import { getMockCases } from "@/features/cases/mocks";
import { getMockAgenda } from "@/features/deadlines/mocks";
import { getMockInvoices } from "@/features/finance/mocks";

import { buildDashboardSummary } from "./summary";

describe("resumo do painel", () => {
  const now = new Date("2026-05-12T15:00:00Z");
  const summary = buildDashboardSummary(
    getMockCases(now),
    getMockAgenda(now),
    getMockInvoices(now),
    now,
  );

  it("conta prazos pendentes de hoje, 3 e 7 dias (cumulativos)", () => {
    expect(summary.deadlinesToday).toBe(2);
    expect(summary.deadlinesIn3Days).toBe(3);
    expect(summary.deadlinesIn7Days).toBe(4);
  });

  it("lista audiências futuras e tarefas atrasadas", () => {
    expect(summary.upcomingHearings.map((h) => h.id)).toEqual(["ag-03", "ag-06"]);
    expect(summary.overdueTasks.map((t) => t.id).sort()).toEqual(["ag-09", "ag-10"]);
  });

  it("soma honorários a receber e vencidos", () => {
    expect(summary.receivable).toBe(1500 + 4200 + 5400 + 7600 + 6800);
    expect(summary.overdueAmount).toBe(4200 + 7600);
  });

  it("agrupa processos por status e área", () => {
    expect(summary.byStatus).toEqual([
      { label: "Ativos", value: 5 },
      { label: "Suspensos", value: 1 },
      { label: "Arquivados", value: 1 },
    ]);
    expect(summary.byArea[0]).toEqual({ label: "Cível", value: 2 });
  });

  it("traz andamentos dos últimos 7 dias, mais recentes primeiro", () => {
    expect(summary.recentMovements.map((m) => m.caseId)).toEqual([
      "proc-002",
      "proc-001",
      "proc-005",
      "proc-003",
    ]);
  });
});

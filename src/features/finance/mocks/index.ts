/** DADOS FICTÍCIOS — somente para o modo protótipo (NEXT_PUBLIC_PROTOTYPE=true). */
import { daysFromToday } from "@/lib/prototype/dates";

import { type Invoice, type MonthlyReceipt } from "../types";

export function getMockInvoices(now = new Date()): Invoice[] {
  const d = (days: number) => daysFromToday(days, "12:00", now);

  return [
    {
      id: "fat-101",
      clientId: "cli-001",
      caseId: "proc-001",
      description: "Honorários iniciais (parcela 3/4)",
      feeType: "fixo",
      amount: 1500,
      dueDate: d(5),
      status: "aberta",
    },
    {
      id: "fat-102",
      clientId: "cli-001",
      caseId: "proc-001",
      description: "Honorários iniciais (parcela 2/4)",
      feeType: "fixo",
      amount: 1500,
      dueDate: d(-25),
      status: "paga",
      paidAt: d(-26),
    },
    {
      id: "fat-103",
      clientId: "cli-002",
      description: "Assessoria mensal",
      feeType: "mensal",
      amount: 4200,
      dueDate: d(-8),
      status: "vencida",
    },
    {
      id: "fat-104",
      clientId: "cli-002",
      description: "Assessoria mensal",
      feeType: "mensal",
      amount: 4200,
      dueDate: d(-38),
      status: "paga",
      paidAt: d(-37),
    },
    {
      id: "fat-105",
      clientId: "cli-005",
      caseId: "proc-006",
      description: "Parecer contratual (12 h)",
      feeType: "hora",
      amount: 5400,
      dueDate: d(10),
      status: "aberta",
    },
    {
      id: "fat-106",
      clientId: "cli-004",
      caseId: "proc-005",
      description: "Honorários de êxito (sentença)",
      feeType: "exito",
      amount: 7600,
      dueDate: d(-3),
      status: "vencida",
    },
    {
      id: "fat-107",
      clientId: "cli-003",
      caseId: "proc-003",
      description: "Honorários iniciais",
      feeType: "fixo",
      amount: 3000,
      dueDate: d(-15),
      status: "paga",
      paidAt: d(-15),
    },
    {
      id: "fat-108",
      clientId: "cli-005",
      description: "Assessoria mensal",
      feeType: "mensal",
      amount: 6800,
      dueDate: d(20),
      status: "aberta",
    },
  ];
}

/** Recebimentos dos últimos 6 meses (valores fictícios). */
export function getMockMonthlyReceipts(now = new Date()): MonthlyReceipt[] {
  const values = [18400, 21750, 19900, 24300, 22150, 26900];
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "America/Recife",
  });
  return values.map((received, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (values.length - 1 - index), 15);
    const label = formatter.format(date).replace(".", "");
    return {
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      received,
    };
  });
}

export type Invoice = {
  id: string;
  clientId: string;
  caseId?: string;
  description: string;
  feeType: "fixo" | "mensal" | "exito" | "hora";
  amount: number;
  dueDate: string;
  status: "paga" | "aberta" | "vencida";
  paidAt?: string;
};

export const FEE_TYPE_LABELS: Record<Invoice["feeType"], string> = {
  fixo: "Honorário fixo",
  mensal: "Mensalidade",
  exito: "Êxito",
  hora: "Por hora",
};

export type MonthlyReceipt = { month: string; label: string; received: number };

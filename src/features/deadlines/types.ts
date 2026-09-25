export type AgendaItem = {
  id: string;
  kind: "prazo" | "audiencia" | "tarefa";
  title: string;
  caseId?: string;
  dueAt: string;
  responsible: string;
  status: "pendente" | "cumprido" | "cancelado";
  priority: "alta" | "media" | "baixa";
};

export const AGENDA_KIND_LABELS: Record<AgendaItem["kind"], string> = {
  prazo: "Prazo",
  audiencia: "Audiência",
  tarefa: "Tarefa",
};

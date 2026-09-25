export type CaseStatus = "ativo" | "suspenso" | "arquivado" | "encerrado";
export type CaseArea =
  "Cível" | "Trabalhista" | "Família" | "Tributário" | "Previdenciário" | "Consumidor";

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  arquivado: "Arquivado",
  encerrado: "Encerrado",
};

export type CaseMovement = {
  id: string;
  at: string;
  title: string;
  description: string;
  /** Versão em linguagem simples, exibida no portal do cliente. */
  plainText: string;
  source: "DataJud" | "Manual";
};

export type LegalCase = {
  id: string;
  /** Número CNJ (20 dígitos); ausente em casos consultivos. */
  cnj?: string;
  kind: "judicial" | "consultivo";
  title: string;
  clientId: string;
  area: CaseArea;
  court?: string;
  vara?: string;
  comarca?: string;
  phase: "Conhecimento" | "Recursal" | "Execução" | "Consultivo";
  side?: "Ativo" | "Passivo";
  parties: { name: string; role: string }[];
  responsible: string[];
  claimValue?: number;
  status: CaseStatus;
  /** Segredo de justiça: visível só a advogados designados e admin. */
  secret: boolean;
  startedAt: string;
  movements: CaseMovement[];
};

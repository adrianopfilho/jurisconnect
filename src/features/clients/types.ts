export type LegalBasis =
  "execucao_contrato" | "exercicio_direitos" | "consentimento" | "obrigacao_legal";

export const LEGAL_BASIS_LABELS: Record<LegalBasis, string> = {
  execucao_contrato: "Execução de contrato (LGPD, art. 7º, V)",
  exercicio_direitos: "Exercício regular de direitos em processo (LGPD, art. 7º, VI)",
  consentimento: "Consentimento do titular (LGPD, art. 7º, I)",
  obrigacao_legal: "Cumprimento de obrigação legal (LGPD, art. 7º, II)",
};

export type Consent = { acceptedAt: string; ip: string; termVersion: string; revokedAt?: string };

export type ClientHistoryEntry = { at: string; description: string; actor: string };

export type Client = {
  id: string;
  kind: "PF" | "PJ";
  name: string;
  /** CPF (PF) ou CNPJ (PJ), só dígitos. */
  document: string;
  rg?: string;
  email: string;
  phone: string;
  address: {
    cep: string;
    street: string;
    number: string;
    district: string;
    city: string;
    uf: string;
  };
  legalBasis: LegalBasis;
  consent?: Consent;
  responsible: string;
  status: "ativo" | "inativo";
  createdAt: string;
  history: ClientHistoryEntry[];
};

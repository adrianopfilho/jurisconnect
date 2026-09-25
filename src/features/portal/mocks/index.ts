/** DADOS FICTÍCIOS — somente para o modo protótipo (NEXT_PUBLIC_PROTOTYPE=true). */
import { daysFromToday } from "@/lib/prototype/dates";

import { type PortalMessage, type SharedDocument } from "../types";

/** Cliente fictício usado na demonstração do portal. */
export const DEMO_PORTAL_CLIENT_ID = "cli-001";

export function getMockSharedDocuments(now = new Date()): SharedDocument[] {
  const d = (days: number) => daysFromToday(days, "10:00", now);
  return [
    { id: "doc-1", name: "Petição inicial.pdf", caseId: "proc-001", sharedAt: d(-94), sizeKb: 412 },
    {
      id: "doc-2",
      name: "Contrato de honorários.pdf",
      caseId: "proc-001",
      sharedAt: d(-90),
      sizeKb: 188,
    },
    {
      id: "doc-3",
      name: "Resumo da contestação.pdf",
      caseId: "proc-001",
      sharedAt: d(-18),
      sizeKb: 96,
    },
  ];
}

export function getMockMessages(now = new Date()): PortalMessage[] {
  const d = (days: number, time: string) => daysFromToday(days, time, now);
  return [
    {
      id: "msg-1",
      from: "cliente",
      author: "Mariana Exemplo Albuquerque",
      at: d(-3, "19:12"),
      body: "Boa noite! Alguma novidade sobre o meu processo?",
    },
    {
      id: "msg-2",
      from: "escritorio",
      author: "Dra. Helena Modelo",
      at: d(-2, "09:05"),
      body: "Bom dia, Mariana! O banco apresentou a defesa e estamos preparando a resposta. Já estamos preparando a resposta dentro do prazo.",
    },
    {
      id: "msg-3",
      from: "cliente",
      author: "Mariana Exemplo Albuquerque",
      at: d(-2, "09:40"),
      body: "Obrigada pelo retorno!",
    },
  ];
}

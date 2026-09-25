"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const RIGHTS = [
  {
    id: "confirmacao",
    title: "Confirmação e acesso",
    description: "Saber se tratamos seus dados e receber uma cópia.",
  },
  {
    id: "correcao",
    title: "Correção",
    description: "Corrigir dados incompletos, inexatos ou desatualizados.",
  },
  {
    id: "portabilidade",
    title: "Portabilidade",
    description: "Receber seus dados em JSON ou PDF.",
  },
  {
    id: "anonimizacao",
    title: "Anonimização ou eliminação",
    description: "Quando não houver dever legal de guarda.",
  },
  {
    id: "compartilhamento",
    title: "Informação sobre compartilhamento",
    description: "Com quem seus dados foram compartilhados.",
  },
  {
    id: "consentimento",
    title: "Revogar consentimento",
    description: "Para tratamentos baseados no seu consentimento.",
  },
];

/** Direitos do titular (LGPD, art. 18). Na versão real, cada pedido vira protocolo com prazo de 15 dias. */
export function DataRights({ notice }: { notice: string }) {
  const [requested, setRequested] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      <ul className="grid gap-2 sm:grid-cols-2">
        {RIGHTS.map((right) => (
          <li key={right.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm">
            <span className="font-medium">{right.title}</span>
            <span className="flex-1 text-muted-foreground">{right.description}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() => setRequested(right.title)}
            >
              Solicitar
            </Button>
          </li>
        ))}
      </ul>
      {requested && (
        <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm">
          Pedido de “{requested}” simulado. {notice}
        </p>
      )}
    </div>
  );
}

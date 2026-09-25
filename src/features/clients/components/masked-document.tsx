"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCnpj, formatCpf, maskCpf } from "@/lib/format/documents";

/**
 * Documento do cliente. CPF aparece mascarado por padrão (regra 9); revelar é
 * uma ação sensível que, no sistema real, grava em audit_logs.
 */
export function MaskedDocument({
  kind,
  document,
  revealNotice,
}: {
  kind: "PF" | "PJ";
  document: string;
  /** Texto exibido ao revelar (ex.: aviso de que a ação é auditada). */
  revealNotice?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  if (kind === "PJ") {
    return <span className="tabular-nums">CNPJ {formatCnpj(document)}</span>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="tabular-nums" data-testid="cpf-value">
        CPF {revealed ? formatCpf(document) : maskCpf(document)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={() => setRevealed((value) => !value)}
        aria-pressed={revealed}
      >
        {revealed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        {revealed ? "Ocultar" : "Revelar"}
      </Button>
      {revealed && revealNotice && (
        <span role="status" className="text-xs text-muted-foreground">
          {revealNotice}
        </span>
      )}
    </span>
  );
}

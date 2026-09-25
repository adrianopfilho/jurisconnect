import { FlaskConical } from "lucide-react";

/** Faixa fixa que identifica o modo protótipo em todas as telas. */
export function PrototypeBanner() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 bg-gold px-4 py-1.5 text-center text-xs font-medium text-navy"
    >
      <FlaskConical className="size-3.5 shrink-0" aria-hidden />
      Modo protótipo · todos os dados são fictícios · nada é salvo
    </div>
  );
}

import { formatDateTime } from "@/lib/config/locale";
import { cn } from "@/lib/utils";

import { type CaseMovement } from "../types";

/**
 * Linha do tempo de andamentos. Variante "simples" mostra o texto em
 * linguagem acessível (portal do cliente).
 */
export function CaseTimeline({
  movements,
  variant = "tecnico",
}: {
  movements: CaseMovement[];
  variant?: "tecnico" | "simples";
}) {
  const ordered = [...movements].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <ol className="relative grid gap-5 border-l border-border pl-5">
      {ordered.map((movement, index) => (
        <li key={movement.id} className="relative">
          <span
            className={cn(
              "absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-card",
              index === 0 ? "bg-accent" : "bg-muted-foreground/50",
            )}
            aria-hidden
          />
          <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
            <time dateTime={movement.at}>{formatDateTime(movement.at)}</time>
            {variant === "tecnico" && <span>· {movement.source}</span>}
          </div>
          <p className="font-medium">{movement.title}</p>
          <p className="text-sm text-muted-foreground">
            {variant === "simples" ? movement.plainText : movement.description}
          </p>
        </li>
      ))}
    </ol>
  );
}

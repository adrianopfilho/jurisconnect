import { type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Indicador numérico de destaque (sem gráfico). */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  tone?: "default" | "attention";
}) {
  const content = (
    <Card className={cn("h-full gap-2 py-4 transition-colors", href && "hover:bg-muted/40")}>
      <CardContent className="grid gap-1 px-4">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon
            className={cn("size-4", tone === "attention" ? "text-destructive" : "text-accent")}
            aria-hidden
          />
          {label}
        </span>
        <span className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
          {value}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  );

  return href ? (
    <Link
      href={href}
      className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {content}
    </Link>
  ) : (
    content
  );
}

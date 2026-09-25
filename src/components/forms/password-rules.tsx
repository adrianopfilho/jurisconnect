import { Check, X } from "lucide-react";

import { PASSWORD_RULES } from "@/lib/validation/common";
import { cn } from "@/lib/utils";

export function PasswordRules({ value }: { value: string }) {
  return (
    <ul className="grid gap-1 text-xs" aria-label="Requisitos da senha">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(value);
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5",
              passed ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
            )}
          >
            {passed ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <X className="size-3.5" aria-hidden />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{passed ? " (atendido)" : " (pendente)"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

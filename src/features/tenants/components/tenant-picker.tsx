"use client";

import { Building2, ChevronRight } from "lucide-react";
import { useState, useTransition } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { type Membership } from "@/lib/auth/session";

import { switchTenantAction } from "../actions";

export function TenantPicker({ memberships }: { memberships: Membership[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      <FormAlert error={error} />
      <ul className="grid gap-2">
        {memberships.map((m) => (
          <li key={m.tenantId}>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await switchTenantAction({ tenantId: m.tenantId });
                  if (result && !result.ok) setError(result.error);
                })
              }
              className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
            >
              <Building2 className="size-5 text-accent" aria-hidden />
              <span className="flex-1">
                <span className="block font-medium">{m.tenantName}</span>
                <Badge variant="secondary" className="mt-1">
                  {ROLE_LABELS[m.role]}
                </Badge>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

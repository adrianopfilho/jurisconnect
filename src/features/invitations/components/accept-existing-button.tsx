"use client";

import { useState, useTransition } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";

import { acceptInvitationExistingUserAction } from "../actions";

export function AcceptExistingButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      <FormAlert error={error} />
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvitationExistingUserAction({ token });
            if (result && !result.ok) setError(result.error);
          })
        }
      >
        {pending ? "Aceitando..." : "Aceitar convite"}
      </Button>
    </div>
  );
}

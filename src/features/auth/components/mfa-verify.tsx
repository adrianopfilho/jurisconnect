"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

import { recordMfaEventAction } from "../actions";
import { mfaCodeSchema, type MfaCodeInput } from "../schemas";

export function MfaVerify({ factorId, next }: { factorId: string; next: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<MfaCodeInput>({
    resolver: zodResolver(mfaCodeSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = form.handleSubmit(({ code }) => {
    startTransition(async () => {
      const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId, code });
      if (error) {
        form.setError("code", { message: "Código inválido ou expirado." });
        return;
      }
      await recordMfaEventAction("verified");
      router.replace(next);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FormField
        id="code"
        label="Código do aplicativo autenticador"
        hint="Abra o aplicativo autenticador e informe o código de 6 dígitos do JurisConnect."
        error={form.formState.errors.code?.message}
      >
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          {...form.register("code")}
        />
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? "Verificando..." : "Verificar"}
      </Button>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

import { recordMfaEventAction } from "../actions";
import { mfaCodeSchema, type MfaCodeInput } from "../schemas";

type Enrollment = { factorId: string; qrCode: string; secret: string };

export function MfaEnroll({ next }: { next: string }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<MfaCodeInput>({
    resolver: zodResolver(mfaCodeSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      // Remove cadastros anteriores não concluídos antes de gerar um novo QR code.
      const { data: factors } = await supabase.auth.mfa.listFactors();
      for (const factor of factors?.all ?? []) {
        if (factor.factor_type === "totp" && factor.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Autenticador ${new Date().toISOString().slice(0, 10)}`,
      });
      if (cancelled) return;
      if (enrollError || !data) {
        setError("Não foi possível iniciar o cadastro do autenticador. Recarregue a página.");
        return;
      }
      setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = form.handleSubmit(({ code }) => {
    if (!enrollment) return;
    setError(null);
    startTransition(async () => {
      const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({
        factorId: enrollment.factorId,
        code,
      });
      if (verifyError) {
        form.setError("code", {
          message: "Código inválido ou expirado. Tente o código atual do aplicativo.",
        });
        return;
      }
      await recordMfaEventAction("enrolled");
      router.replace(next);
      router.refresh();
    });
  });

  return (
    <div className="grid gap-5">
      <FormAlert error={error} />
      <ol className="grid list-decimal gap-2 pl-5 text-sm text-muted-foreground">
        <li>
          Instale um aplicativo autenticador (Google Authenticator, Microsoft Authenticator,
          1Password etc.).
        </li>
        <li>Escaneie o QR code abaixo ou digite a chave manualmente.</li>
        <li>Informe o código de 6 dígitos gerado pelo aplicativo.</li>
      </ol>
      <div className="flex flex-col items-center gap-3">
        {enrollment ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- QR code em data URI gerado pelo Supabase */}
            <img
              src={enrollment.qrCode}
              alt="QR code para cadastrar o JurisConnect no aplicativo autenticador"
              width={192}
              height={192}
              className="rounded-md bg-white p-2"
            />
            <p className="text-center text-xs text-muted-foreground">
              Chave manual:{" "}
              <code
                data-testid="totp-secret"
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground"
              >
                {enrollment.secret}
              </code>
            </p>
          </>
        ) : (
          <Skeleton className="size-48" />
        )}
      </div>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormField
          id="code"
          label="Código de verificação"
          error={form.formState.errors.code?.message}
        >
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            {...form.register("code")}
          />
        </FormField>
        <Button type="submit" disabled={pending || !enrollment}>
          {pending ? "Verificando..." : "Ativar autenticação em dois fatores"}
        </Button>
      </form>
    </div>
  );
}

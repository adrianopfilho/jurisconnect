"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";

import { FormAlert } from "@/components/forms/form-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { PasswordRules } from "@/components/forms/password-rules";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useActionForm } from "@/lib/actions/use-action-form";

import { acceptInvitationNewUserAction } from "../actions";
import { acceptNewUserSchema, type AcceptNewUserInput } from "../schemas";

export function AcceptNewUserForm({ token, email }: { token: string; email: string }) {
  const form = useForm<AcceptNewUserInput>({
    resolver: zodResolver(acceptNewUserSchema),
    defaultValues: { token, fullName: "", password: "", confirmPassword: "", acceptTerms: false },
  });
  const { onSubmit, pending, error } = useActionForm(form, acceptInvitationNewUserAction);
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: "password" }) ?? "";

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FormAlert error={error} />
      <FormField id="email" label="E-mail">
        <Input type="email" value={email} readOnly disabled />
      </FormField>
      <FormField id="fullName" label="Nome completo" error={errors.fullName?.message}>
        <Input autoComplete="name" {...form.register("fullName")} />
      </FormField>
      <FormField id="password" label="Crie uma senha" error={errors.password?.message}>
        <PasswordInput autoComplete="new-password" {...form.register("password")} />
      </FormField>
      <PasswordRules value={password} />
      <FormField
        id="confirmPassword"
        label="Confirme a senha"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
      </FormField>
      <div className="grid gap-1">
        <label className="flex items-start gap-2 text-sm">
          <Checkbox className="mt-0.5" {...form.register("acceptTerms")} />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" target="_blank" className="underline underline-offset-4">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" target="_blank" className="underline underline-offset-4">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        {errors.acceptTerms?.message && (
          <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Criando acesso..." : "Aceitar convite e criar acesso"}
      </Button>
    </form>
  );
}

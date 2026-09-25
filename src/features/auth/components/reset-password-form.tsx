"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { FormAlert } from "@/components/forms/form-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { PasswordRules } from "@/components/forms/password-rules";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useActionForm } from "@/lib/actions/use-action-form";

import { resetPasswordAction } from "../actions";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";

export function ResetPasswordForm() {
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { onSubmit, pending, error } = useActionForm(form, resetPasswordAction);
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: "password" }) ?? "";

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FormAlert error={error} />
      <FormField id="password" label="Nova senha" error={errors.password?.message}>
        <PasswordInput autoComplete="new-password" {...form.register("password")} />
      </FormField>
      <PasswordRules value={password} />
      <FormField
        id="confirmPassword"
        label="Confirme a nova senha"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}

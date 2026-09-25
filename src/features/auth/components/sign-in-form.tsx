"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { FormAlert } from "@/components/forms/form-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useActionForm } from "@/lib/actions/use-action-form";

import { signInAction } from "../actions";
import { signInSchema, type SignInInput } from "../schemas";

export function SignInForm({ next }: { next?: string }) {
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", next },
  });
  const { onSubmit, pending, error } = useActionForm(form, signInAction);
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FormAlert error={error} />
      <FormField id="email" label="E-mail" error={errors.email?.message}>
        <Input type="email" autoComplete="email" {...form.register("email")} />
      </FormField>
      <FormField id="password" label="Senha" error={errors.password?.message}>
        <PasswordInput autoComplete="current-password" {...form.register("password")} />
      </FormField>
      <div className="text-right text-sm">
        <Link
          href="/recuperar-senha"
          className="text-primary underline-offset-4 hover:underline dark:text-accent"
        >
          Esqueci minha senha
        </Link>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

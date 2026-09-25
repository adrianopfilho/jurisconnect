"use client";

import { useState, useTransition } from "react";
import { type FieldValues, type Path, type UseFormReturn } from "react-hook-form";

import { type ActionResult } from "./result";

/**
 * Executa uma Server Action a partir de um formulário do React Hook Form,
 * aplicando os erros por campo e a mensagem geral retornados pelo servidor.
 */
export function useActionForm<TValues extends FieldValues, TOutput, TData>(
  form: UseFormReturn<TValues, unknown, TOutput>,
  action: (values: TOutput) => Promise<ActionResult<TData>>,
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await action(values);
      if (!result) return;
      if (result.ok) {
        setSuccess(result.message ?? null);
        return;
      }
      setError(result.error);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) form.setError(field as Path<TValues>, { message });
      }
    });
  });

  return { onSubmit, pending, error, success, setError, setSuccess };
}

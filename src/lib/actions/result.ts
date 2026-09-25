import { type z } from "zod";

export type FieldErrors = Partial<Record<string, string>>;

export type ActionResult<T = undefined> =
  { ok: true; data: T; message?: string } | { ok: false; error: string; fieldErrors?: FieldErrors };

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(
  error: string,
  fieldErrors?: FieldErrors,
): { ok: false; error: string; fieldErrors?: FieldErrors } {
  return { ok: false, error, fieldErrors };
}

/** Converte erros do Zod em mensagens por campo (primeira mensagem de cada campo). */
export function fromZodError(error: z.ZodError): {
  ok: false;
  error: string;
  fieldErrors: FieldErrors;
} {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Verifique os campos destacados.", fieldErrors };
}

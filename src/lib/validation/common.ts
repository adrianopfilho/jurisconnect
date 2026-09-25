import { z } from "zod";

export const emailSchema = z
  .string({ error: "Informe o e-mail." })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "E-mail inválido." }).max(254, { error: "E-mail muito longo." }));

export const fullNameSchema = z
  .string({ error: "Informe o nome." })
  .trim()
  .min(2, { error: "Informe o nome completo." })
  .max(160, { error: "Nome muito longo." });

/** Espelha a política do Supabase Auth (config.toml): 10+ caracteres, maiúscula, minúscula, número e símbolo. */
export const PASSWORD_RULES = [
  { id: "length", label: "Pelo menos 10 caracteres", test: (v: string) => v.length >= 10 },
  { id: "upper", label: "Uma letra maiúscula", test: (v: string) => /[A-Z]/.test(v) },
  { id: "lower", label: "Uma letra minúscula", test: (v: string) => /[a-z]/.test(v) },
  { id: "digit", label: "Um número", test: (v: string) => /[0-9]/.test(v) },
  {
    id: "symbol",
    label: "Um símbolo (ex.: ! @ # $ %)",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

export const passwordSchema = z
  .string({ error: "Informe a senha." })
  .max(72, { error: "A senha deve ter no máximo 72 caracteres." })
  .superRefine((value, ctx) => {
    const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));
    if (failed.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `A senha precisa de: ${failed.map((rule) => rule.label.toLowerCase()).join(", ")}.`,
      });
    }
  });

/** Caminho interno seguro para redirecionamento (evita open redirect). */
export function safeRedirectPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

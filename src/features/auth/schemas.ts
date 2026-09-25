import { z } from "zod";

import { emailSchema, fullNameSchema, passwordSchema } from "@/lib/validation/common";

export const TERMS_VERSION = "2026-09";

export const signUpSchema = z
  .object({
    officeName: z
      .string({ error: "Informe o nome do escritório." })
      .trim()
      .min(2, { error: "Informe o nome do escritório." })
      .max(160, { error: "Nome muito longo." }),
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((value) => value, {
      error: "É preciso aceitar os Termos de Uso e a Política de Privacidade.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "As senhas não conferem.",
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Informe a senha." }).max(72),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "As senhas não conferem.",
  });

export const mfaCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, { error: "Informe o código de 6 dígitos do aplicativo autenticador." }),
});

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignInInput = z.input<typeof signInSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type MfaCodeInput = z.input<typeof mfaCodeSchema>;

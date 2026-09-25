import { z } from "zod";

import { fullNameSchema, passwordSchema } from "@/lib/validation/common";

export const invitationTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, { error: "Convite inválido." });

export const acceptNewUserSchema = z
  .object({
    token: invitationTokenSchema,
    fullName: fullNameSchema,
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

export type AcceptNewUserInput = z.input<typeof acceptNewUserSchema>;

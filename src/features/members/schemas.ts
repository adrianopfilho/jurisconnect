import { z } from "zod";

import { APP_ROLES } from "@/lib/auth/roles";
import { emailSchema } from "@/lib/validation/common";

export const roleSchema = z.enum(APP_ROLES, { error: "Selecione o perfil de acesso." });

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: roleSchema,
});

export const updateMemberSchema = z.object({
  memberId: z.uuid(),
  role: roleSchema,
  status: z.enum(["active", "disabled"]),
});

export const idSchema = z.object({ id: z.uuid() });

export type InviteMemberInput = z.input<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.input<typeof updateMemberSchema>;

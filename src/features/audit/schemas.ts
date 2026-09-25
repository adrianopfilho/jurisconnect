import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Filtros da tela de auditoria (vindos da URL: tudo opcional e tolerante). */
export const auditFiltersSchema = z.object({
  de: isoDate.optional().catch(undefined),
  ate: isoDate.optional().catch(undefined),
  usuario: z.uuid().optional().catch(undefined),
  acao: z
    .string()
    .regex(/^[a-z_.]{1,60}$/)
    .optional()
    .catch(undefined),
  pagina: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
});

export type AuditFilters = z.infer<typeof auditFiltersSchema>;

export const AUDIT_PAGE_SIZE = 50;

/** Converte a data (dd do calendário de Recife, UTC-3) em instante ISO. */
export function recifeDayBoundary(date: string, edge: "start" | "end"): string {
  return edge === "start" ? `${date}T00:00:00.000-03:00` : `${date}T23:59:59.999-03:00`;
}

import { describe, expect, it } from "vitest";

import { auditFiltersSchema, recifeDayBoundary } from "./schemas";

describe("filtros da auditoria", () => {
  it("descarta valores inválidos vindos da URL", () => {
    expect(
      auditFiltersSchema.parse({
        de: "01/02/2026",
        usuario: "abc",
        acao: "DROP TABLE",
        pagina: "-3",
      }),
    ).toEqual({ de: undefined, usuario: undefined, acao: undefined, pagina: 1 });
  });

  it("aceita filtros válidos", () => {
    const filters = auditFiltersSchema.parse({ de: "2026-02-01", acao: "auth.", pagina: "2" });
    expect(filters).toMatchObject({ de: "2026-02-01", acao: "auth.", pagina: 2 });
  });

  it("usa o dia civil de Recife (UTC-3)", () => {
    expect(new Date(recifeDayBoundary("2026-02-01", "start")).toISOString()).toBe(
      "2026-02-01T03:00:00.000Z",
    );
    expect(new Date(recifeDayBoundary("2026-02-01", "end")).toISOString()).toBe(
      "2026-02-02T02:59:59.999Z",
    );
  });
});

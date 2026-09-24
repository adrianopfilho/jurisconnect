import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate, formatDateTime } from "./locale";

describe("formatação regional", () => {
  it("formata datas como dd/mm/aaaa", () => {
    expect(formatDate("2026-03-15T15:00:00Z")).toBe("15/03/2026");
  });

  it("usa o fuso America/Recife (UTC-3) na virada do dia", () => {
    // 02:00 UTC de 01/01 ainda é 23:00 de 31/12 em Recife.
    expect(formatDate("2026-01-01T02:00:00Z")).toBe("31/12/2025");
    expect(formatDateTime("2026-01-01T02:00:00Z")).toBe("31/12/2025, 23:00");
  });

  it("formata moeda em reais", () => {
    expect(formatCurrency(1234.5)).toBe("R$ 1.234,50");
  });
});

import { describe, expect, it } from "vitest";

import { formatChartValue } from "./format";

describe("formatChartValue", () => {
  it("formata números e reais em pt-BR", () => {
    expect(formatChartValue(1234)).toBe("1.234");
    expect(formatChartValue(1234.5, "currency")).toMatch(/^R\$\s1\.234,50$/);
    expect(formatChartValue(26900, "currency-compact")).toMatch(/^R\$\s27\smil$/);
  });
});

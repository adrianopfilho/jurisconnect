import { describe, expect, it } from "vitest";

import { dayDiff, daysFromToday, recifeDay } from "./dates";

describe("datas relativas do protótipo", () => {
  const now = new Date("2026-03-10T02:30:00Z"); // 09/03 às 23:30 em Recife

  it("usa o dia civil de Recife", () => {
    expect(recifeDay(now)).toBe("2026-03-09");
  });

  it("gera instantes relativos a hoje em Recife", () => {
    expect(daysFromToday(0, "14:00", now)).toBe("2026-03-09T17:00:00.000Z");
    expect(daysFromToday(3, "09:00", now)).toBe("2026-03-12T12:00:00.000Z");
  });

  it("calcula a distância em dias civis", () => {
    expect(dayDiff(daysFromToday(0, "08:00", now), now)).toBe(0);
    expect(dayDiff(daysFromToday(7, "08:00", now), now)).toBe(7);
    expect(dayDiff(daysFromToday(-2, "08:00", now), now)).toBe(-2);
  });
});

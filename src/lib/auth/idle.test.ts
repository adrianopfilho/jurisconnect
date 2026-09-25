import { describe, expect, it } from "vitest";

import { formatCountdown, getIdleState, IDLE_TIMEOUT_MS, isIdleExpired } from "./idle";

const MIN = 60 * 1000;

describe("inatividade", () => {
  it("fica ativo até 28 minutos", () => {
    expect(getIdleState(0, 27 * MIN + 59_000)).toEqual({ status: "active" });
  });

  it("avisa nos 2 minutos finais com o tempo restante", () => {
    expect(getIdleState(0, 28 * MIN)).toEqual({ status: "warning", remainingMs: 2 * MIN });
    expect(getIdleState(0, 29 * MIN + 30_000)).toEqual({ status: "warning", remainingMs: 30_000 });
  });

  it("expira aos 30 minutos", () => {
    expect(getIdleState(0, IDLE_TIMEOUT_MS)).toEqual({ status: "expired" });
  });

  it("interpreta o cookie de atividade com segurança", () => {
    const now = 100 * MIN;
    expect(isIdleExpired(String(now - 31 * MIN), now)).toBe(true);
    expect(isIdleExpired(String(now - 5 * MIN), now)).toBe(false);
    expect(isIdleExpired(undefined, now)).toBe(false);
    expect(isIdleExpired("abc", now)).toBe(false);
  });

  it("formata a contagem regressiva", () => {
    expect(formatCountdown(2 * MIN)).toBe("2:00");
    expect(formatCountdown(61_500)).toBe("1:02");
    expect(formatCountdown(-5)).toBe("0:00");
  });
});

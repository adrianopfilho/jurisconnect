import { afterEach, describe, expect, it, vi } from "vitest";

import { demoHome, isPrototypeMode, parseDemoProfile } from "./mode";

describe("modo protótipo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fica desligado por padrão e só liga com o valor exato 'true'", () => {
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE", "");
    expect(isPrototypeMode()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE", "1");
    expect(isPrototypeMode()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE", "true");
    expect(isPrototypeMode()).toBe(true);
  });

  it("aceita somente perfis de demonstração conhecidos", () => {
    expect(parseDemoProfile("escritorio")).toBe("escritorio");
    expect(parseDemoProfile("cliente")).toBe("cliente");
    expect(parseDemoProfile("admin")).toBeNull();
    expect(parseDemoProfile(undefined)).toBeNull();
  });

  it("leva cada perfil à sua área", () => {
    expect(demoHome("escritorio")).toBe("/prototipo");
    expect(demoHome("cliente")).toBe("/prototipo/portal");
  });
});

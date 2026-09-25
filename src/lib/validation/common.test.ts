import { describe, expect, it } from "vitest";

import { emailSchema, passwordSchema, safeRedirectPath } from "./common";

describe("passwordSchema", () => {
  it("aceita senha forte", () => {
    expect(passwordSchema.safeParse("Senha@Forte10").success).toBe(true);
  });

  it.each([
    ["curta", "Ab1@"],
    ["sem maiúscula", "senha@forte10"],
    ["sem minúscula", "SENHA@FORTE10"],
    ["sem número", "Senha@Fortee"],
    ["sem símbolo", "SenhaForte10"],
  ])("rejeita senha %s", (_, value) => {
    expect(passwordSchema.safeParse(value).success).toBe(false);
  });

  it("lista o que falta na mensagem", () => {
    const result = passwordSchema.safeParse("senhafraca");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("uma letra maiúscula");
  });
});

describe("emailSchema", () => {
  it("normaliza para minúsculas e remove espaços", () => {
    expect(emailSchema.parse("  Ana.Silva@Exemplo.TEST ")).toBe("ana.silva@exemplo.test");
  });

  it("rejeita e-mail inválido", () => {
    expect(emailSchema.safeParse("ana@").success).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it.each([
    ["/app/usuarios", "/app/usuarios"],
    ["https://malicioso.test", "/app"],
    ["//malicioso.test", "/app"],
    ["/\\malicioso.test", "/app"],
    [undefined, "/app"],
  ])("%s → %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });
});

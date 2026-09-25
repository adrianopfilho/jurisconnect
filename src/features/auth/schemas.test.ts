import { describe, expect, it } from "vitest";

import { mfaCodeSchema, signUpSchema } from "./schemas";

const valid = {
  officeName: "Escritório Exemplo",
  fullName: "Ana Exemplo",
  email: "ana@exemplo.test",
  password: "Senha@Forte10",
  confirmPassword: "Senha@Forte10",
  acceptTerms: true,
};

describe("signUpSchema", () => {
  it("aceita cadastro válido", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("exige aceite dos termos", () => {
    expect(signUpSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });

  it("exige confirmação de senha igual", () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: "Outra@Senha10" });
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});

describe("mfaCodeSchema", () => {
  it("aceita somente 6 dígitos", () => {
    expect(mfaCodeSchema.safeParse({ code: " 123456 " }).success).toBe(true);
    expect(mfaCodeSchema.safeParse({ code: "12345a" }).success).toBe(false);
  });
});

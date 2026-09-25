import { describe, expect, it } from "vitest";

import { parseEnv, publicEnvSchema, serverEnvSchema } from "./schema";

describe("validação de variáveis de ambiente", () => {
  it("aceita variáveis públicas válidas", () => {
    const env = parseEnv(
      publicEnvSchema,
      {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "chave-publica",
      },
      "públicas",
    );
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:54321");
  });

  it("rejeita URL inválida e lista os campos com problema, sem expor valores", () => {
    expect(() =>
      parseEnv(
        publicEnvSchema,
        {
          NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
          NEXT_PUBLIC_SUPABASE_URL: "nao-e-url",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
        },
        "públicas",
      ),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("exige a service_role key no servidor", () => {
    expect(() => parseEnv(serverEnvSchema, {}, "servidor")).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("não aceita chaves de servidor no schema público", () => {
    expect(Object.keys(publicEnvSchema.shape)).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(Object.keys(publicEnvSchema.shape).every((key) => key.startsWith("NEXT_PUBLIC_"))).toBe(
      true,
    );
  });
});

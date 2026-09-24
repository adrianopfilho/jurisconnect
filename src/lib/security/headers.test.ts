import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, generateNonce, staticSecurityHeaders } from "./headers";

const parse = (csp: string) =>
  Object.fromEntries(
    csp.split("; ").map((directive) => {
      const [name, ...values] = directive.split(" ");
      return [name, values];
    }),
  );

describe("Content-Security-Policy", () => {
  const prod = parse(
    buildContentSecurityPolicy({
      nonce: "abc123",
      supabaseUrl: "https://projeto.supabase.co",
      isDev: false,
    }),
  );

  it("exige nonce e não permite scripts inline nem eval em produção", () => {
    expect(prod["script-src"]).toContain("'nonce-abc123'");
    expect(prod["script-src"]).toContain("'strict-dynamic'");
    expect(prod["script-src"]).not.toContain("'unsafe-inline'");
    expect(prod["script-src"]).not.toContain("'unsafe-eval'");
  });

  it("bloqueia embedding, plugins e troca de base-uri", () => {
    expect(prod["frame-ancestors"]).toEqual(["'none'"]);
    expect(prod["object-src"]).toEqual(["'none'"]);
    expect(prod["base-uri"]).toEqual(["'self'"]);
    expect(prod["upgrade-insecure-requests"]).toEqual([]);
  });

  it("libera apenas o Supabase configurado para conexões (https e wss)", () => {
    expect(prod["connect-src"]).toEqual([
      "'self'",
      "https://projeto.supabase.co",
      "wss://projeto.supabase.co",
    ]);
  });

  it("permite eval somente em desenvolvimento", () => {
    const dev = parse(
      buildContentSecurityPolicy({
        nonce: "n",
        supabaseUrl: "http://127.0.0.1:54321",
        isDev: true,
      }),
    );
    expect(dev["script-src"]).toContain("'unsafe-eval'");
    expect(dev["connect-src"]).toContain("ws://127.0.0.1:54321");
    expect(dev["upgrade-insecure-requests"]).toBeUndefined();
  });
});

describe("headers estáticos", () => {
  it("inclui HSTS, X-Frame-Options e Referrer-Policy", () => {
    const keys = staticSecurityHeaders.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Strict-Transport-Security",
        "X-Frame-Options",
        "Referrer-Policy",
        "X-Content-Type-Options",
        "Permissions-Policy",
      ]),
    );
  });
});

describe("generateNonce", () => {
  it("gera valores únicos em base64", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

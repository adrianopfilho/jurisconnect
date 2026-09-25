import { describe, expect, it } from "vitest";

import { getClientIp, trustedIpHeader } from "./ip";

const headers = (values: Record<string, string>) => new Headers(values);

describe("IP do cliente", () => {
  it("na Vercel usa somente x-real-ip, ignorando X-Forwarded-For forjado", () => {
    const h = headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.2.3.4" });
    expect(getClientIp(h, { VERCEL: "1" })).toBe("203.0.113.7");
    expect(getClientIp(headers({ "x-forwarded-for": "1.2.3.4" }), { VERCEL: "1" })).toBeNull();
  });

  it("fora da Vercel não confia em nenhum header sem configuração explícita", () => {
    const h = headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.2.3.4" });
    expect(trustedIpHeader({})).toBeNull();
    expect(getClientIp(h, {})).toBeNull();
  });

  it("usa o header configurado em TRUSTED_IP_HEADER (primeiro valor da lista)", () => {
    const h = headers({ "x-forwarded-for": "198.51.100.2, 10.0.0.1" });
    expect(getClientIp(h, { TRUSTED_IP_HEADER: "X-Forwarded-For" })).toBe("198.51.100.2");
  });

  it("aceita IPv6, remove o prefixo IPv4 mapeado e descarta valores inválidos", () => {
    expect(getClientIp(headers({ "x-real-ip": "2001:DB8::1" }), { VERCEL: "1" })).toBe(
      "2001:db8::1",
    );
    expect(getClientIp(headers({ "x-real-ip": "::ffff:198.51.100.2" }), { VERCEL: "1" })).toBe(
      "198.51.100.2",
    );
    expect(getClientIp(headers({ "x-real-ip": "999.1.1.1" }), { VERCEL: "1" })).toBeNull();
    expect(getClientIp(headers({ "x-real-ip": "não-é-ip" }), { VERCEL: "1" })).toBeNull();
  });
});

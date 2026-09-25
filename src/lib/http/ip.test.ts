import { describe, expect, it } from "vitest";

import { parseClientIp } from "./ip";

describe("parseClientIp", () => {
  it("usa o primeiro IP do X-Forwarded-For", () => {
    expect(parseClientIp("203.0.113.7, 10.0.0.1", null)).toBe("203.0.113.7");
  });

  it("aceita IPv6 e remove o prefixo IPv4 mapeado", () => {
    expect(parseClientIp("2001:DB8::1", null)).toBe("2001:db8::1");
    expect(parseClientIp("::ffff:198.51.100.2", null)).toBe("198.51.100.2");
  });

  it("recorre ao X-Real-IP e descarta valores inválidos", () => {
    expect(parseClientIp("não-é-ip", "198.51.100.9")).toBe("198.51.100.9");
    expect(parseClientIp("999.1.1.1", null)).toBeNull();
    expect(parseClientIp(null, null)).toBeNull();
  });
});

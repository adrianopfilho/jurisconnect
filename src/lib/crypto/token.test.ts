import { describe, expect, it } from "vitest";

import { generateToken, hashToken } from "./token";

describe("tokens de convite", () => {
  it("gera tokens de 256 bits em base64url e únicos", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it("gera o hash SHA-256 em hexadecimal aceito pelo banco", () => {
    expect(hashToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(hashToken(generateToken())).toMatch(/^[0-9a-f]{64}$/);
  });
});

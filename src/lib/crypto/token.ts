import "server-only";

import { createHash, randomBytes } from "node:crypto";

/** Token aleatório de 256 bits, seguro para URL (base64url). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Hash SHA-256 (hex) — somente o hash é gravado no banco. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

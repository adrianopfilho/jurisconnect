const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

function normalize(candidate: string | null | undefined): string | null {
  const value = candidate?.trim();
  if (!value) return null;
  const withoutMappedPrefix = value.replace(/^::ffff:/i, "");
  if (IPV4.test(withoutMappedPrefix)) return withoutMappedPrefix;
  if (value.includes(":") && IPV6.test(value)) return value.toLowerCase();
  return null;
}

/**
 * Extrai o IP do cliente dos headers do proxy (primeiro valor de
 * X-Forwarded-For, que deve ser definido pela plataforma de hospedagem).
 * Valores inválidos são descartados para não quebrar a coluna inet.
 */
export function parseClientIp(forwardedFor: string | null, realIp: string | null): string | null {
  return normalize(forwardedFor?.split(",")[0]) ?? normalize(realIp);
}

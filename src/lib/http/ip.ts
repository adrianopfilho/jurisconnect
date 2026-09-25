const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

/** Header de IP definido pelo proxy da Vercel (não pode ser forjado pelo cliente). */
export const VERCEL_IP_HEADER = "x-real-ip";

function normalize(candidate: string | null | undefined): string | null {
  const value = candidate?.split(",")[0]?.trim();
  if (!value) return null;
  const withoutMappedPrefix = value.replace(/^::ffff:/i, "");
  if (IPV4.test(withoutMappedPrefix)) return withoutMappedPrefix;
  if (value.includes(":") && IPV6.test(value)) return value.toLowerCase();
  return null;
}

type HeaderReader = { get(name: string): string | null };
type IpEnv = { VERCEL?: string; TRUSTED_IP_HEADER?: string };

/**
 * Header confiável para o IP do cliente, ou null se não houver nenhum.
 * - Na Vercel: sempre `x-real-ip`, calculado pelo proxy da Vercel.
 * - Fora dela: somente o header configurado em TRUSTED_IP_HEADER (definido
 *   pelo proxy reverso da hospedagem). Sem configuração, nenhum header é
 *   aceito, pois o cliente poderia forjá-lo e driblar o bloqueio por IP.
 */
export function trustedIpHeader(env: IpEnv): string | null {
  if (env.VERCEL === "1") return VERCEL_IP_HEADER;
  const configured = env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  return configured ? configured : null;
}

/** IP do cliente lido apenas do header confiável; valores inválidos são descartados. */
export function getClientIp(headers: HeaderReader, env: IpEnv): string | null {
  const header = trustedIpHeader(env);
  return header ? normalize(headers.get(header)) : null;
}

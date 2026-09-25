import "server-only";

import { headers } from "next/headers";

import { parseClientIp } from "./ip";

export type RequestMeta = { ip: string | undefined; userAgent: string | undefined };

/** IP e user agent da requisição atual (para auditoria e rate limiting). */
export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  return {
    ip: parseClientIp(h.get("x-forwarded-for"), h.get("x-real-ip")) ?? undefined,
    userAgent: h.get("user-agent")?.slice(0, 512) || undefined,
  };
}

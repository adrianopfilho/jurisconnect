import "server-only";

import { headers } from "next/headers";

import { getClientIp } from "./ip";

export type RequestMeta = { ip: string | undefined; userAgent: string | undefined };

/** IP (de header confiável) e user agent da requisição atual, para auditoria e rate limiting. */
export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  return {
    ip:
      getClientIp(h, {
        VERCEL: process.env.VERCEL,
        TRUSTED_IP_HEADER: process.env.TRUSTED_IP_HEADER,
      }) ?? undefined,
    userAgent: h.get("user-agent")?.slice(0, 512) || undefined,
  };
}

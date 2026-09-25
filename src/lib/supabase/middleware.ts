import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env/public";

import { type Database } from "./database.types";

/**
 * Renova a sessão do Supabase a cada requisição e propaga os cookies atualizados.
 * `requestHeaders` permite repassar headers extras (ex.: nonce da CSP) ao Next.js.
 */
export async function updateSession(request: NextRequest, requestHeaders: Headers) {
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  let response = next();

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          requestHeaders.set("cookie", request.cookies.toString());
          response = next();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Impede que CDNs/proxies façam cache de respostas com tokens de sessão.
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Não inserir código entre a criação do cliente e getClaims(): isso pode
  // causar logouts aleatórios difíceis de depurar.
  await supabase.auth.getClaims();

  return response;
}

import { type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env/public";
import { IDLE_COOKIE, isIdleExpired } from "@/lib/auth/idle";
import { buildContentSecurityPolicy, generateNonce } from "@/lib/security/headers";
import { redirectWithCookies, updateSession } from "@/lib/supabase/middleware";

/** Rotas que exigem usuário autenticado. */
const PROTECTED_PREFIXES = [
  "/app",
  "/portal",
  "/mfa",
  "/escritorios",
  "/sem-acesso",
  "/redefinir-senha",
];
/** Rotas de visitante: usuário autenticado é enviado para a área interna. */
const GUEST_ONLY = ["/login", "/cadastro"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

export async function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    supabaseUrl: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    isDev: process.env.NODE_ENV === "development",
  });

  // O Next.js lê o nonce do header CSP da requisição e o aplica aos próprios scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const { supabase, claims, getResponse } = await updateSession(request, requestHeaders);
  const path = request.nextUrl.pathname;
  const isProtected = matches(path, PROTECTED_PREFIXES);

  const finish = (response = getResponse()) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  if (!claims) {
    if (isProtected) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", `${path}${request.nextUrl.search}`);
      return finish(redirectWithCookies(url, getResponse()));
    }
    return finish();
  }

  // Logout por inatividade (30 min), verificado também no servidor.
  if (isProtected && isIdleExpired(request.cookies.get(IDLE_COOKIE)?.value, Date.now())) {
    await supabase.auth.signOut({ scope: "local" });
    const url = new URL("/login", request.url);
    url.searchParams.set("motivo", "inatividade");
    const response = redirectWithCookies(url, getResponse());
    response.cookies.delete(IDLE_COOKIE);
    return finish(response);
  }

  if (matches(path, GUEST_ONLY)) {
    return finish(redirectWithCookies(new URL("/app", request.url), getResponse()));
  }

  const response = getResponse();
  if (isProtected) {
    response.cookies.set(IDLE_COOKIE, String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return finish(response);
}

export const config = {
  matcher: [
    {
      // Ignora assets estáticos e imagens.
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnv } from "@/lib/env/public";
import { IDLE_COOKIE, isIdleExpired } from "@/lib/auth/idle";
import {
  DEMO_PROFILE_COOKIE,
  isPrototypeMode,
  parseDemoProfile,
  PROTOTYPE_BASE,
} from "@/lib/prototype/mode";
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

/** Rotas do sistema real, inexistentes no modo protótipo (sem backend). */
const REAL_APP_PREFIXES = [
  ...PROTECTED_PREFIXES,
  ...GUEST_ONLY,
  "/recuperar-senha",
  "/verificar-email",
  "/convite",
  "/auth",
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const prototype = isPrototypeMode();

  // Fora do modo protótipo as rotas de demonstração simplesmente não existem.
  if (!prototype && matches(path, [PROTOTYPE_BASE])) {
    // Reescreve para uma rota inexistente: o Next.js responde 404 com a página padrão.
    return NextResponse.rewrite(new URL("/_prototipo-indisponivel", request.url));
  }

  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    supabaseUrl: prototype ? null : getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
    isDev: process.env.NODE_ENV === "development",
  });

  // O Next.js lê o nonce do header CSP da requisição e o aplica aos próprios scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  if (prototype) return prototypeMiddleware(request, requestHeaders, csp);

  const { supabase, claims, getResponse } = await updateSession(request, requestHeaders);
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

/**
 * Modo protótipo: nenhuma chamada ao Supabase. O sistema real fica inacessível
 * e a área de demonstração exige apenas a escolha de um perfil fictício.
 */
function prototypeMiddleware(request: NextRequest, requestHeaders: Headers, csp: string) {
  const path = request.nextUrl.pathname;
  const withCsp = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };
  const entry = new URL(`${PROTOTYPE_BASE}/entrar`, request.url);

  if (matches(path, REAL_APP_PREFIXES)) return withCsp(NextResponse.redirect(entry));

  const isDemoArea =
    matches(path, [PROTOTYPE_BASE]) && !matches(path, [`${PROTOTYPE_BASE}/entrar`]);
  if (isDemoArea && !parseDemoProfile(request.cookies.get(DEMO_PROFILE_COOKIE)?.value)) {
    return withCsp(NextResponse.redirect(entry));
  }

  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
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

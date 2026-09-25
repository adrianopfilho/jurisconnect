import { NextResponse, type NextRequest } from "next/server";

import { DEMO_PROFILE_COOKIE, isPrototypeMode } from "@/lib/prototype/mode";

export function GET(request: NextRequest) {
  if (!isPrototypeMode()) return new NextResponse(null, { status: 404 });

  const response = NextResponse.redirect(new URL("/prototipo/entrar", request.url));
  response.cookies.set(DEMO_PROFILE_COOKIE, "", { path: "/prototipo", maxAge: 0 });
  return response;
}

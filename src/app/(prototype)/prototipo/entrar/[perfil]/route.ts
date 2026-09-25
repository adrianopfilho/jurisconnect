import { NextResponse, type NextRequest } from "next/server";

import {
  DEMO_PROFILE_COOKIE,
  demoHome,
  isPrototypeMode,
  parseDemoProfile,
} from "@/lib/prototype/mode";

/** Login de demonstração: escolhe o perfil fictício e entra direto. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ perfil: string }> },
) {
  if (!isPrototypeMode()) return new NextResponse(null, { status: 404 });

  const profile = parseDemoProfile((await params).perfil);
  if (!profile) return NextResponse.redirect(new URL("/prototipo/entrar", request.url));

  const response = NextResponse.redirect(new URL(demoHome(profile), request.url));
  response.cookies.set(DEMO_PROFILE_COOKIE, profile, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/prototipo",
  });
  return response;
}

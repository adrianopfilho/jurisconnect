import "server-only";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  DEMO_PROFILE_COOKIE,
  demoHome,
  isPrototypeMode,
  parseDemoProfile,
  PROTOTYPE_BASE,
  type DemoProfile,
} from "./mode";

/** Garante o modo protótipo (404 fora dele) e o perfil de demonstração esperado. */
export async function requireDemoProfile(expected: DemoProfile): Promise<DemoProfile> {
  if (!isPrototypeMode()) notFound();
  const profile = parseDemoProfile((await cookies()).get(DEMO_PROFILE_COOKIE)?.value);
  if (!profile) redirect(`${PROTOTYPE_BASE}/entrar`);
  if (profile !== expected) redirect(demoHome(profile));
  return profile;
}

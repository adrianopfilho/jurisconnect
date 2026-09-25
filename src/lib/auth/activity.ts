import "server-only";

import { cookies } from "next/headers";

import { IDLE_COOKIE } from "./idle";

/** Registra agora como o instante da última atividade (cookie httpOnly). */
export async function markActivity(): Promise<void> {
  (await cookies()).set(IDLE_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

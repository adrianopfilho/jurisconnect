import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { markActivity } from "@/lib/auth/activity";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/validation/common";

const ALLOWED_TYPES: EmailOtpType[] = ["email", "signup", "recovery", "email_change"];

/**
 * Confirmação de links enviados por e-mail (cadastro, recuperação de senha e
 * troca de e-mail) no fluxo recomendado para SSR: token_hash + verifyOtp.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const fallback = type === "recovery" ? "/redefinir-senha" : "/app";
  const next = safeRedirectPath(searchParams.get("next"), fallback);

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      // Sessão nova: zera o relógio de inatividade (um cookie antigo derrubaria a sessão).
      await markActivity();
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?motivo=link-invalido", request.url));
}

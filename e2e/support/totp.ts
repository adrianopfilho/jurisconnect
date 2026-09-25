import { TOTP } from "otpauth";

/**
 * Gera um código TOTP válido. Se o código atual já foi usado, espera a próxima
 * janela de 30 s (o Auth rejeita reutilização do mesmo código).
 */
export async function totpCode(secret: string, previous?: string): Promise<string> {
  const totp = new TOTP({ secret, digits: 6, period: 30, algorithm: "SHA1" });
  let code = totp.generate();
  while (code === previous) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    code = totp.generate();
  }
  return code;
}

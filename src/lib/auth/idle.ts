/** Logout por inatividade (regra de segurança da Fase 1). */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
/** Antecedência do aviso antes do logout. */
export const IDLE_WARNING_MS = 2 * 60 * 1000;
/** Intervalo mínimo entre registros de atividade no servidor. */
export const ACTIVITY_SYNC_INTERVAL_MS = 60 * 1000;
/** Cookie httpOnly com o instante da última atividade (epoch em ms). */
export const IDLE_COOKIE = "jc_last_activity";

export type IdleState =
  { status: "active" } | { status: "warning"; remainingMs: number } | { status: "expired" };

export function getIdleState(lastActivityMs: number, nowMs: number): IdleState {
  const elapsed = nowMs - lastActivityMs;
  if (elapsed >= IDLE_TIMEOUT_MS) return { status: "expired" };
  if (elapsed >= IDLE_TIMEOUT_MS - IDLE_WARNING_MS) {
    return { status: "warning", remainingMs: IDLE_TIMEOUT_MS - elapsed };
  }
  return { status: "active" };
}

/** Valor do cookie de atividade é válido e já passou do limite de inatividade? */
export function isIdleExpired(cookieValue: string | undefined, nowMs: number): boolean {
  const last = Number(cookieValue);
  if (!cookieValue || !Number.isFinite(last) || last <= 0) return false;
  return getIdleState(last, nowMs).status === "expired";
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

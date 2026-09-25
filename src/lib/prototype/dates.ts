import { APP_TIMEZONE } from "@/lib/config/locale";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dia civil (aaaa-mm-dd) em America/Recife. */
export function recifeDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Instante ISO relativo a hoje em Recife (UTC-3, sem horário de verão), para
 * que os dados fictícios sempre tenham prazos "hoje", "em 3 dias" etc.
 */
export function daysFromToday(days: number, time = "09:00", now = new Date()): string {
  const base = new Date(`${recifeDay(now)}T${time}:00-03:00`);
  return new Date(base.getTime() + days * DAY_MS).toISOString();
}

/** Diferença em dias civis de Recife entre hoje e a data (negativo = passado). */
export function dayDiff(iso: string, now = new Date()): number {
  const target = new Date(`${recifeDay(new Date(iso))}T00:00:00-03:00`).getTime();
  const today = new Date(`${recifeDay(now)}T00:00:00-03:00`).getTime();
  return Math.round((target - today) / DAY_MS);
}

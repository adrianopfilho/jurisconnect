/** Configurações regionais do JurisConnect (datas dd/mm/aaaa, moeda R$, fuso de Recife). */
export const APP_LOCALE = "pt-BR";
export const APP_TIMEZONE = "America/Recife";
export const APP_CURRENCY = "BRL";

const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const currencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: "currency",
  currency: APP_CURRENCY,
});

/** Formata uma data como dd/mm/aaaa no fuso America/Recife. */
export function formatDate(value: Date | string | number): string {
  return dateFormatter.format(new Date(value));
}

/** Formata data e hora como dd/mm/aaaa hh:mm no fuso America/Recife. */
export function formatDateTime(value: Date | string | number): string {
  return dateTimeFormatter.format(new Date(value));
}

/** Formata um valor em reais (R$). */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** Formatos de valor aceitos pelos gráficos (serializáveis entre servidor e cliente). */
export type ChartValueFormat = "number" | "currency" | "currency-compact";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
});

export function formatChartValue(value: number, format: ChartValueFormat = "number"): string {
  if (format === "currency") return currencyFormatter.format(value);
  if (format === "currency-compact") return compactCurrencyFormatter.format(value);
  return numberFormatter.format(value);
}

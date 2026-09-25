"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { formatChartValue, type ChartValueFormat } from "./format";

type Datum = { label: string; value: number; tooltipLabel?: string };

/**
 * Colunas de série única ao longo do tempo (ex.: recebimentos por mês).
 * Rótulo direto só no último período; os demais valores aparecem no hover
 * e na tabela alternativa.
 */
export function ColumnChart({
  data,
  caption,
  format = "number",
  height = 176,
}: {
  data: Datum[];
  caption: string;
  format?: ChartValueFormat;
  height?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const last = data.length - 1;

  return (
    <figure className="grid gap-3">
      <div className="relative" style={{ height }} aria-hidden>
        <div className="absolute inset-x-0 bottom-0 border-t border-border" />
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {data.map((d, index) => {
            const showLabel = index === last || active === index;
            return (
              <div
                key={d.label}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                className="relative flex h-full flex-1 items-end justify-center"
              >
                <div
                  className={cn(
                    "w-3/5 max-w-10 rounded-t-[4px] bg-primary transition-opacity",
                    active !== null && active !== index && "opacity-50",
                  )}
                  style={{ height: `${Math.max(2, (d.value / max) * 82)}%` }}
                />
                {showLabel && (
                  <span
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap tabular-nums",
                      active === index &&
                        "z-10 rounded-md border bg-popover px-2 py-0.5 text-popover-foreground shadow-sm",
                    )}
                    style={{ bottom: `calc(${Math.max(2, (d.value / max) * 82)}% + 6px)` }}
                  >
                    {active === index && d.tooltipLabel ? `${d.tooltipLabel}: ` : ""}
                    {formatChartValue(d.value, format)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-[2px] text-xs text-muted-foreground" aria-hidden>
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Ver dados em tabela</summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th className="py-1 font-medium">Período</th>
              <th className="py-1 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-t">
                <td className="py-1">{d.tooltipLabel ?? d.label}</td>
                <td className="py-1 text-right tabular-nums">
                  {formatChartValue(d.value, format)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { formatChartValue, type ChartValueFormat } from "./format";

type Datum = { label: string; value: number };

/**
 * Barras horizontais de série única (magnitude por categoria).
 * Uma cor só (a primária do tema), rótulo da categoria e valor em tinta de
 * texto, destaque no hover com a participação no total e tabela
 * alternativa para leitores de tela.
 */
export function BarListChart({
  data,
  caption,
  format = "number",
}: {
  data: Datum[];
  caption: string;
  format?: ChartValueFormat;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <figure className="grid gap-3">
      <ul className="grid gap-2.5" aria-hidden>
        {data.map((d, index) => {
          const share = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <li
              key={d.label}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-sm",
                active !== null && active !== index && "opacity-50",
              )}
            >
              <span className="truncate text-muted-foreground">{d.label}</span>
              <span className="relative h-3">
                <span
                  className="absolute inset-y-0 left-0 rounded-r-[4px] bg-primary"
                  style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
                />
                {active === index && (
                  <span className="absolute -top-7 left-0 z-10 rounded-md border bg-popover px-2 py-0.5 text-xs whitespace-nowrap text-popover-foreground shadow-sm">
                    {d.label}: {formatChartValue(d.value, format)} ({share}% do total)
                  </span>
                )}
              </span>
              <span className="text-right font-medium tabular-nums">
                {formatChartValue(d.value, format)}
              </span>
            </li>
          );
        })}
      </ul>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Ver dados em tabela</summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th className="py-1 font-medium">Categoria</th>
              <th className="py-1 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-t">
                <td className="py-1">{d.label}</td>
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

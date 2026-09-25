"use client";

import { AlarmClock, Gavel, ListChecks } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { APP_TIMEZONE, formatDate } from "@/lib/config/locale";
import { cn } from "@/lib/utils";

import { AGENDA_KIND_LABELS, type AgendaItem } from "../types";

const KIND_ICONS = { prazo: AlarmClock, audiencia: Gavel, tarefa: ListChecks };
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
const timeLabel = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
const weekdayLabel = (key: string) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(
    new Date(`${key}T12:00:00Z`),
  );

type View = "lista" | "mes";

export function AgendaView({
  items,
  caseTitles,
  todayKey,
}: {
  items: AgendaItem[];
  caseTitles: Record<string, string>;
  /** Dia de hoje (aaaa-mm-dd, Recife), calculado no servidor. */
  todayKey: string;
}) {
  const [view, setView] = useState<View>("lista");
  const [responsible, setResponsible] = useState("");
  const people = useMemo(() => [...new Set(items.map((i) => i.responsible))].sort(), [items]);

  const filtered = items
    .filter((item) => !responsible || item.responsible === responsible)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="responsavel">Responsável</Label>
          <NativeSelect
            id="responsavel"
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            className="min-w-56"
          >
            <option value="">Todos</option>
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex gap-1 rounded-md border p-1" role="group" aria-label="Visualização">
          {(["lista", "mes"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={view === option ? "default" : "ghost"}
              aria-pressed={view === option}
              onClick={() => setView(option)}
            >
              {option === "lista" ? "Lista" : "Mês"}
            </Button>
          ))}
        </div>
      </div>

      {view === "lista" ? (
        <AgendaList items={filtered} caseTitles={caseTitles} todayKey={todayKey} />
      ) : (
        <AgendaMonth items={filtered} todayKey={todayKey} />
      )}
    </div>
  );
}

function ItemBadge({ item, todayKey }: { item: AgendaItem; todayKey: string }) {
  if (item.status === "cumprido") return <Badge variant="secondary">Cumprido</Badge>;
  if (item.status === "cancelado") return <Badge variant="outline">Cancelado</Badge>;
  if (dayKey(item.dueAt) < todayKey) return <Badge variant="destructive">Atrasado</Badge>;
  if (dayKey(item.dueAt) === todayKey) return <Badge variant="accent">Hoje</Badge>;
  return <Badge variant="outline">{AGENDA_KIND_LABELS[item.kind]}</Badge>;
}

function AgendaList({
  items,
  caseTitles,
  todayKey,
}: {
  items: AgendaItem[];
  caseTitles: Record<string, string>;
  todayKey: string;
}) {
  const groups = new Map<string, AgendaItem[]>();
  for (const item of items)
    groups.set(dayKey(item.dueAt), [...(groups.get(dayKey(item.dueAt)) ?? []), item]);

  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">Nenhum compromisso.</p>;

  return (
    <div className="grid gap-5">
      {[...groups.entries()].map(([key, dayItems]) => (
        <section key={key} aria-label={formatDate(`${key}T12:00:00Z`)}>
          <h2 className="mb-2 flex items-baseline gap-2 font-sans text-sm font-semibold">
            <span className={cn(key === todayKey && "text-accent")}>
              {formatDate(`${key}T12:00:00Z`)}
            </span>
            <span className="font-normal text-muted-foreground capitalize">
              {weekdayLabel(key)}
            </span>
          </h2>
          <ul className="grid gap-2">
            {dayItems.map((item) => {
              const Icon = KIND_ICONS[item.kind];
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3 text-sm"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <span
                      className={cn(
                        "font-medium",
                        item.status !== "pendente" && "text-muted-foreground line-through",
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeLabel(item.dueAt)} · {item.responsible}
                      {item.caseId && (
                        <>
                          {" · "}
                          <Link
                            href={`/prototipo/processos/${item.caseId}`}
                            className="hover:underline"
                          >
                            {caseTitles[item.caseId]}
                          </Link>
                        </>
                      )}
                    </span>
                  </div>
                  <ItemBadge item={item} todayKey={todayKey} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">
        Prazos nunca são excluídos: apenas cumpridos ou cancelados com justificativa.
      </p>
    </div>
  );
}

function AgendaMonth({ items, todayKey }: { items: AgendaItem[]; todayKey: string }) {
  const [year, month] = todayKey.split("-").map(Number) as [number, number];
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = first.getUTCDay();
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
  const rawMonth = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(first);
  const monthLabel = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);

  return (
    <div className="grid gap-2">
      <h2 className="font-sans text-sm font-semibold">{monthLabel}</h2>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="bg-muted px-2 py-1 text-center font-medium text-muted-foreground"
          >
            {weekday}
          </div>
        ))}
        {cells.map((day, index) => {
          const key = day
            ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : "";
          const dayItems = day ? items.filter((item) => dayKey(item.dueAt) === key) : [];
          return (
            <div
              key={index}
              className={cn("min-h-12 bg-card p-1.5 sm:min-h-20", !day && "bg-muted/40")}
            >
              {day && (
                <>
                  <span
                    className={cn(
                      "inline-flex size-5 items-center justify-center rounded-full tabular-nums",
                      key === todayKey && "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    {day}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="mt-1 flex flex-wrap gap-0.5 sm:hidden" aria-hidden>
                      {dayItems.map((item) => (
                        <span
                          key={item.id}
                          className={cn(
                            "size-1.5 rounded-full",
                            item.kind === "audiencia" ? "bg-accent" : "bg-primary",
                            item.status !== "pendente" && "opacity-40",
                          )}
                        />
                      ))}
                    </span>
                  )}
                  <ul className="mt-1 hidden gap-0.5 sm:grid">
                    {dayItems.map((item) => (
                      <li
                        key={item.id}
                        title={`${AGENDA_KIND_LABELS[item.kind]}: ${item.title}`}
                        className={cn(
                          "truncate rounded px-1 py-0.5",
                          item.kind === "audiencia" ? "bg-accent/20" : "bg-secondary",
                          item.status !== "pendente" && "line-through opacity-60",
                        )}
                      >
                        {timeLabel(item.dueAt)} {item.title}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { CircleAlert, CircleCheck, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { type Invoice } from "../types";

const CONFIG = {
  paga: { label: "Paga", icon: CircleCheck, variant: "secondary" },
  aberta: { label: "Em aberto", icon: Clock, variant: "outline" },
  vencida: { label: "Vencida", icon: CircleAlert, variant: "destructive" },
} as const;

/** Situação da fatura: sempre ícone + texto (nunca só cor). */
export function InvoiceStatusBadge({ status }: { status: Invoice["status"] }) {
  const { label, icon: Icon, variant } = CONFIG[status];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}

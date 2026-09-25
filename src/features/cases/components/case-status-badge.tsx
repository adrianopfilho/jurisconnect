import { Archive, CircleCheck, CirclePause, CirclePlay } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { CASE_STATUS_LABELS, type CaseStatus } from "../types";

const ICONS = {
  ativo: CirclePlay,
  suspenso: CirclePause,
  arquivado: Archive,
  encerrado: CircleCheck,
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const Icon = ICONS[status];
  return (
    <Badge variant={status === "ativo" ? "default" : "secondary"}>
      <Icon aria-hidden />
      {CASE_STATUS_LABELS[status]}
    </Badge>
  );
}

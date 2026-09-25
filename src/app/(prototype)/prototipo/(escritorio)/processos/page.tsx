import { Lock } from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CaseStatusBadge } from "@/features/cases/components/case-status-badge";
import { getMockCases } from "@/features/cases/mocks";
import { getMockClients } from "@/features/clients/mocks";
import { formatDate } from "@/lib/config/locale";
import { formatCnj } from "@/lib/format/documents";

export const metadata: Metadata = { title: "Processos" };

export default function DemoCasesPage() {
  const cases = getMockCases();
  const clientName = new Map(getMockClients().map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        title="Processos"
        description="Processos judiciais e casos consultivos (dados fictícios)."
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processo</TableHead>
                <TableHead className="hidden md:table-cell">Cliente</TableHead>
                <TableHead>Área</TableHead>
                <TableHead className="hidden lg:table-cell">Tribunal / vara</TableHead>
                <TableHead className="hidden lg:table-cell">Último andamento</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((item) => {
                const last = [...item.movements].sort((a, b) => b.at.localeCompare(a.at))[0];
                return (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-72">
                      <Link
                        href={`/prototipo/processos/${item.id}`}
                        className="grid gap-0.5 hover:underline"
                      >
                        <span className="flex items-center gap-1 font-medium">
                          {item.secret && (
                            <Lock className="size-3 shrink-0" aria-label="Segredo de justiça" />
                          )}
                          <span className="truncate">{item.title}</span>
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {item.cnj ? formatCnj(item.cnj) : "Consultivo (sem processo)"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {clientName.get(item.clientId)}
                    </TableCell>
                    <TableCell>{item.area}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {item.court ? `${item.court} · ${item.vara}` : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {last ? `${formatDate(last.at)} · ${last.title}` : "—"}
                    </TableCell>
                    <TableCell>
                      <CaseStatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

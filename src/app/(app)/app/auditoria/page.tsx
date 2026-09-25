import { ShieldAlert, ShieldCheck } from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditFiltersForm } from "@/features/audit/components/audit-filters";
import { actionLabel } from "@/features/audit/labels";
import { AUDIT_PAGE_SIZE, auditFiltersSchema } from "@/features/audit/schemas";
import {
  listAuditLogs,
  listTenantPeople,
  recordAuditView,
  verifyAuditChain,
} from "@/features/audit/service";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { requireActiveMember } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/config/locale";

export const metadata: Metadata = { title: "Auditoria" };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireActiveMember({
    area: "app",
    roles: ["admin", "dpo"],
    next: "/app/auditoria",
  });
  const filters = auditFiltersSchema.parse(await searchParams);

  await recordAuditView(filters);
  const [{ rows, total }, people, chain] = await Promise.all([
    listAuditLogs(ctx.active.tenantId, filters),
    listTenantPeople(ctx.active.tenantId),
    verifyAuditChain(),
  ]);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && key !== "pagina") params.set(key, String(value));
    }
    params.set("pagina", String(page));
    return `/app/auditoria?${params.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Registro imutável das ações no escritório. Somente administradores e o encarregado (DPO) têm acesso."
      />
      <div className="grid gap-4">
        {chain && (
          <Alert variant={chain.valid ? "success" : "destructive"}>
            {chain.valid ? <ShieldCheck aria-hidden /> : <ShieldAlert aria-hidden />}
            <AlertDescription>
              {chain.valid
                ? `Integridade verificada: ${chain.checked} registros sem alteração.`
                : "Falha de integridade detectada na trilha de auditoria. Acione o encarregado (DPO)."}
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardContent className="grid gap-6">
            <AuditFiltersForm filters={filters} people={people} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell>{row.actorName ?? "Sistema"}</TableCell>
                    <TableCell>{row.actorRole ? ROLE_LABELS[row.actorRole] : "—"}</TableCell>
                    <TableCell>{actionLabel(row.action)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.entityType
                        ? `${row.entityType}${row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">{row.ip ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {total} registro(s) · página {Math.min(filters.pagina, pages)} de {pages}
              </span>
              <div className="flex gap-2">
                {filters.pagina > 1 && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={pageHref(filters.pagina - 1)}>Anterior</Link>
                  </Button>
                )}
                {filters.pagina < pages && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={pageHref(filters.pagina + 1)}>Próxima</Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

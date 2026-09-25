import { type Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationsTable } from "@/features/members/components/invitations-table";
import { InviteDialog } from "@/features/members/components/invite-dialog";
import { MembersTable } from "@/features/members/components/members-table";
import { listMembers, listPendingInvitations } from "@/features/members/service";
import { invitableRoles } from "@/lib/auth/roles";
import { requireActiveMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsersPage() {
  const ctx = await requireActiveMember({
    area: "app",
    roles: ["admin", "lawyer"],
    next: "/app/usuarios",
  });
  const isAdmin = ctx.active.role === "admin";
  const [members, invitations] = await Promise.all([
    listMembers(ctx.active.tenantId, isAdmin),
    listPendingInvitations(ctx.active.tenantId),
  ]);

  return (
    <>
      <PageHeader
        title="Usuários"
        description={
          isAdmin
            ? "Equipe e clientes com acesso ao escritório. Novos acessos somente por convite."
            : "Equipe do escritório. Você pode convidar clientes para o portal."
        }
        actions={<InviteDialog roles={invitableRoles(ctx.active.role)} />}
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Membros</CardTitle>
            <CardDescription>
              Membros desativados perdem o acesso na hora; o histórico é preservado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MembersTable members={members} canManage={isAdmin} currentUserId={ctx.userId} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <InvitationsTable invitations={invitations} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

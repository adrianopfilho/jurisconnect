"use client";

import { useState, useTransition } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ActionResult } from "@/lib/actions/result";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/config/locale";

import { inviteMemberAction, revokeInvitationAction } from "../actions";
import { type PendingInvitation } from "../service";

export function InvitationsTable({ invitations }: { invitations: PendingInvitation[] }) {
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [pending, startTransition] = useTransition();
  // Horário de referência fixado na renderização para marcar convites expirados.
  const [now] = useState(() => Date.now());

  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await action();
      setFeedback(result.ok ? { success: result.message } : { error: result.error });
    });

  if (invitations.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p>;
  }

  return (
    <div className="grid gap-3">
      <FormAlert error={feedback.error} success={feedback.success} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const expired = new Date(invitation.expiresAt).getTime() <= now;
            return (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.email}</TableCell>
                <TableCell>{ROLE_LABELS[invitation.role]}</TableCell>
                <TableCell className={expired ? "text-destructive" : undefined}>
                  {expired ? "Expirado" : formatDateTime(invitation.expiresAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          inviteMemberAction({ email: invitation.email, role: invitation.role }),
                        )
                      }
                    >
                      Reenviar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => run(() => revokeInvitationAction({ id: invitation.id }))}
                    >
                      Revogar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

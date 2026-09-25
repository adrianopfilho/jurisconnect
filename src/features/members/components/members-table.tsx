"use client";

import { Lock, MoreHorizontal } from "lucide-react";
import { useState, useTransition } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ActionResult } from "@/lib/actions/result";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import { formatDate, formatDateTime } from "@/lib/config/locale";

import { unlockMemberAction, updateMemberAction } from "../actions";
import { type MemberRow } from "../service";

type Pending = { kind: "role"; member: MemberRow } | { kind: "status"; member: MemberRow } | null;

export function MembersTable({
  members,
  canManage,
  currentUserId,
}: {
  members: MemberRow[];
  canManage: boolean;
  currentUserId: string;
}) {
  const [dialog, setDialog] = useState<Pending>(null);
  const [role, setRole] = useState<AppRole>("lawyer");
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await action();
      setFeedback(result.ok ? { success: result.message } : { error: result.error });
      if (result.ok) setDialog(null);
    });

  return (
    <div className="grid gap-3">
      <FormAlert error={feedback.error} success={feedback.success} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>Desde</TableHead>
            {canManage && (
              <TableHead className="w-10">
                <span className="sr-only">Ações</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id} data-testid={`member-${member.email}`}>
              <TableCell className="font-medium">{member.fullName}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{ROLE_LABELS[member.role]}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={member.status === "active" ? "secondary" : "destructive"}>
                    {member.status === "active" ? "Ativo" : "Desativado"}
                  </Badge>
                  {member.lockedUntil && (
                    <Badge
                      variant="outline"
                      title={`Bloqueado até ${formatDateTime(member.lockedUntil)}`}
                    >
                      <Lock aria-hidden /> Bloqueado
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDate(member.createdAt)}</TableCell>
              {canManage && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Ações para ${member.fullName}`}
                      >
                        <MoreHorizontal aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setRole(member.role);
                          setDialog({ kind: "role", member });
                        }}
                      >
                        Alterar perfil
                      </DropdownMenuItem>
                      {member.userId !== currentUserId && (
                        <DropdownMenuItem
                          variant={member.status === "active" ? "destructive" : "default"}
                          onSelect={() => setDialog({ kind: "status", member })}
                        >
                          {member.status === "active" ? "Desativar acesso" : "Reativar acesso"}
                        </DropdownMenuItem>
                      )}
                      {member.lockedUntil && (
                        <DropdownMenuItem
                          onSelect={() => run(() => unlockMemberAction({ id: member.id }))}
                        >
                          Desbloquear login
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialog?.kind === "role"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar perfil de acesso</DialogTitle>
            <DialogDescription>{dialog?.member.fullName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="member-role">Perfil</Label>
            <NativeSelect
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
            >
              {APP_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() =>
                dialog &&
                run(() =>
                  updateMemberAction({
                    memberId: dialog.member.id,
                    role,
                    status: dialog.member.status,
                  }),
                )
              }
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog?.kind === "status"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.member.status === "active" ? "Desativar acesso" : "Reativar acesso"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.member.status === "active"
                ? `${dialog?.member.fullName} perderá o acesso ao escritório imediatamente. O histórico, a autoria e os registros de auditoria são preservados.`
                : `${dialog?.member.fullName} voltará a acessar o escritório com o perfil atual.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancelar
            </Button>
            <Button
              variant={dialog?.member.status === "active" ? "destructive" : "default"}
              disabled={pending}
              onClick={() =>
                dialog &&
                run(() =>
                  updateMemberAction({
                    memberId: dialog.member.id,
                    role: dialog.member.role,
                    status: dialog.member.status === "active" ? "disabled" : "active",
                  }),
                )
              }
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

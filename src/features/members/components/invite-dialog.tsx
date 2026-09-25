"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useActionForm } from "@/lib/actions/use-action-form";
import { ROLE_LABELS, type AppRole } from "@/lib/auth/roles";

import { inviteMemberAction } from "../actions";
import { inviteMemberSchema, type InviteMemberInput } from "../schemas";

export function InviteDialog({ roles }: { roles: AppRole[] }) {
  const [open, setOpen] = useState(false);
  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: roles[0] },
  });
  const { onSubmit, pending, error, success, setError, setSuccess } = useActionForm(
    form,
    inviteMemberAction,
  );
  const onlyClients = roles.length === 1 && roles[0] === "client";

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          form.reset();
          setError(null);
          setSuccess(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus aria-hidden />
          {onlyClients ? "Convidar cliente" : "Convidar"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {onlyClients ? "Convidar cliente para o portal" : "Convidar para o escritório"}
          </DialogTitle>
          <DialogDescription>
            A pessoa receberá um link pessoal por e-mail, de uso único e válido por 24 horas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <FormAlert error={error} success={success} />
          <FormField id="invite-email" label="E-mail" error={form.formState.errors.email?.message}>
            <Input type="email" autoComplete="off" {...form.register("email")} />
          </FormField>
          <FormField
            id="invite-role"
            label="Perfil de acesso"
            error={form.formState.errors.role?.message}
          >
            <NativeSelect {...form.register("role")} disabled={roles.length === 1}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando..." : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { type Metadata } from "next";
import Link from "next/link";

import { FormAlert } from "@/components/forms/form-alert";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { AcceptExistingButton } from "@/features/invitations/components/accept-existing-button";
import { AcceptNewUserForm } from "@/features/invitations/components/accept-new-user-form";
import { findInvitation, type InvitationStatus } from "@/features/invitations/service";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { getSessionContext } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/config/locale";

export const metadata: Metadata = { title: "Convite", referrer: "no-referrer" };

const STATUS_MESSAGES: Record<InvitationStatus, string> = {
  pending: "",
  expired: "Este convite expirou. Peça um novo convite ao escritório.",
  accepted: "Este convite já foi utilizado.",
  revoked: "Este convite foi cancelado pelo escritório.",
};

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await findInvitation(token);

  if (!invitation || invitation.status !== "pending") {
    return (
      <AuthCard title="Convite indisponível">
        <FormAlert error={invitation ? STATUS_MESSAGES[invitation.status] : "Convite inválido."} />
      </AuthCard>
    );
  }

  const ctx = await getSessionContext();
  const description = (
    <>
      Você foi convidado para acessar{" "}
      <strong className="text-foreground">{invitation.tenantName}</strong> como{" "}
      <strong className="text-foreground">{ROLE_LABELS[invitation.role]}</strong>. O convite vale
      até {formatDateTime(invitation.expiresAt)}.
    </>
  );

  if (ctx) {
    const sameEmail = ctx.email.toLowerCase() === invitation.email;
    return (
      <AuthCard
        title="Aceitar convite"
        description={description}
        footer={<SignOutButton variant="link" />}
      >
        {sameEmail ? (
          <AcceptExistingButton token={token} />
        ) : (
          <FormAlert
            error={`Você está conectado como ${ctx.email}, mas o convite foi enviado para ${invitation.email}. Saia e entre com a conta correta.`}
          />
        )}
      </AuthCard>
    );
  }

  if (invitation.accountExists) {
    return (
      <AuthCard title="Aceitar convite" description={description}>
        <div className="grid gap-4">
          <p className="text-sm">
            Já existe uma conta para <strong>{invitation.email}</strong>. Entre com ela para aceitar
            o convite.
          </p>
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(`/convite/${token}`)}`}>
              Entrar para aceitar
            </Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Crie seu acesso" description={description}>
      <AcceptNewUserForm token={token} email={invitation.email} />
    </AuthCard>
  );
}

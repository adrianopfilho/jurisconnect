import { formatDateTime } from "@/lib/config/locale";
import { ROLE_LABELS, type AppRole } from "@/lib/auth/roles";

import { escapeHtml } from "./escape";

export type EmailMessage = { subject: string; html: string; text: string };

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f7f6f3;font-family:Arial,Helvetica,sans-serif;color:#141b2d">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden">
          <tr><td style="background:#0f1e3d;padding:20px 32px;color:#b8955a;font-family:Georgia,serif;font-size:22px">JurisConnect</td></tr>
          <tr><td style="padding:32px">
            <h1 style="font-family:Georgia,serif;font-size:20px;margin:0 0 16px;color:#0f1e3d">${escapeHtml(title)}</h1>
            ${body}
          </td></tr>
          <tr><td style="padding:16px 32px;background:#efede8;font-size:12px;color:#5b6272">
            Mensagem automática. Não responda este e-mail.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function invitationEmail(params: {
  tenantName: string;
  inviterName: string;
  role: AppRole;
  url: string;
  expiresAt: Date;
}): EmailMessage {
  const role = ROLE_LABELS[params.role];
  const expires = formatDateTime(params.expiresAt);
  const subject = `Convite para ${params.tenantName} no JurisConnect`;

  const html = layout(
    "Você recebeu um convite",
    `<p>${escapeHtml(params.inviterName)} convidou você para acessar
       <strong>${escapeHtml(params.tenantName)}</strong> no JurisConnect como
       <strong>${escapeHtml(role)}</strong>.</p>
     <p style="margin:24px 0">
       <a href="${escapeHtml(params.url)}" style="background:#0f1e3d;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none">Aceitar convite</a>
     </p>
     <p>O link é pessoal, de uso único e expira em ${escapeHtml(expires)}.</p>
     <p style="font-size:13px;color:#5b6272">Se você não esperava este convite, ignore esta mensagem.</p>`,
  );

  const text = [
    `${params.inviterName} convidou você para acessar ${params.tenantName} no JurisConnect como ${role}.`,
    `Aceite o convite: ${params.url}`,
    `O link é pessoal, de uso único e expira em ${expires}.`,
    "Se você não esperava este convite, ignore esta mensagem.",
  ].join("\n\n");

  return { subject, html, text };
}

export function accountLockedEmail(params: { lockedUntil: Date; resetUrl: string }): EmailMessage {
  const until = formatDateTime(params.lockedUntil);
  const subject = "Sua conta no JurisConnect foi bloqueada temporariamente";

  const html = layout(
    "Bloqueio temporário por tentativas de acesso",
    `<p>Detectamos 5 tentativas de login sem sucesso na sua conta. Por segurança,
       novas tentativas a partir da mesma conexão ficarão bloqueadas até ${escapeHtml(until)}.
       Seu acesso a partir de outras conexões continua normal.</p>
     <p>Se não foi você, recomendamos redefinir sua senha e avisar o administrador do escritório.</p>
     <p style="margin:24px 0">
       <a href="${escapeHtml(params.resetUrl)}" style="background:#0f1e3d;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none">Redefinir senha</a>
     </p>`,
  );

  const text = [
    `Detectamos 5 tentativas de login sem sucesso na sua conta. Novas tentativas a partir da mesma conexão ficarão bloqueadas até ${until}; seu acesso a partir de outras conexões continua normal.`,
    `Se não foi você, redefina sua senha: ${params.resetUrl}`,
  ].join("\n\n");

  return { subject, html, text };
}

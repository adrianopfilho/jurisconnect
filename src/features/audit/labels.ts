const ACTION_LABELS: Record<string, string> = {
  "tenant.created": "Escritório criado",
  "tenant.updated": "Escritório alterado",
  "tenant_member.created": "Membro adicionado",
  "tenant_member.updated": "Membro alterado",
  "invitation.created": "Convite enviado",
  "invitation.accepted": "Convite aceito",
  "invitation.revoked": "Convite revogado",
  "session.tenant_switched": "Troca de escritório",
  "auth.login_succeeded": "Login",
  "auth.logout": "Logout",
  "auth.idle_logout": "Logout por inatividade",
  "auth.account_locked": "Conta bloqueada por tentativas",
  "auth.account_unlocked": "Conta desbloqueada",
  "auth.password_changed": "Senha alterada",
  "auth.mfa_enrolled": "MFA ativado",
  "auth.mfa_verified": "MFA verificado",
  "audit_log.viewed": "Auditoria consultada",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export const ACTION_FILTER_OPTIONS = [
  { value: "auth.", label: "Autenticação" },
  { value: "invitation.", label: "Convites" },
  { value: "tenant_member.", label: "Membros" },
  { value: "tenant.", label: "Escritório" },
  { value: "audit_log.", label: "Consultas à auditoria" },
];

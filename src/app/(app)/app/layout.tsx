import { APP_NAV, AppShell } from "@/components/layout/app-shell";
import { UserMenu } from "@/components/layout/user-menu";
import { IdleTimeoutGuard } from "@/features/auth/components/idle-timeout-guard";
import { getOwnProfileName } from "@/lib/auth/profile";
import { requireActiveMember } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireActiveMember({ area: "app" });
  const fullName = (await getOwnProfileName(ctx.userId)) ?? ctx.email;
  const user = {
    email: ctx.email,
    fullName,
    role: ctx.active.role,
    tenantName: ctx.active.tenantName,
    tenantCount: ctx.memberships.length,
  };

  return (
    <AppShell
      user={user}
      nav={APP_NAV}
      userMenu={<UserMenu user={user} />}
      guard={<IdleTimeoutGuard />}
    >
      {children}
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { getOwnProfileName } from "@/lib/auth/profile";
import { requireActiveMember } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireActiveMember({ area: "app" });
  const fullName = (await getOwnProfileName(ctx.userId)) ?? ctx.email;

  return (
    <AppShell
      user={{
        email: ctx.email,
        fullName,
        role: ctx.active.role,
        tenantName: ctx.active.tenantName,
        tenantCount: ctx.memberships.length,
      }}
    >
      {children}
    </AppShell>
  );
}

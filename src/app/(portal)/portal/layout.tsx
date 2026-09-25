import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { IdleTimeoutGuard } from "@/features/auth/components/idle-timeout-guard";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireActiveMember } from "@/lib/auth/session";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireActiveMember({ area: "portal", next: "/portal" });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center gap-3 border-b bg-navy px-4 text-white sm:px-6">
        <Brand className="text-white" />
        <span className="hidden truncate text-sm text-white/70 sm:inline">
          {ctx.active.tenantName}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton variant="ghost" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      <IdleTimeoutGuard />
    </div>
  );
}

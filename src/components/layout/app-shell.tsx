"use client";

import {
  Briefcase,
  Building2,
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Menu,
  ScrollText,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { type AppRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  clients: UserRound,
  cases: Briefcase,
  agenda: CalendarClock,
  finance: Wallet,
  users: Users,
  audit: ScrollText,
} satisfies Record<string, LucideIcon>;

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  roles?: readonly AppRole[];
  /** Marca como ativo só no caminho exato (ex.: a página inicial da área). */
  exact?: boolean;
};

/** Navegação da área interna real. */
export const APP_NAV: NavItem[] = [
  { href: "/app", label: "Painel", icon: "dashboard", exact: true },
  { href: "/app/usuarios", label: "Usuários", icon: "users", roles: ["admin", "lawyer"] },
  { href: "/app/auditoria", label: "Auditoria", icon: "audit", roles: ["admin", "dpo"] },
];

const COLLAPSED_KEY = "jc:sidebar-collapsed";

export type ShellUser = {
  email: string;
  fullName: string;
  role: AppRole;
  tenantName: string;
  tenantCount: number;
};

function NavLinks({
  nav,
  role,
  collapsed,
  onNavigate,
}: {
  nav: NavItem[];
  role: AppRole;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = nav.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <nav aria-label="Navegação principal" className="grid gap-1">
      {items.map(({ href, label, icon, exact }) => {
        const Icon = ICONS[icon];
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} aria-hidden />
            <span className={cn(collapsed && "sr-only")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  user,
  nav,
  userMenu,
  switchTenantHref = "/escritorios",
  banner,
  guard,
  children,
}: {
  user: ShellUser;
  nav: NavItem[];
  /** Menu do usuário (real ou de demonstração). */
  userMenu: React.ReactNode;
  switchTenantHref?: string;
  /** Faixa exibida acima do cabeçalho (ex.: aviso do modo protótipo). */
  banner?: React.ReactNode;
  /** Componentes de sessão (ex.: logout por inatividade). */
  guard?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // Preferência opcional.
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        window.localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1");
      } catch {
        // Preferência opcional.
      }
      return !value;
    });
  };

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className={cn("flex h-14 items-center px-4", collapsed && "justify-center px-2")}>
          <Brand compact={collapsed} className="text-sidebar-foreground" />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <NavLinks nav={nav} role={user.role} collapsed={collapsed} />
        </div>
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronsRight aria-hidden /> : <ChevronsLeft aria-hidden />}
            {!collapsed && <span>Recolher</span>}
          </Button>
        </div>
      </aside>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="top-0 left-0 h-full max-w-[80%] translate-x-0 translate-y-0 rounded-none border-0 bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs">
          <DialogTitle className="sr-only">Menu</DialogTitle>
          <div className="flex h-14 items-center px-4">
            <Brand className="text-sidebar-foreground" />
          </div>
          <div className="px-2">
            <NavLinks
              nav={nav}
              role={user.role}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        {banner}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu aria-hidden />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Building2 className="size-4 shrink-0 text-accent" aria-hidden />
            <span className="truncate text-sm font-medium" data-testid="active-tenant">
              {user.tenantName}
            </span>
            {user.tenantCount > 1 && (
              <Link
                href={switchTenantHref}
                className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                trocar
              </Link>
            )}
          </div>
          <ThemeToggle />
          {userMenu}
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {guard}
    </div>
  );
}

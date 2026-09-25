import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { DemoUserMenu } from "@/features/prototype/demo-user-menu";
import { PrototypeBanner } from "@/features/prototype/prototype-banner";
import { requireDemoProfile } from "@/lib/prototype/session";

const PROTOTYPE_NAV: NavItem[] = [
  { href: "/prototipo", label: "Painel", icon: "dashboard", exact: true },
  { href: "/prototipo/clientes", label: "Clientes", icon: "clients" },
  { href: "/prototipo/processos", label: "Processos", icon: "cases" },
  { href: "/prototipo/agenda", label: "Agenda", icon: "agenda" },
  { href: "/prototipo/financeiro", label: "Financeiro", icon: "finance" },
];

export default async function DemoOfficeLayout({ children }: { children: React.ReactNode }) {
  await requireDemoProfile("escritorio");

  return (
    <AppShell
      user={{
        email: "helena@modelo.test",
        fullName: "Dra. Helena Modelo",
        role: "admin",
        tenantName: "Modelo Advocacia (fictício)",
        tenantCount: 1,
      }}
      nav={PROTOTYPE_NAV}
      banner={<PrototypeBanner />}
      userMenu={
        <DemoUserMenu
          name="Dra. Helena Modelo"
          roleLabel="Sócia"
          switchHref="/prototipo/entrar/cliente"
          switchLabel="Ver como cliente (portal)"
        />
      }
    >
      {children}
    </AppShell>
  );
}

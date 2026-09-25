import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DemoUserMenu } from "@/features/prototype/demo-user-menu";
import { PrototypeBanner } from "@/features/prototype/prototype-banner";
import { requireDemoProfile } from "@/lib/prototype/session";

export default async function DemoPortalLayout({ children }: { children: React.ReactNode }) {
  await requireDemoProfile("cliente");

  return (
    <div className="flex min-h-screen flex-col">
      <PrototypeBanner />
      <header className="flex h-14 items-center gap-3 bg-navy px-4 text-white sm:px-6">
        <Brand className="text-white" />
        <span className="hidden truncate text-sm text-white/70 sm:inline">
          Modelo Advocacia (fictício)
        </span>
        <div className="ml-auto flex items-center gap-1 [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
          <ThemeToggle />
          <DemoUserMenu
            name="Mariana Exemplo Albuquerque"
            roleLabel="Cliente"
            switchHref="/prototipo/entrar/escritorio"
            switchLabel="Ver como escritório"
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

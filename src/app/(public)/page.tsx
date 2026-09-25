import { Lock, Scale, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

const HIGHLIGHTS = [
  { icon: ShieldCheck, text: "Dados isolados por escritório e protegidos por políticas no banco" },
  { icon: Lock, text: "Verificação em dois fatores para sócios e advogados" },
  { icon: Users, text: "Equipe e clientes entram somente por convite" },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-10 p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-navy text-gold">
          <Scale className="size-7" aria-hidden />
        </span>
        <h1 className="text-4xl font-semibold text-primary sm:text-5xl dark:text-foreground">
          JurisConnect
        </h1>
        <p className="max-w-md text-muted-foreground">
          Gestão jurídica para escritórios de advocacia, com segurança e conformidade com a LGPD.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/cadastro">Cadastrar escritório</Link>
          </Button>
        </div>
      </div>
      <ul className="grid max-w-3xl gap-3 sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2 rounded-lg border bg-card p-4 text-sm">
            <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
      <footer className="flex gap-4 text-xs text-muted-foreground">
        <Link href="/termos" className="hover:underline">
          Termos de Uso
        </Link>
        <Link href="/privacidade" className="hover:underline">
          Política de Privacidade
        </Link>
      </footer>
    </main>
  );
}

import { Briefcase, UserRound } from "lucide-react";
import { type Metadata } from "next";

import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrototypeBanner } from "@/features/prototype/prototype-banner";

export const metadata: Metadata = { title: "Demonstração" };

const OPTIONS = [
  {
    href: "/prototipo/entrar/escritorio",
    icon: Briefcase,
    title: "Entrar como escritório",
    description: "Dra. Helena Modelo (sócia): painel, clientes, processos, agenda e financeiro.",
  },
  {
    href: "/prototipo/entrar/cliente",
    icon: UserRound,
    title: "Entrar como cliente",
    description:
      "Mariana Exemplo Albuquerque: portal com processos, documentos, faturas e mensagens.",
  },
];

export default function DemoLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PrototypeBanner />
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Brand className="text-primary dark:text-foreground" />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-12 sm:items-center sm:pt-0">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl">Demonstração do JurisConnect</h1>
            </CardTitle>
            <CardDescription>
              Escolha uma visão para navegar. Não é preciso senha: todos os dados são fictícios.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {OPTIONS.map(({ href, icon: Icon, title, description }) => (
              <a
                key={href}
                href={href}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <span className="grid gap-1">
                  <span className="font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">{description}</span>
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { Scale } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-accent dark:bg-navy">
          <Scale className="size-7" aria-hidden />
        </span>
        <h1 className="text-4xl font-semibold text-primary sm:text-5xl dark:text-foreground">
          JurisConnect
        </h1>
        <p className="max-w-md text-muted-foreground">
          Gestão jurídica para escritórios de advocacia, com segurança e conformidade com a LGPD.
        </p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            Ambiente de desenvolvimento <Badge variant="accent">Fase 0</Badge>
          </CardTitle>
          <CardDescription>Estrutura base do projeto configurada.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["Next.js 15", "Supabase", "RLS", "pgTAP", "Vitest", "Playwright"].map((item) => (
            <Badge key={item} variant="secondary">
              {item}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

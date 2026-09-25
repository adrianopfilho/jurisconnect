import Link from "next/link";

import { Brand } from "@/components/layout/brand";

/** Estrutura das páginas legais. O texto definitivo é publicado na Fase 5 (módulo LGPD). */
export function LegalPage({
  title,
  version,
  children,
}: {
  title: string;
  version: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-8">
      <Brand className="text-primary dark:text-foreground" />
      <article className="grid gap-4">
        <h1 className="text-3xl font-semibold text-primary dark:text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Versão {version}</p>
        {children}
      </article>
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        Voltar ao início
      </Link>
    </div>
  );
}

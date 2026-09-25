import { type Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";
import { TERMS_VERSION } from "@/features/auth/schemas";

export const metadata: Metadata = { title: "Termos de Uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso" version={TERMS_VERSION}>
      <p>
        O texto definitivo dos Termos de Uso está em elaboração com a assessoria jurídica e será
        publicado nesta página antes da disponibilização comercial do JurisConnect.
      </p>
    </LegalPage>
  );
}

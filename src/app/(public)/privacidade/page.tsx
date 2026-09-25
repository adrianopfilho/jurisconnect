import { type Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";
import { TERMS_VERSION } from "@/features/auth/schemas";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade" version={TERMS_VERSION}>
      <p>
        O texto definitivo da Política de Privacidade, com as bases legais de tratamento, os
        direitos do titular (art. 18 da LGPD) e o contato do encarregado, será publicado nesta
        página no módulo LGPD.
      </p>
    </LegalPage>
  );
}

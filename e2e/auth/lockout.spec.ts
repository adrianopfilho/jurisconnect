import { expect, test } from "@playwright/test";

import { hasSupabase, SEED_PASSWORD } from "../support/env";
import { signIn } from "../support/flows";
import { countEmails } from "../support/mailpit";

test.skip(!hasSupabase, "requer Supabase local (E2E_SUPABASE=1)");

test("bloqueia a conta após 5 tentativas erradas, mesmo com a senha correta depois", async ({
  page,
}) => {
  const email = "financeiro@modelo.test";

  for (let attempt = 1; attempt <= 4; attempt++) {
    await signIn(page, email, `Errada@${attempt}Senha`);
    await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
  }

  await signIn(page, email, "Errada@5Senha");
  await expect(page.getByText(/Conta bloqueada temporariamente/)).toBeVisible();

  await signIn(page, email, SEED_PASSWORD);
  await expect(page.getByText(/Conta bloqueada temporariamente/)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);

  await expect.poll(() => countEmails(email, "bloqueada temporariamente")).toBeGreaterThan(0);
});

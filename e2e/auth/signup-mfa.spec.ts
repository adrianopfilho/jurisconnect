import { expect, test } from "@playwright/test";

import { hasSupabase } from "../support/env";
import { signIn, signUpOffice } from "../support/flows";
import { totpCode } from "../support/totp";

test.skip(!hasSupabase, "requer Supabase local (E2E_SUPABASE=1)");

test("autocadastro cria o escritório, exige MFA do admin e pede o código no próximo login", async ({
  page,
}) => {
  const admin = await signUpOffice(page);

  // Área de usuários visível para o admin, com ele próprio como membro
  await page.getByRole("link", { name: "Usuários" }).click();
  await expect(page.getByTestId(`member-${admin.email}`)).toContainText("Administrador");

  // Logout e novo login: exige o segundo fator
  await page.getByRole("button", { name: "Menu do usuário" }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);

  await signIn(page, admin.email, admin.password);
  await expect(page).toHaveURL(/\/mfa/);
  await page
    .getByLabel("Código do aplicativo autenticador")
    .fill(await totpCode(admin.totpSecret, admin.lastCode));
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("MFA ativo")).toBeVisible();
});

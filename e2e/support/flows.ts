import { expect, type Page } from "@playwright/test";

import { STRONG_PASSWORD, uniqueEmail } from "./env";
import { waitForEmailLink } from "./mailpit";
import { totpCode } from "./totp";

export type OfficeAdmin = {
  email: string;
  password: string;
  officeName: string;
  totpSecret: string;
  lastCode: string;
};

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/** Espera a navegação; se o formulário exibir um erro, falha mostrando a mensagem. */
export async function expectNavigation(page: Page, url: RegExp) {
  // Somente o Alert da aplicação (o anunciador de rotas do Next.js também usa role="alert").
  const alert = page.locator('[data-slot="alert"][role="alert"]');
  await expect
    .poll(async () => url.test(page.url()) || (await alert.count()) > 0, { timeout: 15_000 })
    .toBe(true);
  if (await alert.count())
    throw new Error(`Erro exibido na tela: ${await alert.first().innerText()}`);
  await expect(page).toHaveURL(url);
}

/** Cadastra o MFA na tela /mfa e devolve o segredo TOTP. */
export async function enrollMfa(page: Page): Promise<{ secret: string; code: string }> {
  await expectNavigation(page, /\/mfa/);
  const secret = (await page.getByTestId("totp-secret").textContent())?.trim() ?? "";
  expect(secret).not.toBe("");
  const code = await totpCode(secret);
  await page.getByLabel("Código de verificação").fill(code);
  await page.getByRole("button", { name: "Ativar autenticação em dois fatores" }).click();
  return { secret, code };
}

/** Autocadastro completo: cadastro → confirmação por e-mail → MFA → painel. */
export async function signUpOffice(page: Page): Promise<OfficeAdmin> {
  const email = uniqueEmail("admin");
  const officeName = `Escritório E2E ${Date.now()}`;

  await page.goto("/cadastro");
  await page.getByLabel("Nome do escritório").fill(officeName);
  await page.getByLabel("Seu nome completo").fill("Admin de Teste");
  await page.getByLabel("E-mail profissional").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirme a senha").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar escritório" }).click();
  await expect(page.getByRole("heading", { name: "Confirme seu e-mail" })).toBeVisible();

  const link = await waitForEmailLink(email, /http[^"\s]+\/auth\/confirm\?[^"\s<]+/);
  await page.goto(link);

  const { secret, code } = await enrollMfa(page);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByTestId("active-tenant")).toHaveText(officeName);

  return { email, password: STRONG_PASSWORD, officeName, totpSecret: secret, lastCode: code };
}

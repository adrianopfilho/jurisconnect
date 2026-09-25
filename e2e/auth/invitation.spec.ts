import { expect, test } from "@playwright/test";

import { hasSupabase, STRONG_PASSWORD, uniqueEmail } from "../support/env";
import { enrollMfa, signUpOffice } from "../support/flows";
import { waitForEmailLink } from "../support/mailpit";

test.skip(!hasSupabase, "requer Supabase local (E2E_SUPABASE=1)");

test("admin convida advogado, convite é aceito uma única vez e o acesso pode ser desativado", async ({
  page,
  browser,
}) => {
  const admin = await signUpOffice(page);
  const lawyerEmail = uniqueEmail("advogado");

  await page.goto("/app/usuarios");
  await page.getByRole("button", { name: "Convidar", exact: true }).click();
  await page.getByLabel("E-mail").fill(lawyerEmail);
  await page.getByLabel("Perfil de acesso").selectOption("lawyer");
  await page.getByRole("button", { name: "Enviar convite" }).click();
  await expect(page.getByText(`Convite enviado para ${lawyerEmail}`)).toBeVisible();

  const inviteLink = await waitForEmailLink(lawyerEmail, /http[^"\s]+\/convite\/[A-Za-z0-9_-]{43}/);

  // Convidado aceita em outro navegador
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  await guest.goto(inviteLink);
  await expect(guest.getByText(admin.officeName)).toBeVisible();
  await guest.getByLabel("Nome completo").fill("Advogado Convidado");
  await guest.getByLabel("Crie uma senha").fill(STRONG_PASSWORD);
  await guest.getByLabel("Confirme a senha").fill(STRONG_PASSWORD);
  await guest.getByRole("checkbox").check();
  await guest.getByRole("button", { name: "Aceitar convite e criar acesso" }).click();

  // Advogado também precisa de MFA
  await enrollMfa(guest);
  await expect(guest).toHaveURL(/\/app$/);
  await expect(guest.getByTestId("active-tenant")).toHaveText(admin.officeName);

  // O link não pode ser reutilizado
  const anonymous = await browser.newContext();
  const reuse = await anonymous.newPage();
  await reuse.goto(inviteLink);
  await expect(reuse.getByText("Este convite já foi utilizado.")).toBeVisible();
  await anonymous.close();

  // Advogado deixa a lista da equipe aberta (sessão ativa)
  await guest.goto("/app/usuarios");
  await expect(guest.getByTestId(`member-${admin.email}`)).toBeVisible();

  // Admin desativa o advogado: acesso cortado na próxima requisição
  await page.reload();
  const row = page.getByTestId(`member-${lawyerEmail}`);
  await expect(row).toContainText("Advogado");
  await row.getByRole("button", { name: /Ações para/ }).click();
  await page.getByRole("menuitem", { name: "Desativar acesso" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(row).toContainText("Desativado");

  // Mesma sessão, sem novo login: ao recarregar, o acesso já foi cortado
  // (sem vínculo ativo e com o login bloqueado no Auth).
  await guest.reload();
  await expect(guest).toHaveURL(/\/(sem-acesso|login)/);
  await expect(guest.getByTestId(`member-${admin.email}`)).toHaveCount(0);
  await expect(guest.getByText(admin.officeName)).toHaveCount(0);
  await guest.goto("/app/usuarios");
  await expect(guest).toHaveURL(/\/(sem-acesso|login)/);
  await guestContext.close();
});

test("recepção não acessa a gestão de usuários", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("recepcao@modelo.test");
  await page.getByLabel("Senha", { exact: true }).fill("Exemplo@Senha2026");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("link", { name: "Usuários" })).toHaveCount(0);

  await page.goto("/app/usuarios");
  await expect(page).toHaveURL(/\/app$/);
});

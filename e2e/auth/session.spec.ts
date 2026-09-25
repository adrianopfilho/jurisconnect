import { expect, test } from "@playwright/test";

import { hasSupabase, SEED_PASSWORD } from "../support/env";
import { signIn } from "../support/flows";

test.skip(!hasSupabase, "requer Supabase local (E2E_SUPABASE=1)");

test("encerra a sessão após 30 minutos de inatividade, com aviso 2 minutos antes", async ({
  page,
}) => {
  await page.clock.install();
  await signIn(page, "estagiaria@modelo.test", SEED_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);

  await page.clock.fastForward("28:01");
  await expect(page.getByRole("heading", { name: "Sua sessão vai expirar" })).toBeVisible();
  await expect(page.getByTestId("idle-countdown")).toHaveText(/1:5\d/);

  // "Continuar conectado" renova a sessão
  await page.getByRole("button", { name: "Continuar conectado" }).click();
  await expect(page.getByRole("heading", { name: "Sua sessão vai expirar" })).toBeHidden();

  await page.clock.fastForward("30:05");
  await expect(page).toHaveURL(/\/login\?motivo=inatividade/);
  await expect(page.getByText(/encerrada após 30 minutos de inatividade/)).toBeVisible();

  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
});

test("cliente vai para o portal e não acessa a área interna", async ({ page }) => {
  await signIn(page, "cliente@pessoa.test", SEED_PASSWORD);
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByRole("heading", { name: "Portal do cliente" })).toBeVisible();

  await page.goto("/app");
  await expect(page).toHaveURL(/\/portal$/);
});

test("DPO precisa cadastrar o MFA antes de acessar a área interna", async ({ page }) => {
  await signIn(page, "dpo@modelo.test", SEED_PASSWORD);
  await expect(page).toHaveURL(/\/mfa/);
  await expect(
    page.getByRole("heading", { name: "Ative a verificação em dois fatores" }),
  ).toBeVisible();

  await page.goto("/app/auditoria");
  await expect(page).toHaveURL(/\/mfa/);
});

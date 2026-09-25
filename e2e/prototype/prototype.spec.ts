import { expect, test, type Page } from "@playwright/test";

import { isPrototypeRun } from "../support/env";

test.skip(!isPrototypeRun, "requer build com NEXT_PUBLIC_PROTOTYPE=true (E2E_PROTOTYPE=1)");

/** Clica num item do menu principal (no celular, abre o menu antes). */
async function openNav(page: Page, label: string) {
  const menuButton = page.getByRole("button", { name: "Abrir menu" });
  if (await menuButton.isVisible()) await menuButton.click();
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: label })
    .last()
    .click();
}

test.describe("modo protótipo", () => {
  test.beforeEach(async ({ page }) => {
    // Nenhuma requisição pode ir para o Supabase no modo protótipo.
    page.on("request", (request) => {
      expect(request.url(), "requisição inesperada ao Supabase").not.toMatch(/supabase|:54321/);
    });
  });

  test("sistema real fica inacessível e a demonstração exige escolher um perfil", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Entrar na demonstração" })).toBeVisible();

    for (const path of ["/app", "/login", "/cadastro", "/portal"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/prototipo\/entrar$/);
    }

    await page.goto("/prototipo/clientes");
    await expect(page).toHaveURL(/\/prototipo\/entrar$/);
  });

  test("navega pelas telas do escritório com dados fictícios", async ({ page }) => {
    await page.goto("/prototipo/entrar");
    await page.getByRole("link", { name: /Entrar como escritório/ }).click();

    await expect(page).toHaveURL(/\/prototipo$/);
    await expect(page.getByText("Modo protótipo · todos os dados são fictícios")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
    await expect(page.getByText("Prazos hoje")).toBeVisible();
    await expect(page.getByText("Processos por área", { exact: true }).first()).toBeVisible();

    // Cliente: CPF mascarado por padrão, revelado sob demanda
    await openNav(page, "Clientes");
    await expect(page.getByRole("cell", { name: "***.456.789-**" })).toBeVisible();
    await page.getByRole("link", { name: "Mariana Exemplo Albuquerque" }).click();
    await expect(page.getByTestId("cpf-value")).toHaveText("CPF ***.456.789-**");
    await page.getByRole("button", { name: "Revelar" }).click();
    await expect(page.getByTestId("cpf-value")).toHaveText("CPF 123.456.789-00");
    await expect(page.getByText(/registrado na auditoria/)).toBeVisible();

    // Processo com timeline
    await page.getByRole("link", { name: /Indenização por danos morais/ }).click();
    await expect(page.getByText("0001234-56.2025.8.17.0001")).toBeVisible();
    await expect(page.getByText("Petição inicial distribuída")).toBeVisible();

    // Agenda (lista e mês) e financeiro
    await openNav(page, "Agenda");
    await expect(page.getByText("Réplica à contestação").first()).toBeVisible();
    await page.getByRole("button", { name: "Mês" }).click();
    await expect(page.getByText("Dom")).toBeVisible();

    await openNav(page, "Financeiro");
    await expect(page.getByText("Inadimplência")).toBeVisible();
    await expect(page.getByRole("cell", { name: /Padaria Pão Fictício/ }).first()).toBeVisible();
  });

  test("portal do cliente mostra andamentos em linguagem simples", async ({ page }) => {
    await page.goto("/prototipo/entrar/cliente");
    await expect(page).toHaveURL(/\/prototipo\/portal$/);
    await expect(page.getByRole("heading", { name: "Olá, Mariana" })).toBeVisible();
    await expect(page.getByText(/Seu processo foi aberto na Justiça/)).toBeVisible();
    await expect(page.getByText("***.456.789-**")).toBeVisible();

    await page.getByRole("button", { name: "Solicitar" }).first().click();
    await expect(page.getByText(/protocolo com prazo de resposta de 15 dias/)).toBeVisible();

    // Cliente não acessa a área do escritório
    await page.goto("/prototipo/clientes");
    await expect(page).toHaveURL(/\/prototipo\/portal$/);

    await page.goto("/prototipo/sair");
    await expect(page).toHaveURL(/\/prototipo\/entrar$/);
  });
});

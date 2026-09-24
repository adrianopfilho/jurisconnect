import { expect, test } from "@playwright/test";

test.describe("página inicial", () => {
  test("carrega em português com a identidade do JurisConnect", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/JurisConnect/);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.getByRole("heading", { level: 1, name: "JurisConnect" })).toBeVisible();
  });

  test("alterna entre modo claro e escuro", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    await page.getByRole("button", { name: "Alternar modo claro/escuro" }).click();
    await expect(html).toHaveClass(/dark/);
  });
});

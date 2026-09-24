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

test.describe("headers de segurança", () => {
  test("envia CSP com nonce e headers de proteção", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["content-security-policy"]).toMatch(/script-src[^;]*'nonce-[^']+'/);
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["strict-transport-security"]).toContain("max-age=63072000");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("não gera violações de CSP ao carregar a página", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Alternar modo claro/escuro" }).click();

    expect(violations).toEqual([]);
  });
});

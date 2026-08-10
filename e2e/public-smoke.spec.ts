import { expect, test } from "@playwright/test";

test("demo shell, navigation, legal pages, health, and refresh work", async ({ page, request }) => {
  const healthResponse = await request.get("/api/health");
  expect(healthResponse.ok()).toBe(true);
  await expect(healthResponse.json()).resolves.toMatchObject({
    status: "ok",
    service: "teklifio",
    environment: "development",
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Günaydın/ })).toBeVisible();
  await expect(page.getByText("Demo Ortamı", { exact: true })).toBeVisible();
  const menuButton = page.getByRole("button", { name: "Menüyü aç" });
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await expect(page.getByRole("button", { name: /Müşteriler/ })).toBeVisible();
    await page.keyboard.press("Escape");
  }
  await page.reload();
  await expect(page.getByRole("heading", { name: /Günaydın/ })).toBeVisible();
  await page.goto("/gizlilik");
  await expect(page.getByRole("heading", { name: "Gizlilik Politikası" })).toBeVisible();
  await page.goto("/kvkk");
  await expect(page.getByRole("heading", { name: /KVKK/ })).toBeVisible();
  await page.goto("/kullanim-kosullari");
  await expect(page.getByRole("heading", { name: "Kullanım Koşulları" })).toBeVisible();
});

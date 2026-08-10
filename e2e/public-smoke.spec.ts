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
  await page.goto("/yardim");
  await expect(page.getByRole("heading", { name: "İlk teklifinizi güvenle hazırlayın" })).toBeVisible();
  await expect(page.getByText("Güvenli kullanım kontrol listesi")).toBeVisible();
  await page.goto("/fiyatlandirma");
  await expect(page.getByRole("heading", { name: "Şimdilik demo ve kontrollü pilot erişim" })).toBeVisible();
  await expect(page.getByText("Ödeme sistemi aktif değil")).toBeVisible();
});

test("onboarding checklist and in-app support actions are functional", async ({ page }) => {
  await page.goto("/");

  const openNavigation = async () => {
    const menu = page.getByRole("button", { name: "Menüyü aç" });
    if (await menu.isVisible()) await menu.click();
  };

  await page.getByRole("button", { name: /Şirket bilgilerini tamamla/ }).click();
  await expect(page.getByRole("heading", { name: "Ayarlar" })).toBeVisible();

  await openNavigation();
  await page.getByRole("button", { name: /Dashboard/ }).click();
  await openNavigation();
  await page.getByRole("button", { name: "Yardım ve destek" }).click();
  const support = page.getByRole("dialog", { name: "Nasıl yardımcı olabiliriz?" });
  await expect(support).toBeVisible();
  await support.getByRole("button", { name: /Müşteri ekleyin/ }).click();
  await expect(page.getByRole("heading", { name: "Yeni müşteri" })).toBeVisible();
  await page.getByRole("button", { name: "Kapat" }).click();

  await openNavigation();
  await page.getByRole("button", { name: "Yardım ve destek" }).click();
  await support.getByRole("button", { name: "Başlangıç rehberini tekrar aç" }).click();
  await expect(page.getByRole("dialog", { name: /çalışma alanı hazır/ })).toBeVisible();
  await page.getByRole("button", { name: "Başlangıç rehberini kapat" }).click();
});

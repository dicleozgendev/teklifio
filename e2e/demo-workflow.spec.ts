import { expect, test } from "@playwright/test";

test("customer, product, manual quote, status, PDF, search, and persistence work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Müşteriler/ }).click();
  await page.getByRole("button", { name: "Müşteri ekle" }).click();
  await page.getByLabel("Şirket adı").fill("E2E Müşteri AŞ");
  await page.getByLabel("Yetkili kişi").fill("Test Kullanıcı");
  await page.getByLabel("E-posta").fill("e2e@example.com");
  await page.getByRole("button", { name: "Müşteriyi ekle" }).click();
  await expect(page.getByRole("heading", { name: "E2E Müşteri AŞ" })).toBeVisible();

  await page.getByRole("button", { name: /Ürün & Hizmetler/ }).click();
  await page.getByRole("button", { name: "Ürün veya hizmet ekle" }).click();
  await page.getByLabel("Adı").fill("E2E Danışmanlık");
  await page.getByLabel("Ürün kodu").fill("E2E-001");
  await page.getByLabel("Birim fiyat").fill("25000");
  await page.getByRole("button", { name: "Kataloğa ekle" }).click();
  await expect(page.getByRole("button", { name: "E2E Danışmanlık" })).toBeVisible();

  await page.getByRole("button", { name: /Yeni teklif/ }).first().click();
  const customerSelect = page.locator(".form-section").first().locator("select").first();
  await customerSelect.selectOption({ label: "E2E Müşteri AŞ — Test Kullanıcı" });
  await page.locator(".item-row select").first().selectOption({ label: "E2E Danışmanlık" });
  await page.getByLabel("Adet").fill("2");
  await page.getByLabel("İndirim").fill("10");
  await page.getByRole("button", { name: "Taslak kaydet" }).click();
  await expect(page.locator(".status.taslak")).toBeVisible();
  await page.getByLabel("Teklif durumu").selectOption("Onaylandı");
  await expect(page.locator(".status.onaylandi")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF İndir" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);

  await page.getByLabel("Müşteri, teklif veya ürün ara").fill("E2E Danışmanlık");
  await expect(page.getByRole("option").filter({ hasText: "E2E Danışmanlık" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Müşteriler/ }).click();
  await expect(page.getByRole("heading", { name: "E2E Müşteri AŞ" })).toBeVisible();
});

test("AI preview fills the form only after explicit approval", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Yeni teklif/ }).first().click();
  await page.getByRole("button", { name: "AI ile Oluştur" }).click();
  await page.getByLabel("Müşteri talebi").fill("Nova Teknoloji için 2 adet Kurumsal Web Sitesi, 3 aylık SEO Danışmanlığı ve %10 indirimli teklif hazırla. KDV %20.");
  await page.getByRole("button", { name: "Talebi Analiz Et" }).click();
  await expect(page.getByLabel("AI teklif önizlemesi")).toContainText("Nova Teknoloji");
  await expect(page.getByLabel("AI teklif önizlemesi")).toContainText("Kurumsal Web Sitesi");
  await page.getByRole("button", { name: "Teklife Uygula" }).click();
  await expect(page.locator(".form-section").first().locator("select").first()).toHaveValue("1");
  await expect(page.getByLabel("Adet").first()).toHaveValue("2");
  await expect(page.getByLabel("İndirim").first()).toHaveValue("10");
  await expect(page.getByLabel("KDV").first()).toHaveValue("20");
});

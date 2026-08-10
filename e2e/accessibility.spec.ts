import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicRoutes = [
  { path: "/", name: "dashboard" },
  { path: "/yardim", name: "help center" },
  { path: "/fiyatlandirma", name: "pricing" },
  { path: "/gizlilik", name: "privacy" },
  { path: "/kvkk", name: "KVKK" },
  { path: "/kullanim-kosullari", name: "terms" },
];

for (const route of publicRoutes) {
  test(`${route.name} has no automated WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const violations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target.join(" ")),
    }));

    expect(violations).toEqual([]);
  });
}

import { expect, test } from "@playwright/test";

// Runs in both the chromium (desktop) and mobile-chrome (Pixel 7) projects, so it guards the header
// layout across resolutions: no horizontal overflow, and the logo + prominent phone stay visible.
test("header is responsive: no horizontal overflow, logo and phone visible", async ({ page }) => {
  await page.route("**/googletagmanager.com/**", (route) => route.abort());
  await page.goto("/en");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(2);

  await expect(page.locator(".brand-logo")).toBeVisible();
  await expect(page.getByRole("link", { name: "(470) 781-4143" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Request an appointment" }).first()).toBeVisible();
});

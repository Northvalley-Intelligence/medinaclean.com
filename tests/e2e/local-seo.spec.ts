import { expect, test } from "@playwright/test";

test("local deep cleaning page is crawlable and points customers to scheduling", async ({ page }) => {
  await page.goto("/en/deep-cleaning-woodstock-ga");

  await expect(page).toHaveTitle(/Deep Cleaning near Woodstock, GA/);
  await expect(page.getByRole("heading", { name: "Deep cleaning near Woodstock, GA", level: 1 })).toBeVisible();
  await expect(page.locator(".local-hero-meta").getByText("Woodstock, Marietta, Kennesaw")).toBeVisible();
  await expect(page.getByLabel("Language").getByRole("link", { name: "Request an appointment" })).toHaveAttribute(
    "href",
    "/en#schedule"
  );
});

test("Spanish local cleaning page keeps bilingual local search coverage", async ({ page }) => {
  await page.goto("/es/limpieza-profunda-woodstock-ga");

  await expect(page).toHaveTitle(/Limpieza profunda cerca de Woodstock, GA/);
  await expect(page.getByRole("heading", { name: "Limpieza profunda cerca de Woodstock, GA", level: 1 })).toBeVisible();
  await expect(page.locator(".local-hero-meta").getByText("Woodstock, Marietta, Kennesaw")).toBeVisible();
  await expect(page.getByLabel("Language").getByRole("link", { name: "Pedir una cita" })).toHaveAttribute(
    "href",
    "/es#schedule"
  );
});

test("legacy indexed pages use permanent redirects instead of 404s", async ({ page }) => {
  const response = await page.request.get("/our-services", { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/en#services");
});

test("Marietta has a dedicated service-area page because Rosa serves Marietta ZIPs", async ({ page }) => {
  await page.goto("/en/cleaning-services-marietta-ga");

  await expect(page).toHaveTitle(/Cleaning Services in Marietta, GA/);
  await expect(page.getByRole("heading", { name: "Cleaning services in Marietta, GA", level: 1 })).toBeVisible();
  await expect(page.getByText("30066, 30062, 30068, 30064, and 30067")).toBeVisible();
  await expect(page.getByText("Does Rosa clean in Marietta?")).toBeVisible();
});

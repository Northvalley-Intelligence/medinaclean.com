import { expect, test } from "@playwright/test";

test("what's included checklist page lists tiers, expectations, and add-ons with no prices", async ({ page }) => {
  await page.goto("/en/whats-included");

  await expect(page).toHaveTitle(/What's Included in a Medina Clean Cleaning/);
  await expect(page.getByRole("heading", { name: "What's included in each Medina Clean cleaning", level: 1 })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Standard clean", level: 3 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Detailed / deep clean", level: 3 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Move-in / move-out clean", level: 3 })).toBeVisible();
  await expect(page.getByText("Clean the outside of the oven and refrigerator")).toBeVisible();
  await expect(page.getByText("Clear grease build-up")).toBeVisible();
  await expect(page.getByText("Clean inside the refrigerator")).toBeVisible();

  await expect(page.getByRole("heading", { name: "What we do and what we don't", level: 2 })).toBeVisible();
  await expect(page.getByText("Move heavy furniture")).toBeVisible();

  await expect(page.getByRole("heading", { name: "Add-ons", level: 2 })).toBeVisible();
  await expect(page.getByText("Interior oven cleaning")).toBeVisible();

  await expect(page.getByRole("link", { name: "Request an appointment" }).first()).toHaveAttribute("href", "/en#schedule");

  const bodyText = await page.locator("main").innerText();
  expect(bodyText).not.toContain("$");

  await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
    "href",
    "https://medinaclean.com/es/que-incluye"
  );
});

test("Spanish checklist page keeps bilingual coverage with no prices", async ({ page }) => {
  await page.goto("/es/que-incluye");

  await expect(page).toHaveTitle(/Qué Incluye una Limpieza de Medina Clean/);
  await expect(page.getByRole("heading", { name: "Qué incluye cada limpieza de Medina Clean", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Limpieza estándar", level: 3 })).toBeVisible();
  await expect(page.getByText("Limpieza de mudanza (entrada o salida)")).toBeVisible();
  await expect(page.getByText("Mover muebles pesados")).toBeVisible();
  await expect(page.getByText("Cambio de sábanas (por cama)")).toBeVisible();

  const bodyText = await page.locator("main").innerText();
  expect(bodyText).not.toContain("$");
});

test("homepage services section links to the full checklist page in both languages", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("link", { name: "See the full cleaning checklist" })).toHaveAttribute(
    "href",
    "/en/whats-included"
  );

  await page.goto("/es");
  await expect(page.getByRole("link", { name: "Ver la lista completa de limpieza" })).toHaveAttribute(
    "href",
    "/es/que-incluye"
  );
});

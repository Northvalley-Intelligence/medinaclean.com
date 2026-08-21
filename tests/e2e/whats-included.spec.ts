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

// Regression for the sitewide doubled-title bug: the root layout's title template ("%s | Medina
// Clean") appends the brand suffix, so every page's own metadata title must be bare — a page that
// still includes "| Medina Clean" itself renders "X | Medina Clean | Medina Clean". Covers the
// pages that had the doubled suffix (/en, /es, reviews, about-rosa, and one representative
// local-service [slug] page) plus the two checklist pages this suite already covers above.
//
// Note: some titles (e.g. the Spanish checklist page, "Qué Incluye una Limpieza de Medina Clean")
// legitimately end with the brand name as prose before the template's suffix is even added, so a
// plain `.not.toContain("Medina Clean | Medina Clean")` false-positives on those. The real bug
// signature is the " | Medina Clean" separator pattern appearing more than once — once for the
// template's suffix, and again only if the page's own title wrongly included the suffix itself.
test("no page title doubles the Medina Clean suffix", async ({ page }) => {
  const paths = [
    "/en",
    "/es",
    "/en/reviews",
    "/es/reviews",
    "/en/about-rosa-medina",
    "/es/sobre-rosa-medina",
    "/en/deep-cleaning-woodstock-ga",
    "/es/limpieza-profunda-woodstock-ga",
    "/en/whats-included",
    "/es/que-incluye"
  ];

  for (const path of paths) {
    await page.goto(path);
    const title = await page.title();
    const suffixOccurrences = title.split(" | Medina Clean").length - 1;
    expect(suffixOccurrences, `${path} title: "${title}"`).toBe(1);
    expect(title, `${path} title: "${title}"`).toMatch(/ \| Medina Clean$/);
  }

  // Root "/" shares its route segment with layout.tsx, so the template does NOT apply there (a
  // Next.js metadata rule, not a bug) — the page must keep its own single "Medina Clean" prefix.
  await page.goto("/");
  const rootTitle = await page.title();
  expect(rootTitle).toBe("Medina Clean | Cleaning Services near Woodstock and Marietta, GA");
  expect(rootTitle.split("Medina Clean").length - 1, `/ title: "${rootTitle}"`).toBe(1);
});

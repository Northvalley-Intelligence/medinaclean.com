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

test("local service pages expose matching language alternates and structured data", async ({ page }) => {
  await page.goto("/en/house-cleaning-woodstock-ga");

  await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
    "href",
    "https://medinaclean.com/es/limpieza-de-casas-woodstock-ga"
  );
  await expect(page.getByRole("link", { name: "ES", exact: true })).toHaveAttribute(
    "href",
    "/es/limpieza-de-casas-woodstock-ga"
  );

  const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
  const localServiceSchema = structuredData.map((value) => JSON.parse(value)).find((item) => item["@type"] === "CleaningService");

  expect(localServiceSchema).toMatchObject({
    name: "House cleaning - Medina Clean",
    hasMap: /google\.com\/maps\/search/,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+14707814143",
      contactType: "customer service",
      availableLanguage: ["English", "Spanish"]
    },
    serviceType: ["House cleaning", "Recurring cleaning", "First-time cleaning", "Deep cleaning"],
    areaServed: ["Woodstock", "30188", "Towne Lake area", "nearby Cherokee County homes"]
  });

  await expect(page.getByRole("link", { name: "Call Medina Clean" })).toHaveAttribute("href", "tel:+14707814143");
  await expect(page.getByRole("link", { name: "Search Medina Clean on Google Maps" })).toHaveAttribute(
    "href",
    /google\.com\/maps\/search/
  );
});

test("homepage exposes crawlable trust, booking, and sharing signals from the assessment", async ({ page }) => {
  await page.goto("/en");

  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Request an appointment" })).toHaveAttribute(
    "href",
    "#schedule"
  );
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "About Rosa" })).toHaveAttribute(
    "href",
    "/en/about-rosa-medina"
  );
  await expect(page.getByRole("link", { name: "Search Medina Clean on Google Maps" })).toHaveAttribute(
    "href",
    /google\.com\/maps\/search/
  );
  await expect(page.getByText("owner-led cleaning with direct communication from Rosa Medina")).toBeVisible();
  await expect(page.getByText("real Medina Clean project videos")).toBeVisible();
  await expect(page.getByText("credentials, insurance, certifications, and awards")).toBeVisible();

  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://medinaclean.com/gallery/hero-clean-home.png"
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", "/favicon.ico");
});

test("homepage links real service-area demand pages with crawlable demand phrases", async ({ page }) => {
  await page.goto("/en");

  await expect(page.getByRole("heading", { name: "Cleaning service areas near Woodstock", level: 2 })).toBeVisible();
  await expect(
    page.getByText(
      "house cleaning, apartment cleaning, deep cleaning, recurring cleaning, and small business cleaning coverage"
    )
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Cleaning Services in Marietta, GA" })).toHaveAttribute(
    "href",
    "/en/cleaning-services-marietta-ga"
  );
  await expect(page.getByRole("link", { name: "Cleaning Services in Kennesaw, GA" })).toHaveAttribute(
    "href",
    "/en/cleaning-services-kennesaw-ga"
  );
  await expect(page.getByRole("link", { name: "Cleaning Services in Acworth, GA" })).toHaveAttribute(
    "href",
    "/en/cleaning-services-acworth-ga"
  );
  await expect(page.getByRole("link", { name: "Cleaning Services in Canton, GA" })).toHaveAttribute(
    "href",
    "/en/cleaning-services-canton-ga"
  );
  await expect(page.getByRole("link", { name: "Cleaning Services near Roswell, GA" })).toHaveAttribute(
    "href",
    "/en/cleaning-services-roswell-ga"
  );
});

test("Spanish homepage links service-area demand pages with Spanish crawlable copy", async ({ page }) => {
  await page.goto("/es");

  await expect(page.getByRole("heading", { name: "Áreas de limpieza cerca de Woodstock", level: 2 })).toBeVisible();
  await expect(
    page.getByText("limpieza de casas, apartamentos, limpieza profunda, limpieza recurrente y pequeños negocios")
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Servicios de limpieza en Marietta, GA" })).toHaveAttribute(
    "href",
    "/es/servicios-de-limpieza-marietta-ga"
  );
  await expect(page.getByRole("link", { name: "Servicios de limpieza en Kennesaw, GA" })).toHaveAttribute(
    "href",
    "/es/servicios-de-limpieza-kennesaw-ga"
  );
  await expect(page.getByRole("link", { name: "Servicios de limpieza en Acworth, GA" })).toHaveAttribute(
    "href",
    "/es/servicios-de-limpieza-acworth-ga"
  );
  await expect(page.getByRole("link", { name: "Servicios de limpieza en Canton, GA" })).toHaveAttribute(
    "href",
    "/es/servicios-de-limpieza-canton-ga"
  );
  await expect(page.getByRole("link", { name: "Servicios de limpieza cerca de Roswell, GA" })).toHaveAttribute(
    "href",
    "/es/servicios-de-limpieza-roswell-ga"
  );
});

test("about pages give visitors and answer engines owner and proof context", async ({ page }) => {
  await page.goto("/en/about-rosa-medina");

  await expect(page).toHaveTitle(/About Rosa Medina/);
  await expect(page.getByRole("heading", { name: "About Rosa Medina and Medina Clean", level: 1 })).toBeVisible();
  await expect(page.getByText("local cleaning business led by Rosa Medina")).toBeVisible();
  await expect(page.getByText("current public website and booking workflow launched in 2026")).toBeVisible();
  await expect(page.getByText("No license, insurance, certification, or award claim is published")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "About navigation" }).getByRole("link", { name: "Request an appointment" })).toHaveAttribute(
    "href",
    "/en#schedule"
  );
  await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
    "href",
    "https://medinaclean.com/es/sobre-rosa-medina"
  );
});

test("llms.txt gives AI answer engines accurate public Medina Clean facts", async ({ page }) => {
  const response = await page.request.get("/llms.txt");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("text/plain");

  const body = await response.text();
  expect(body).toContain("# Medina Clean");
  expect(body).toContain("Woodstock, GA");
  expect(body).toContain("Rosa confirms the final price");
  expect(body).toContain("Do not claim licenses, insurance, certifications, awards, or years in business");
});

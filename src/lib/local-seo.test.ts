import { describe, expect, it } from "vitest";
import {
  buildLocalServiceJsonLd,
  getLocalServiceAlternate,
  getLocalServicePage,
  localServicePages
} from "./local-seo";
import { getSeoRedirect } from "./seo-redirects";

describe("local SEO routes", () => {
  it("defines bilingual service pages for local cleaning searches", () => {
    expect(getLocalServicePage("en", "deep-cleaning-woodstock-ga")?.h1).toBe("Deep cleaning near Woodstock, GA");
    expect(getLocalServicePage("es", "limpieza-profunda-woodstock-ga")?.h1).toBe(
      "Limpieza profunda cerca de Woodstock, GA"
    );
    expect(localServicePages.map((page) => `${page.locale}/${page.slug}`)).toContain(
      "en/house-cleaning-woodstock-ga"
    );
  });

  it("permanently redirects legacy indexed pages to live canonical URLs", () => {
    expect(getSeoRedirect("https://www.medinaclean.com/our-services")).toEqual({
      status: 308,
      url: "https://medinaclean.com/en#services"
    });
    expect(getSeoRedirect("https://medinaclean.com/pricing-for-residential")).toEqual({
      status: 308,
      url: "https://medinaclean.com/en#pricing"
    });
    expect(getSeoRedirect("https://medinaclean.com/contactus?from=old")).toEqual({
      status: 308,
      url: "https://medinaclean.com/en?from=old#schedule"
    });
  });

  it("canonicalizes the root and www host without changing already-canonical service pages", () => {
    expect(getSeoRedirect("https://medinaclean.com/")).toEqual({
      status: 308,
      url: "https://medinaclean.com/en"
    });
    expect(getSeoRedirect("https://www.medinaclean.com/en/deep-cleaning-woodstock-ga")).toEqual({
      status: 308,
      url: "https://medinaclean.com/en/deep-cleaning-woodstock-ga"
    });
    expect(getSeoRedirect("https://medinaclean.com/en/deep-cleaning-woodstock-ga")).toBeNull();
  });

  it("pairs local service pages with matching bilingual alternates", () => {
    const houseCleaning = getLocalServicePage("en", "house-cleaning-woodstock-ga");
    const marietta = getLocalServicePage("en", "cleaning-services-marietta-ga");

    expect(houseCleaning && getLocalServiceAlternate(houseCleaning)?.slug).toBe("limpieza-de-casas-woodstock-ga");
    expect(marietta && getLocalServiceAlternate(marietta)?.slug).toBe("servicios-de-limpieza-marietta-ga");
  });

  it("builds page-specific CleaningService schema for local pages", () => {
    const houseCleaning = getLocalServicePage("en", "house-cleaning-woodstock-ga");

    expect(houseCleaning && buildLocalServiceJsonLd(houseCleaning, "+17775550123")).toMatchObject({
      "@type": "CleaningService",
      name: "House cleaning - Medina Clean",
      telephone: "+17775550123",
      serviceType: ["House cleaning", "Recurring cleaning", "First-time cleaning", "Deep cleaning"],
      areaServed: ["Woodstock", "30188", "Towne Lake area", "nearby Cherokee County homes"]
    });
  });
});

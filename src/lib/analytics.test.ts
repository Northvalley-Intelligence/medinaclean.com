import { describe, expect, it } from "vitest";
import {
  buildGoogleAnalyticsConfigSnippet,
  buildGoogleTagManagerSnippet,
  getGoogleAnalyticsMeasurementId,
  googleTagManagerId
} from "./analytics";

describe("analytics", () => {
  it("keeps the Medina Clean GTM container id stable", () => {
    expect(googleTagManagerId).toBe("GTM-M3DMSPQW");
    expect(buildGoogleTagManagerSnippet()).toContain("GTM-M3DMSPQW");
  });

  it("accepts only GA4 measurement ids for the direct GA fallback", () => {
    expect(getGoogleAnalyticsMeasurementId({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC123XYZ9" })).toBe("G-ABC123XYZ9");
    expect(getGoogleAnalyticsMeasurementId({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "UA-123" })).toBe("");
    expect(getGoogleAnalyticsMeasurementId({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "GTM-M3DMSPQW" })).toBe("");
  });

  it("builds a direct GA4 page view config when a measurement id is configured", () => {
    expect(buildGoogleAnalyticsConfigSnippet("G-ABC123XYZ9")).toContain("gtag('config', 'G-ABC123XYZ9')");
  });
});

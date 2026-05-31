import { describe, expect, it } from "vitest";
import { calculateCleaningEstimate } from "./chat-agent";
import { buildEstimatePdfLines, createEstimatePdf } from "./estimate-pdf";

describe("estimate PDF", () => {
  it("builds estimate lines with customer details and prices", async () => {
    const lines = buildEstimatePdfLines({
      estimate: calculateCleaningEstimate({ bedrooms: 3, bathrooms: 2, frequency: "every_2_weeks" }),
      adjustedRecurringEstimateUsd: 140,
      locale: "en",
      name: "Taylor Client",
      phone: "(470) 555-0111",
      address: "100 Main Street",
      zipCode: "30188",
      bedrooms: "3",
      bathrooms: "2",
      frequency: "every_2_weeks",
      preferredTimes: ["2026-06-02T09:00", "2026-06-03T10:00"],
      notes: "Has two dogs."
    });

    expect(lines).toContain("Medina Clean");
    expect(lines).toContain("Name: Taylor Client");
    expect(lines).toContain("First cleaning rough estimate: $280");
    expect(lines).toContain("Recurring rough estimate: $140");
    expect(lines).toContain("Notes: Has two dogs.");
  });

  it("creates a real PDF blob", async () => {
    const blob = createEstimatePdf(["Medina Clean", "Cleaning estimate"]);
    const header = await blob.slice(0, 8).text();
    const text = await blob.text();

    expect(blob.type).toBe("application/pdf");
    expect(header).toBe("%PDF-1.4");
    expect(text).toContain("/Helvetica-Bold");
    expect(text).toContain("Estimate summary");
    expect(text).toContain("Generated in your browser. This PDF is not stored on the server.");
  });
});

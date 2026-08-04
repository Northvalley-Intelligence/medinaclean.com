import { describe, expect, it } from "vitest";
import { getMcpEstimate } from "./mcp-estimate";

// GEN-001 TASK-005 — deterministic pricing oracle for the agent-native get_estimate tool.
// These fixed input -> output rows are the oracle referenced by VALSTRAT-001 gen001_addendum.
// The adapter must reuse the existing chat-agent engine, never re-derive prices independently.

describe("getMcpEstimate — recurring (BDD-008)", () => {
  it("biweekly 3bd/2ba starts at $150 (30 x 5 rooms)", () => {
    const result = getMcpEstimate({ bedrooms: 3, bathrooms: 2, frequency: "biweekly" });
    expect(result).toMatchObject({
      estimate: 150,
      currency: "USD",
      autoQuote: true,
      breakdown: { rooms: 5, ratePerRoomUsd: 30, addOnEstimateUsd: 0 }
    });
  });

  it("triweekly 3bd/2ba starts at $200 (40 x 5 rooms)", () => {
    const result = getMcpEstimate({ bedrooms: 3, bathrooms: 2, frequency: "triweekly" });
    expect(result).toMatchObject({
      estimate: 200,
      currency: "USD",
      autoQuote: true,
      breakdown: { rooms: 5, ratePerRoomUsd: 40 }
    });
  });
});

describe("getMcpEstimate — first-time & add-ons (BDD-009)", () => {
  it("first-time 3bd/2ba is double the triweekly base = $400 and flags the assumption", () => {
    const result = getMcpEstimate({ bedrooms: 3, bathrooms: 2, frequency: "first_time_onetime" });
    expect(result.estimate).toBe(400);
    expect(result.autoQuote).toBe(true);
    expect(result.disclaimers).toContain("first_time_is_double_recurring_assumption");
  });

  it("adds oven_fridge at +$50 standard and +$80 heavy", () => {
    const standard = getMcpEstimate({
      bedrooms: 3,
      bathrooms: 2,
      frequency: "first_time_onetime",
      addons: ["oven_fridge"]
    });
    expect(standard.estimate).toBe(450);
    expect(standard.breakdown.addOnEstimateUsd).toBe(50);

    const heavy = getMcpEstimate({
      bedrooms: 3,
      bathrooms: 2,
      frequency: "first_time_onetime",
      addons: ["oven_fridge"],
      condition: "heavy"
    });
    expect(heavy.estimate).toBe(480);
    expect(heavy.breakdown.addOnEstimateUsd).toBe(80);
  });

  it("attaches the standard materials/conditions disclaimer to every priced estimate", () => {
    for (const frequency of ["biweekly", "triweekly", "first_time_onetime"] as const) {
      const result = getMcpEstimate({ bedrooms: 2, bathrooms: 1, frequency });
      expect(result.disclaimers).toContain("standard_materials_and_conditions");
      expect(result.disclaimers).toContain("rosa_confirms_final_price");
    }
  });
});

describe("getMcpEstimate — no auto-quote path (BDD-010)", () => {
  it("small_business returns a null estimate and defers to an onsite estimate", () => {
    const result = getMcpEstimate({ bedrooms: 4, bathrooms: 3, frequency: "small_business" });
    expect(result.estimate).toBeNull();
    expect(result.autoQuote).toBe(false);
    expect(result.disclaimers).toContain("onsite_estimate_required");
  });

  it("never emits a number for small_business even with add-ons", () => {
    const result = getMcpEstimate({
      bedrooms: 4,
      bathrooms: 3,
      frequency: "small_business",
      addons: ["oven_fridge"],
      condition: "heavy"
    });
    expect(result.estimate).toBeNull();
    expect(result.autoQuote).toBe(false);
  });
});

describe("getMcpEstimate — input bounds", () => {
  it("bounds bedrooms to the published 1-5 range before pricing", () => {
    const low = getMcpEstimate({ bedrooms: 0, bathrooms: 1, frequency: "triweekly" });
    const high = getMcpEstimate({ bedrooms: 9, bathrooms: 1, frequency: "triweekly" });
    expect(low.breakdown.rooms).toBe(2); // 1 bedroom (floored to 1) + 1 bathroom
    expect(high.breakdown.rooms).toBe(6); // 5 bedrooms (capped at 5) + 1 bathroom
  });
});

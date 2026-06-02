import { describe, expect, it } from "vitest";
import { buildAdChatLandingUrl, buildAdPlan, defaultAdZipCodes } from "./ad-campaigns";

describe("ad campaigns", () => {
  it("builds a tracked chat landing URL for Meta ads", () => {
    const url = buildAdChatLandingUrl({
      baseUrl: "https://medinaclean.com",
      locale: "es",
      campaignName: "Woodstock recurring cleaning",
      zipCodes: ["30188", "30189"],
      platforms: ["instagram", "facebook"]
    });

    expect(url).toBe(
      "https://medinaclean.com/es?utm_source=meta&utm_medium=paid_social&utm_campaign=woodstock-recurring-cleaning&utm_content=instagram-facebook&zip=30188#chat"
    );
  });

  it("normalizes zip codes, budget, and platform choices for a small local ad plan", () => {
    expect(
      buildAdPlan({
        campaignName: "Rosa deep cleaning",
        dailyBudgetUsd: "25.50",
        zipCodes: "30188, 30189\nbad 30066",
        platforms: ["instagram", "facebook"]
      })
    ).toEqual({
      ok: true,
      plan: {
        campaignName: "Rosa deep cleaning",
        dailyBudgetUsd: 25.5,
        zipCodes: ["30188", "30189", "30066"],
        platforms: ["instagram", "facebook"]
      }
    });
  });

  it("keeps the planner inside Rosa's current service ZIP defaults", () => {
    expect(defaultAdZipCodes).toContain("30188");
    expect(defaultAdZipCodes).toContain("30189");
    expect(defaultAdZipCodes.length).toBeLessThanOrEqual(8);
  });

  it("rejects unusable ad plans before anyone spends money", () => {
    expect(
      buildAdPlan({
        campaignName: "",
        dailyBudgetUsd: "2",
        zipCodes: "abc",
        platforms: []
      })
    ).toEqual({
      ok: false,
      errors: [
        "Campaign name is required.",
        "Daily budget must be between $5 and $250.",
        "Add at least one 5-digit ZIP code.",
        "Choose Instagram, Facebook, or both."
      ]
    });
  });
});

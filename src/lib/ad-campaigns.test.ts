import { describe, expect, it } from "vitest";
import {
  buildAdChatLandingUrl,
  buildAdPlan,
  buildMetaAdDraft,
  defaultAdZipCodes,
  getMetaAdsConfig
} from "./ad-campaigns";

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

  it("builds a draft Meta campaign payload that sends clicks to the chat link", () => {
    const result = buildAdPlan({
      campaignName: "Woodstock deep cleaning",
      dailyBudgetUsd: "20",
      zipCodes: "30188\n30189",
      platforms: ["instagram", "facebook"]
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const draft = buildMetaAdDraft({
      plan: result.plan,
      locale: "es",
      baseUrl: "https://medinaclean.com"
    });

    expect(draft.landingUrl).toContain("zip=30188#chat");
    expect(draft.campaign).toMatchObject({
      name: "Woodstock deep cleaning",
      objective: "OUTCOME_TRAFFIC",
      status: "PAUSED",
      special_ad_categories: []
    });
    expect(draft.adSet).toMatchObject({
      daily_budget: 2000,
      billing_event: "IMPRESSIONS",
      optimization_goal: "LINK_CLICKS",
      status: "PAUSED"
    });
    expect(draft.adSet).not.toHaveProperty("promoted_object");
    expect(draft.adSet.targeting.geo_locations.zips).toEqual([
      { key: "US:30188" },
      { key: "US:30189" }
    ]);
    expect(draft.creative.object_story_spec.link_data).toMatchObject({
      link: draft.landingUrl,
      call_to_action: {
        type: "GET_QUOTE",
        value: {
          link: draft.landingUrl
        }
      }
    });
    expect(draft.ad).toMatchObject({
      status: "PAUSED"
    });
  });

  it("requires explicit live Meta configuration before backend publishing can spend money", () => {
    expect(getMetaAdsConfig({})).toEqual({
      ok: false,
      missing: ["META_ADS_LIVE_ENABLED", "META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID", "META_PAGE_ID"]
    });

    expect(
      getMetaAdsConfig({
        META_ADS_LIVE_ENABLED: "true",
        META_ACCESS_TOKEN: "token",
        META_AD_ACCOUNT_ID: "act_123",
        META_PAGE_ID: "page-123"
      })
    ).toEqual({
      ok: true,
      config: {
        accessToken: "token",
        adAccountId: "act_123",
        pageId: "page-123",
        instagramActorId: undefined,
        apiVersion: "v24.0"
      }
    });
  });
});

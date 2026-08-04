import { describe, expect, it } from "vitest";
import { checkServiceArea, getPricingRules, listServices } from "./mcp-readonly-tools";

describe("checkServiceArea", () => {
  it("marks the home ZIP 30188 eligible with a bilingual message", () => {
    const en = checkServiceArea({ zip: "30188" });
    expect(en.eligible).toBe(true);
    expect(en.zip).toBe("30188");
    expect(en.message).toMatch(/service area/i);

    const es = checkServiceArea({ zip: "30188", language: "es" });
    expect(es.eligible).toBe(true);
    expect(es.message).toMatch(/área de servicio/i);
  });

  it("extracts a ZIP from free text before validating", () => {
    const result = checkServiceArea({ zip: "my place is 30189" });
    expect(result.zip).toBe("30189");
    expect(result.eligible).toBe(true);
  });

  it("returns not-eligible for a ZIP outside the free validation list", () => {
    const result = checkServiceArea({ zip: "99999", language: "es" });
    expect(result.eligible).toBe(false);
    expect(result.message).toMatch(/Rosa/);
  });

  it("asks for a ZIP when none is provided", () => {
    const result = checkServiceArea({ zip: "no zip here" });
    expect(result.eligible).toBe(false);
    expect(result.zip).toBe("");
    expect(result.message).toMatch(/ZIP/i);
  });
});

describe("listServices", () => {
  it("returns the five published service types in English", () => {
    const services = listServices("en");
    expect(services).toHaveLength(5);
    expect(services.map((s) => s.code)).toEqual([
      "houses",
      "apartments",
      "condos",
      "small_business",
      "post_construction"
    ]);
    expect(services[0]).toMatchObject({ code: "houses", label: "Houses" });
  });

  it("localizes labels to Spanish", () => {
    const services = listServices("es");
    expect(services).toHaveLength(5);
    expect(services[0]).toMatchObject({ code: "houses", label: "Casas" });
  });
});

describe("getPricingRules", () => {
  it("returns the published pricing rows plus disclaimer codes", () => {
    const result = getPricingRules();
    expect(result.rules.length).toBeGreaterThanOrEqual(5);
    expect(result.rules[0].item).toBe("Every 2 weeks");
    expect(result.disclaimers).toContain("standard_materials_and_conditions");
    expect(result.disclaimers).toContain("rosa_confirms_final_price");
  });
});

import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("allows all crawlers and explicitly welcomes AI answer/search agents", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    expect(rules.some((r) => r.userAgent === "*" && r.allow === "/")).toBe(true);

    const aiRule = rules.find((r) => Array.isArray(r.userAgent));
    expect(aiRule?.userAgent).toContain("OAI-SearchBot");
    expect(aiRule?.userAgent).toContain("Google-Extended");
    expect(aiRule?.allow).toBe("/");
    expect(result.sitemap).toBe("https://medinaclean.com/sitemap.xml");
  });
});

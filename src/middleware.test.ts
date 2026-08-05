import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

describe("SEO middleware redirects", () => {
  it("redirects legacy indexed URLs before route rendering", () => {
    const response = middleware(new NextRequest("https://medinaclean.com/our-services"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://medinaclean.com/en#services");
  });

  it("canonicalizes www requests to the apex domain", () => {
    const response = middleware(new NextRequest("https://www.medinaclean.com/en/deep-cleaning-woodstock-ga"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://medinaclean.com/en/deep-cleaning-woodstock-ga");
  });

  it("serves the OpenAI Apps domain-verification challenge token as plain text", async () => {
    const response = middleware(new NextRequest("https://medinaclean.com/.well-known/openai-apps-challenge"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toBe("rELKH6yMIsvWfgD3kK4AJL9mMOGRWTfMRtZh0tLtaSg");
  });
});

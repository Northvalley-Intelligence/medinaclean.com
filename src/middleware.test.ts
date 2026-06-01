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
});

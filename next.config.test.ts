import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next redirects", () => {
  it("canonicalizes the www root without emitting a literal wildcard destination", async () => {
    expect(typeof nextConfig.redirects).toBe("function");
    if (typeof nextConfig.redirects !== "function") {
      return;
    }

    const redirects = await nextConfig.redirects();

    expect(redirects[0]).toEqual({
      source: "/",
      has: [{ type: "host", value: "www.medinaclean.com" }],
      destination: "https://medinaclean.com/en",
      permanent: true
    });
    expect(redirects[0].destination).not.toContain(":path*");
  });

  it("canonicalizes non-root www paths before locale and legacy-path redirects", async () => {
    expect(typeof nextConfig.redirects).toBe("function");
    if (typeof nextConfig.redirects !== "function") {
      return;
    }

    const redirects = await nextConfig.redirects();

    expect(redirects[1]).toEqual({
      source: "/:path*",
      has: [{ type: "host", value: "www.medinaclean.com" }],
      destination: "https://medinaclean.com/:path*",
      permanent: true
    });
    expect(redirects.findIndex((redirect) => redirect.source === "/" && !("has" in redirect))).toBeGreaterThan(1);
    expect(redirects.findIndex((redirect) => redirect.source === "/contactus")).toBeGreaterThan(0);
  });
});

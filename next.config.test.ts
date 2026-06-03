import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next redirects", () => {
  it("canonicalizes www before locale and legacy-path redirects", async () => {
    expect(typeof nextConfig.redirects).toBe("function");
    if (typeof nextConfig.redirects !== "function") {
      return;
    }

    const redirects = await nextConfig.redirects();

    expect(redirects[0]).toEqual({
      source: "/:path*",
      has: [{ type: "host", value: "www.medinaclean.com" }],
      destination: "https://medinaclean.com/:path*",
      permanent: true
    });
    expect(redirects.findIndex((redirect) => redirect.source === "/")).toBeGreaterThan(0);
    expect(redirects.findIndex((redirect) => redirect.source === "/contactus")).toBeGreaterThan(0);
  });
});

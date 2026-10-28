import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import config, { loadSharedOpenRouterEnv } from "./next.config";

const nextConfig = config(PHASE_PRODUCTION_BUILD);

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
    // The bare-root "/" no longer redirects — it serves the homepage directly (OAuth static-URL rule).
    expect(redirects.findIndex((redirect) => redirect.source === "/" && !("has" in redirect))).toBe(-1);
    expect(redirects.findIndex((redirect) => redirect.source === "/contactus")).toBeGreaterThan(0);
  });
});

describe("shared OpenRouter env fallback", () => {
  const file = join(mkdtempSync(join(tmpdir(), "mc-shared-")), "openrouter.env");
  writeFileSync(file, "OPENROUTER_API_KEY=placeholder\n");
  const run = (phase: string, env: Record<string, string | undefined>) => {
    loadSharedOpenRouterEnv(phase, file, env, () => {
      env.OPENROUTER_API_KEY = "loaded";
    });
    return Boolean(env.OPENROUTER_API_KEY);
  };

  it("loads the shared file in the dev server when the key is unset", () => {
    expect(run(PHASE_DEVELOPMENT_SERVER, {})).toBe(true);
  });

  it("never loads outside the dev server phase", () => {
    expect(run(PHASE_PRODUCTION_BUILD, {})).toBe(false);
  });

  it("does not override a repo-local key", () => {
    const env: Record<string, string | undefined> = { OPENROUTER_API_KEY: "local" };
    loadSharedOpenRouterEnv(PHASE_DEVELOPMENT_SERVER, file, env, () => {
      env.OPENROUTER_API_KEY = "loaded";
    });
    expect(env.OPENROUTER_API_KEY).toBe("local");
  });

  it("is a no-op when the shared file is missing", () => {
    const env: Record<string, string | undefined> = {};
    loadSharedOpenRouterEnv(PHASE_DEVELOPMENT_SERVER, `${file}.missing`, env, () => {
      env.OPENROUTER_API_KEY = "loaded";
    });
    expect(env.OPENROUTER_API_KEY).toBeUndefined();
  });
});

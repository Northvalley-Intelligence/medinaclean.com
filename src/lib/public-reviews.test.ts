import { afterEach, describe, expect, it, vi } from "vitest";

describe("public reviews", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("falls back to no approved reviews when local Supabase is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connect ECONNREFUSED 127.0.0.1:54321");
      })
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { getApprovedReviews } = await import("./supabase-rest");

    await expect(getApprovedReviews("en")).resolves.toEqual([]);
  });

  it("summarizes site-wide approved reviews (count + average) for aggregateRating schema", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [{ rating: 5 }, { rating: 4 }, { rating: 5 }]
      }))
    );

    const { getApprovedReviewsSummary } = await import("./supabase-rest");

    // Real computed average from the mocked data source (5+4+5)/3 = 4.666… rounded to 4.7, not invented.
    await expect(getApprovedReviewsSummary()).resolves.toEqual({ count: 3, average: 4.7 });
  });

  it("returns a null-average empty summary when Supabase is not configured", async () => {
    // Explicitly clear every credential this module reads, rather than relying on the ambient
    // environment having none set: CI job envs differ (the deploy workflow injects real Supabase
    // secrets into every step, including the test step), so an implicit "unconfigured" test here
    // previously made a real network call to production Supabase and asserted against live data.
    // Also stub fetch to fail loudly so a real network call (production or otherwise) cannot pass
    // silently even if the config check above is ever loosened. Tests must never touch Rosa's
    // production Supabase project.
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Test must not reach the network; Supabase is intentionally unconfigured here.");
      })
    );

    const { getApprovedReviewsSummary } = await import("./supabase-rest");

    await expect(getApprovedReviewsSummary()).resolves.toEqual({ count: 0, average: null });
  });

  it("returns an empty summary instead of throwing when the Supabase fetch fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connect ECONNREFUSED 127.0.0.1:54321");
      })
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { getApprovedReviewsSummary } = await import("./supabase-rest");

    await expect(getApprovedReviewsSummary()).resolves.toEqual({ count: 0, average: null });
  });
});

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

  it("returns a null-average empty summary with no approved reviews or no Supabase config", async () => {
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

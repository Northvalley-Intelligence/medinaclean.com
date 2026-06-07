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
});

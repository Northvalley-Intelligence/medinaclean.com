import { afterEach, describe, expect, it, vi } from "vitest";

type Row = { id: string; name: string; rating: number; message: string; photo_path: null; created_at: string };
const rows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i),
    name: "N",
    rating: 5,
    message: "m",
    photo_path: null,
    created_at: "2026-01-01"
  }));

describe("getApprovedReviewsPage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns empty when Supabase is not configured", async () => {
    // Explicitly clear env — the deploy workflow runs tests with real Supabase vars set, so we must not
    // rely on ambient absence (that made this fetch production data and fail).
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { getApprovedReviewsPage } = await import("./supabase-rest");
    expect(await getApprovedReviewsPage("en", 1)).toEqual({ reviews: [], page: 1, hasPrev: false, hasNext: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a full page, detects a next page, and filters approved+consented by language", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "anon-key");
    const fetchMock = vi.fn(async (u: string) => {
      void u;
      return Response.json(rows(13));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getApprovedReviewsPage } = await import("./supabase-rest");
    const result = await getApprovedReviewsPage("en", 1);

    expect(result.reviews).toHaveLength(12);
    expect(result).toMatchObject({ page: 1, hasPrev: false, hasNext: true });
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("status=eq.approved");
    expect(calledUrl).toContain("consent_to_publish=eq.true");
    expect(calledUrl).toContain("language=eq.en");
    expect(calledUrl).toContain("offset=0");
    expect(calledUrl).toContain("limit=13");
  });

  it("computes offset + hasPrev for page 2 and no next page when fewer rows", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc");
    const fetchMock = vi.fn(async (u: string) => {
      void u;
      return Response.json(rows(3));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getApprovedReviewsPage } = await import("./supabase-rest");
    const result = await getApprovedReviewsPage("es", 2, 12);

    expect(result).toMatchObject({ page: 2, hasPrev: true, hasNext: false });
    expect(result.reviews).toHaveLength(3);
    expect(String(fetchMock.mock.calls[0][0])).toContain("offset=12");
  });
});

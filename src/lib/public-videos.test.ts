import { afterEach, describe, expect, it, vi } from "vitest";

describe("public videos", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("filters YouTube videos that have been deleted or made unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const requestUrl = String(url);
      if (requestUrl.startsWith("https://supabase.test/rest/v1/site_videos")) {
        expect(requestUrl).toContain("limit=6");
        return Response.json([
          {
            id: "available-row",
            created_at: "2026-06-01T12:00:00Z",
            title_en: "Available video",
            title_es: "Video disponible",
            youtube_video_id: "available123",
            youtube_url: "https://www.youtube.com/watch?v=available123",
            embed_url: "https://www.youtube-nocookie.com/embed/available123",
            privacy_status: "public",
            is_visible: true
          },
          {
            id: "deleted-row",
            created_at: "2026-06-01T12:01:00Z",
            title_en: "Deleted video",
            title_es: "Video borrado",
            youtube_video_id: "deleted123",
            youtube_url: "https://www.youtube.com/watch?v=deleted123",
            embed_url: "https://www.youtube-nocookie.com/embed/deleted123",
            privacy_status: "public",
            is_visible: true
          }
        ]);
      }

      if (requestUrl.includes("available123")) {
        expect(init).toMatchObject({ next: { revalidate: 21600 } });
        return Response.json({ title: "Available video" });
      }

      if (requestUrl.includes("deleted123")) {
        return new Response("Not found", { status: 404 });
      }

      return new Response(`Unexpected request: ${requestUrl}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getPublicSiteVideos } = await import("./supabase-rest");

    await expect(getPublicSiteVideos()).resolves.toMatchObject([{ id: "available-row" }]);
  });

  it("keeps videos visible if YouTube availability checks have a transient failure", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const requestUrl = String(url);
      if (requestUrl.startsWith("https://supabase.test/rest/v1/site_videos")) {
        expect(requestUrl).toContain("limit=6");
        return Response.json([
          {
            id: "available-row",
            created_at: "2026-06-01T12:00:00Z",
            title_en: "Available video",
            title_es: "Video disponible",
            youtube_video_id: "available123",
            youtube_url: "https://www.youtube.com/watch?v=available123",
            embed_url: "https://www.youtube-nocookie.com/embed/available123",
            privacy_status: "public",
            is_visible: true
          }
        ]);
      }

      throw new Error("YouTube timed out");
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getPublicSiteVideos } = await import("./supabase-rest");

    await expect(getPublicSiteVideos()).resolves.toMatchObject([{ id: "available-row" }]);
  });

  it("does not show private YouTube uploads on the public website", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const requestUrl = String(url);
      if (requestUrl.startsWith("https://supabase.test/rest/v1/site_videos")) {
        expect(requestUrl).toContain("privacy_status=in.%28public%2Cunlisted%29");
        return Response.json([]);
      }

      return new Response(`Unexpected request: ${requestUrl}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getPublicSiteVideos } = await import("./supabase-rest");

    await expect(getPublicSiteVideos()).resolves.toEqual([]);
  });
});

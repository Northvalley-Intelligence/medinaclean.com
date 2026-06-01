import { afterEach, describe, expect, it, vi } from "vitest";
import { mapVideoRow, parseVideoUploadPayload, uploadVideoToYouTube, type SiteVideoRow } from "./video-records";

describe("video records", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates admin video upload payloads before hitting YouTube", () => {
    const parsed = parseVideoUploadPayload({
      titleEn: "Before and after kitchen",
      titleEs: "Antes y despues cocina",
      video: new File(["video"], "kitchen.mp4", { type: "video/mp4" })
    });

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.privacyStatus).toBe("public");
    }
  });

  it("rejects missing titles and unsupported video types", () => {
    const parsed = parseVideoUploadPayload({
      titleEn: "",
      titleEs: "",
      video: new File(["not video"], "kitchen.txt", { type: "text/plain" })
    });

    expect(parsed).toEqual({
      ok: false,
      errors: ["English title is required.", "Spanish title is required.", "Use an MP4, MOV, or WebM video file."]
    });
  });

  it("uploads to YouTube with a refreshed OAuth access token", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      void init;
      const requestUrl = String(url);
      if (requestUrl === "https://oauth2.googleapis.com/token") {
        return Response.json({ access_token: "access-token" });
      }

      if (requestUrl.startsWith("https://www.googleapis.com/upload/youtube/v3/videos")) {
        return Response.json({ id: "newVideo123" });
      }

      return new Response("Unexpected request", { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      uploadVideoToYouTube(
        {
          titleEn: "Sparkling kitchen",
          titleEs: "Cocina limpia",
          description: "Medina Clean project video",
          privacyStatus: "public",
          file: new File(["video"], "kitchen.mp4", { type: "video/mp4" })
        },
        {
          clientId: "client-id",
          clientSecret: "client-secret",
          refreshToken: "refresh-token"
        }
      )
    ).resolves.toEqual({
      youtubeVideoId: "newVideo123",
      youtubeUrl: "https://www.youtube.com/watch?v=newVideo123",
      embedUrl: "https://www.youtube-nocookie.com/embed/newVideo123"
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: { authorization: "Bearer access-token" }
    });
  });

  it("maps database rows to localized public videos", () => {
    const row: SiteVideoRow = {
      id: "video-id",
      created_at: "2026-06-01T12:00:00Z",
      title_en: "Deep clean",
      title_es: "Limpieza profunda",
      youtube_video_id: "abc123",
      youtube_url: "https://www.youtube.com/watch?v=abc123",
      embed_url: "https://www.youtube-nocookie.com/embed/abc123",
      privacy_status: "public",
      is_visible: true
    };

    expect(mapVideoRow(row, "es").title).toBe("Limpieza profunda");
    expect(mapVideoRow(row, "en").title).toBe("Deep clean");
  });
});

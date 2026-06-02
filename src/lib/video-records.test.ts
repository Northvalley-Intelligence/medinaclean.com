import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildYouTubeVideoDescription,
  buildYouTubeVideoTags,
  isVideoUploadRequestTooLarge,
  mapAdminVideoRow,
  maxVideoBytes,
  mapVideoRow,
  parseVideoUploadPayload,
  uploadVideoToYouTube,
  type SiteVideoRow
} from "./video-records";

describe("video records", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates admin video upload payloads before hitting YouTube", () => {
    const parsed = parseVideoUploadPayload({
      titleEn: "",
      titleEs: "",
      serviceFocus: "kitchen_cleaning",
      video: new File(["video"], "kitchen.mp4", { type: "video/mp4" })
    });

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.titleEn).toBe("Video de Medina Clean");
      expect(parsed.value.titleEs).toBe("Video de Medina Clean");
      expect(parsed.value.privacyStatus).toBe("public");
      expect(parsed.value.serviceFocus).toBe("kitchen_cleaning");
    }
  });

  it("rejects unsupported video types without requiring a title", () => {
    const parsed = parseVideoUploadPayload({
      titleEn: "",
      titleEs: "",
      video: new File(["not video"], "kitchen.txt", { type: "text/plain" })
    });

    expect(parsed).toEqual({
      ok: false,
      errors: ["Use an MP4, MOV, or WebM video file."]
    });
  });

  it("rejects videos above the current Cloudflare-safe MVP size", () => {
    const parsed = parseVideoUploadPayload({
      titleEn: "Before and after kitchen",
      titleEs: "Antes y despues cocina",
      video: new File([new Uint8Array(maxVideoBytes + 1)], "kitchen.mp4", { type: "video/mp4" })
    });

    expect(parsed).toEqual({
      ok: false,
      errors: ["Video must be 75 MB or smaller for this admin upload."]
    });
  });

  it("flags oversized multipart requests before buffering the file", () => {
    expect(isVideoUploadRequestTooLarge(String(maxVideoBytes + 1024 * 1024 + 1))).toBe(true);
    expect(isVideoUploadRequestTooLarge(String(maxVideoBytes + 1024))).toBe(false);
    expect(isVideoUploadRequestTooLarge(null)).toBe(false);
    expect(isVideoUploadRequestTooLarge("not-a-number")).toBe(false);
  });

  it("adds website, service area, optional focus, and focused hashtags to YouTube descriptions", () => {
    expect(buildYouTubeVideoDescription("Generated local smoke test.", "kitchen_cleaning")).toBe(
      [
        "Generated local smoke test.",
        "",
        "Video focus: kitchen cleaning.",
        "",
        "Medina Clean provides house, apartment, condo, deep, recurring, small business, and post-construction cleaning near Woodstock, Marietta, Kennesaw, Acworth, Canton, and Roswell, GA.",
        "Schedule or request an estimate: https://medinaclean.com/en#schedule",
        "Servicio en español: https://medinaclean.com/es#schedule",
        "",
        "#Shorts #MedinaClean #WoodstockGA #HouseCleaning #DeepCleaning #CleaningService #KitchenCleaning"
      ].join("\n")
    );
  });

  it("still includes website and local SEO context when Rosa leaves description blank", () => {
    const description = buildYouTubeVideoDescription("", "");

    expect(description).toContain("https://medinaclean.com/en#schedule");
    expect(description).toContain("Woodstock, Marietta, Kennesaw, Acworth, Canton, and Roswell, GA");
    expect(description).toContain("#MedinaClean");
    expect(description).toContain("#Shorts");
  });

  it("builds YouTube tags from the optional service focus", () => {
    expect(buildYouTubeVideoTags("bathroom_cleaning")).toEqual([
      "Shorts",
      "Medina Clean",
      "Woodstock GA cleaning",
      "house cleaning",
      "deep cleaning",
      "bathroom cleaning"
    ]);
  });

  it("uploads to YouTube with a refreshed OAuth access token", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      void init;
      const requestUrl = String(url);
      if (requestUrl === "https://oauth2.googleapis.com/token") {
        return Response.json({ access_token: "access-token" });
      }

      if (requestUrl.startsWith("https://www.googleapis.com/upload/youtube/v3/videos")) {
        const metadataBlob = (init?.body as FormData).get("metadata");
        expect(metadataBlob).toBeInstanceOf(Blob);
        if (!(metadataBlob instanceof Blob)) {
          return new Response("Missing metadata", { status: 500 });
        }
        const metadata = JSON.parse(await metadataBlob.text());
        expect(metadata.snippet.description).toContain("https://medinaclean.com/en#schedule");
        expect(metadata.snippet.description).toContain("#Shorts");
        expect(metadata.snippet.description).toContain("#WoodstockGA");
        expect(metadata.snippet.tags).toContain("Shorts");
        expect(metadata.snippet.tags).toContain("bathroom cleaning");
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
          serviceFocus: "bathroom_cleaning",
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

  it("marks admin video rows with YouTube availability", () => {
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

    expect(mapAdminVideoRow(row, false)).toMatchObject({
      id: "video-id",
      youtubeAvailable: false
    });
  });
});

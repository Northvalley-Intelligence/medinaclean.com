import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin video upload route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("requires an admin session", async () => {
    const { POST } = await import("./route");
    const response = await POST(new Request("https://medinaclean.com/api/admin/videos", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("uploads the video to YouTube and stores the public link", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("YOUTUBE_CLIENT_ID", "client-id");
    vi.stubEnv("YOUTUBE_CLIENT_SECRET", "client-secret");
    vi.stubEnv("YOUTUBE_REFRESH_TOKEN", "refresh-token");

    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const requestUrl = String(url);
      if (requestUrl === "https://oauth2.googleapis.com/token") {
        return Response.json({ access_token: "access-token" });
      }

      if (requestUrl.startsWith("https://www.googleapis.com/upload/youtube/v3/videos")) {
        expect(init?.headers).toMatchObject({ authorization: "Bearer access-token" });
        return Response.json({ id: "uploaded123" });
      }

      if (requestUrl === "https://supabase.test/rest/v1/site_videos") {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toMatchObject({
          title_en: "Clean kitchen reveal",
          title_es: "Cocina limpia",
          youtube_video_id: "uploaded123",
          youtube_url: "https://www.youtube.com/watch?v=uploaded123",
          embed_url: "https://www.youtube-nocookie.com/embed/uploaded123",
          privacy_status: "public",
          is_visible: true
        });
        return Response.json([{ id: "row-id" }]);
      }

      return new Response(`Unexpected request: ${requestUrl}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { createAdminSession } = await import("../../../../lib/admin-auth");
    const { POST } = await import("./route");
    const session = await createAdminSession("test-admin");
    expect(session.ok).toBe(true);
    if (!session.ok) {
      return;
    }

    const form = new FormData();
    form.set("lang", "en");
    form.set("titleEn", "Clean kitchen reveal");
    form.set("titleEs", "Cocina limpia");
    form.set("description", "Real Medina Clean project.");
    form.set("privacyStatus", "public");
    form.set("video", new File(["video"], "kitchen.mp4", { type: "video/mp4" }));

    const response = await POST(
      new Request("https://medinaclean.com/api/admin/videos", {
        method: "POST",
        headers: {
          cookie: `rosa_admin_session=${session.cookie}`
        },
        body: form
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://medinaclean.com/admin/videos?lang=en&uploaded=1");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

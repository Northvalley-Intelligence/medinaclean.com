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

      if (requestUrl === "https://supabase.test/rest/v1/site_videos?select=id&limit=1") {
        expect(init?.method).toBeUndefined();
        return Response.json([]);
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
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("rejects oversized requests before parsing multipart form data", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");

    const { createAdminSession } = await import("../../../../lib/admin-auth");
    const { POST } = await import("./route");
    const session = await createAdminSession("test-admin");
    expect(session.ok).toBe(true);
    if (!session.ok) {
      return;
    }

    const response = await POST(
      new Request("https://medinaclean.com/api/admin/videos", {
        method: "POST",
        headers: {
          cookie: `rosa_admin_session=${session.cookie}`,
          "content-length": String(77 * 1024 * 1024),
          "content-type": "multipart/form-data; boundary=video"
        },
        body: "--video\r\ncontent that should not be parsed"
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain(
      "error=Video+must+be+75+MB+or+smaller+for+this+admin+upload."
    );
  });

  it("redirects back to admin when multipart parsing fails", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");

    const { createAdminSession } = await import("../../../../lib/admin-auth");
    const { POST } = await import("./route");
    const session = await createAdminSession("test-admin");
    expect(session.ok).toBe(true);
    if (!session.ok) {
      return;
    }

    const response = await POST(
      new Request("https://medinaclean.com/api/admin/videos", {
        method: "POST",
        headers: {
          cookie: `rosa_admin_session=${session.cookie}`,
          "content-type": "multipart/form-data; boundary=video"
        },
        body: "not a valid multipart body"
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("error=The+video+form+could+not+be+read.");
  });

  it("rejects image uploads without calling YouTube or Supabase", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { createAdminSession } = await import("../../../../lib/admin-auth");
    const { POST } = await import("./route");
    const session = await createAdminSession("test-admin");
    expect(session.ok).toBe(true);
    if (!session.ok) {
      return;
    }

    const form = new FormData();
    form.set("video", new File(["image"], "kitchen.jpg", { type: "image/jpeg" }));

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
    expect(response.headers.get("location")).toContain("error=Use+an+MP4%2C+MOV%2C+or+WebM+video+file.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects document uploads without calling YouTube or Supabase", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { createAdminSession } = await import("../../../../lib/admin-auth");
    const { POST } = await import("./route");
    const session = await createAdminSession("test-admin");
    expect(session.ok).toBe(true);
    if (!session.ok) {
      return;
    }

    const form = new FormData();
    form.set("video", new File(["document"], "details.pdf", { type: "application/pdf" }));

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
    expect(response.headers.get("location")).toContain("error=Use+an+MP4%2C+MOV%2C+or+WebM+video+file.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects missing files without calling YouTube or Supabase", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { createAdminSession } = await import("../../../../lib/admin-auth");
    const { POST } = await import("./route");
    const session = await createAdminSession("test-admin");
    expect(session.ok).toBe(true);
    if (!session.ok) {
      return;
    }

    const response = await POST(
      new Request("https://medinaclean.com/api/admin/videos", {
        method: "POST",
        headers: {
          cookie: `rosa_admin_session=${session.cookie}`
        },
        body: new FormData()
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("error=Video+file+is+required.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks Supabase readiness before creating a public YouTube video", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("YOUTUBE_CLIENT_ID", "client-id");
    vi.stubEnv("YOUTUBE_CLIENT_SECRET", "client-secret");
    vi.stubEnv("YOUTUBE_REFRESH_TOKEN", "refresh-token");

    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const requestUrl = String(url);
      if (requestUrl === "https://supabase.test/rest/v1/site_videos?select=id&limit=1") {
        return new Response("relation public.site_videos does not exist", { status: 404 });
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
    expect(response.headers.get("location")).toContain(
      "error=Supabase+service+select+failed%3A+relation+public.site_videos+does+not+exist"
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin video visibility route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("requires an admin session", async () => {
    const { POST } = await import("./route");
    const response = await POST(new Request("https://medinaclean.com/api/admin/videos/video-id", { method: "POST" }), {
      params: Promise.resolve({ id: "video-id" })
    });

    expect(response.status).toBe(401);
  });

  it("hides a video from the public website without deleting it from YouTube", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");

    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe("https://supabase.test/rest/v1/site_videos?id=eq.video-id");
      expect(init?.method).toBe("PATCH");
      expect(JSON.parse(String(init?.body))).toEqual({ is_visible: false });
      return Response.json([{ id: "video-id" }]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { createAdminSession } = await import("../../../../../lib/admin-auth");
    const { POST } = await import("./route");
    const session = await createAdminSession("test-admin");
    expect(session.ok).toBe(true);
    if (!session.ok) {
      return;
    }

    const form = new URLSearchParams({
      lang: "en",
      isVisible: "false"
    });

    const response = await POST(
      new Request("https://medinaclean.com/api/admin/videos/video-id", {
        method: "POST",
        headers: {
          cookie: `rosa_admin_session=${session.cookie}`,
          "content-type": "application/x-www-form-urlencoded"
        },
        body: form
      }),
      { params: Promise.resolve({ id: "video-id" }) }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://medinaclean.com/admin/videos?lang=en&updated=1");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("shows a hidden video on the public website again", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");

    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe("https://supabase.test/rest/v1/site_videos?id=eq.video-id");
      expect(init?.method).toBe("PATCH");
      expect(JSON.parse(String(init?.body))).toEqual({ is_visible: true });
      return Response.json([{ id: "video-id" }]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { createAdminSession } = await import("../../../../../lib/admin-auth");
    const { POST } = await import("./route");
    const session = await createAdminSession("test-admin");
    expect(session.ok).toBe(true);
    if (!session.ok) {
      return;
    }

    const form = new URLSearchParams({
      isVisible: "true"
    });

    const response = await POST(
      new Request("https://medinaclean.com/api/admin/videos/video-id", {
        method: "POST",
        headers: {
          cookie: `rosa_admin_session=${session.cookie}`,
          "content-type": "application/x-www-form-urlencoded"
        },
        body: form
      }),
      { params: Promise.resolve({ id: "video-id" }) }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://medinaclean.com/admin/videos?updated=1");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("removes a stale Medina Clean video record without calling YouTube", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");

    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe("https://supabase.test/rest/v1/site_videos?id=eq.video-id");
      expect(init?.method).toBe("DELETE");
      return Response.json([{ id: "video-id" }]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { createAdminSession } = await import("../../../../../lib/admin-auth");
    const { POST } = await import("./route");
    const session = await createAdminSession("test-admin");
    expect(session.ok).toBe(true);
    if (!session.ok) {
      return;
    }

    const form = new URLSearchParams({
      lang: "en",
      action: "delete"
    });

    const response = await POST(
      new Request("https://medinaclean.com/api/admin/videos/video-id", {
        method: "POST",
        headers: {
          cookie: `rosa_admin_session=${session.cookie}`,
          "content-type": "application/x-www-form-urlencoded"
        },
        body: form
      }),
      { params: Promise.resolve({ id: "video-id" }) }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://medinaclean.com/admin/videos?lang=en&updated=1");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

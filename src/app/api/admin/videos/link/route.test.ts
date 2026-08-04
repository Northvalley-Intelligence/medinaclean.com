import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin-auth", () => ({ isAdminRequest: vi.fn(async () => true) }));

import { isAdminRequest } from "@/lib/admin-auth";

function linkRequest(fields: Record<string, string>) {
  const form = new URLSearchParams(fields);
  return new Request("https://medinaclean.com/api/admin/videos/link", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });
}

describe("admin add-video-by-url route", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("rejects unauthenticated requests with 401", async () => {
    (isAdminRequest as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const { POST } = await import("./route");
    const response = await POST(linkRequest({ url: "https://youtu.be/bF2KS3gXMeM", titleEn: "A" }));
    expect(response.status).toBe(401);
  });

  it("adds an available video: inserts the row and redirects with success", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      void init;
      const u = String(url);
      if (u.includes("youtube.com/oembed")) return Response.json({ title: "ok" }, { status: 200 });
      if (u === "https://supabase.test/rest/v1/site_videos") return Response.json([{ id: "vid-1" }]);
      return new Response(`unexpected ${u}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const response = await POST(
      linkRequest({ url: "https://youtube.com/shorts/bF2KS3gXMeM", titleEn: "Before/After", titleEs: "Antes/Después" })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("uploaded=");
    const insertCall = fetchMock.mock.calls.find((c) => String(c[0]).endsWith("/site_videos"));
    expect(insertCall).toBeTruthy();
    expect(JSON.parse(String((insertCall![1] as RequestInit).body))).toMatchObject({
      youtube_video_id: "bF2KS3gXMeM",
      is_visible: true
    });
  });

  it("rejects an invalid URL before touching Supabase", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");
    const response = await POST(linkRequest({ url: "https://example.com/x", titleEn: "A" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("error=");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports when the video is not publicly available", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      if (String(url).includes("youtube.com/oembed")) return new Response("not found", { status: 401 });
      return new Response("unexpected", { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");
    const response = await POST(linkRequest({ url: "https://youtu.be/bF2KS3gXMeM", titleEn: "A" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("error=");
  });
});

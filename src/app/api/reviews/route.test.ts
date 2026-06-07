import { afterEach, describe, expect, it, vi } from "vitest";

describe("review route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("saves pending reviews and sends an internal email", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "anon-key");
    vi.stubEnv("RESEND_API_KEY", "resend-token");
    vi.stubEnv("CHAT_NOTIFY_TO", "ferosh@northvalleyintel.com");

    const fetchMock = vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
      void _init;
      const requestUrl = String(url);
      if (requestUrl === "https://supabase.test/rest/v1/reviews") {
        return Response.json([{ id: "review-1" }]);
      }
      if (requestUrl === "https://api.resend.com/emails") {
        return Response.json({ id: "email-1" });
      }
      return new Response(`Unexpected request: ${requestUrl}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const formData = new FormData();
    formData.set("language", "en");
    formData.set("name", "Maria Client");
    formData.set("rating", "5");
    formData.set("message", "Medina Clean did a careful and reliable cleaning for our home.");
    formData.set("consent", "true");

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://medinaclean.com/api/reviews", {
        method: "POST",
        body: formData
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, notificationInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(String(notificationInit.body))).toMatchObject({
      to: ["ferosh@northvalleyintel.com"],
      subject: "New Medina Clean review pending: Maria Client"
    });
  });
});

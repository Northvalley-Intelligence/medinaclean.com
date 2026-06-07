import { afterEach, describe, expect, it, vi } from "vitest";

describe("appointment route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("saves valid appointment requests and sends an internal email", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "anon-key");
    vi.stubEnv("RESEND_API_KEY", "resend-token");
    vi.stubEnv("CHAT_NOTIFY_TO", "ferosh@northvalleyintel.com");

    const fetchMock = vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
      void _init;
      const requestUrl = String(url);
      if (requestUrl === "https://supabase.test/rest/v1/appointment_requests") {
        return Response.json([{ id: "appointment-1" }]);
      }
      if (requestUrl === "https://api.resend.com/emails") {
        return Response.json({ id: "email-1" });
      }
      return new Response(`Unexpected request: ${requestUrl}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const response = await POST(buildAppointmentRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, notificationInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(String(notificationInit.body))).toMatchObject({
      to: ["ferosh@northvalleyintel.com"],
      subject: "New Medina Clean appointment request: Taylor Client"
    });
  });

  it("does not fail appointment requests when the notification email fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "anon-key");
    vi.stubEnv("RESEND_API_KEY", "resend-token");
    vi.stubEnv("CHAT_NOTIFY_TO", "ferosh@northvalleyintel.com");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const fetchMock = vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
      void _init;
      const requestUrl = String(url);
      if (requestUrl === "https://supabase.test/rest/v1/appointment_requests") {
        return Response.json([{ id: "appointment-1" }]);
      }
      if (requestUrl === "https://api.resend.com/emails") {
        return new Response("temporary resend failure", { status: 500 });
      }
      return new Response(`Unexpected request: ${requestUrl}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const response = await POST(buildAppointmentRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

function buildAppointmentRequest() {
  return new Request("https://medinaclean.com/api/appointments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      language: "en",
      name: "Taylor Client",
      phone: "+14705550111",
      address: "100 Main Street, Woodstock, GA",
      zipCode: "30188",
      serviceType: "Every 2 weeks",
      bedrooms: 3,
      bathrooms: 2,
      preferredTime1: "2026-06-10T09:00",
      preferredTime2: "2026-06-11T10:00",
      preferredTime3: "2026-06-12T11:00",
      notes: "Has a dog"
    })
  });
}

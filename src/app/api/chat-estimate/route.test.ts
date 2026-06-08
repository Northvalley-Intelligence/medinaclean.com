import { afterEach, describe, expect, it, vi } from "vitest";

describe("chat estimate route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("rejects chat when Turnstile is configured and the visitor token is missing", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "turnstile-secret");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://medinaclean.com/api/chat-estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: "en", message: "How much for 3 bedrooms?", turnIndex: 0 })
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Please complete the verification and try again." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends an internal email after an accepted deterministic chat response", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("AI_CHAT_ENABLED", "");
    vi.stubEnv("AI_CHAT_PROVIDER_CHAIN", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "resend-token");
    vi.stubEnv("CHAT_NOTIFY_TO", "ferosh@northvalleyintel.com");
    const fetchMock = vi.fn(async () => Response.json({ id: "email-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://medinaclean.com/api/chat-estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: "en", message: "How much for 3 bedrooms and 2 bathrooms in 30188?", turnIndex: 0 })
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: "deterministic_fallback", provider: "rules" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" })
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      to: ["ferosh@northvalleyintel.com"],
      subject: "New Medina Clean chat: en"
    });
  });
});

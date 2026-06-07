import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "./bot-protection";

describe("bot protection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not block local chat requests when Turnstile is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstileToken({ token: "", clientIp: "local", env: {} as NodeJS.ProcessEnv })).resolves.toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects missing tokens when Turnstile secret is configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      verifyTurnstileToken({
        token: "",
        clientIp: "203.0.113.10",
        env: { TURNSTILE_SECRET_KEY: "secret" } as unknown as NodeJS.ProcessEnv
      })
    ).resolves.toEqual({ ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("verifies configured Turnstile tokens with Cloudflare", async () => {
    const fetchMock = vi.fn(async () => Response.json({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      verifyTurnstileToken({
        token: "visitor-token",
        clientIp: "203.0.113.10",
        env: { TURNSTILE_SECRET_KEY: "secret" } as unknown as NodeJS.ProcessEnv
      })
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
        body: expect.any(URLSearchParams)
      })
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("secret");
    expect(body.get("response")).toBe("visitor-token");
    expect(body.get("remoteip")).toBe("203.0.113.10");
  });
});

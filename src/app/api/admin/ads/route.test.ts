import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin ads route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("requires an admin session", async () => {
    const { POST } = await import("./route");
    const response = await POST(new Request("https://medinaclean.com/api/admin/ads", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("returns a dry-run Meta draft without calling Meta when live publishing is not configured", async () => {
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
      new Request("https://medinaclean.com/api/admin/ads", {
        method: "POST",
        headers: {
          cookie: `rosa_admin_session=${session.cookie}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          lang: "es",
          campaignName: "Woodstock limpieza profunda",
          dailyBudgetUsd: "20",
          zipCodes: "30188\n30189",
          platforms: ["instagram", "facebook"],
          publishMode: "dry_run"
        })
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      mode: "dry_run",
      liveConfigured: false,
      missingConfig: [
        "META_ADS_LIVE_ENABLED",
        "META_ACCESS_TOKEN",
        "META_AD_ACCOUNT_ID",
        "META_PAGE_ID",
        "META_PIXEL_ID"
      ]
    });
    expect(body.draft.landingUrl).toContain("utm_source=meta");
    expect(body.draft.adSet.daily_budget).toBe(2000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates paused Meta campaign resources only when live publishing is explicitly configured", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");
    vi.stubEnv("META_ADS_LIVE_ENABLED", "true");
    vi.stubEnv("META_ACCESS_TOKEN", "meta-token");
    vi.stubEnv("META_AD_ACCOUNT_ID", "act_123");
    vi.stubEnv("META_PAGE_ID", "page-123");
    vi.stubEnv("META_PIXEL_ID", "pixel-123");

    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const requestUrl = String(url);
      const body = JSON.parse(String(init?.body || "{}"));
      expect(requestUrl).toMatch(/^https:\/\/graph\.facebook\.com\/v24\.0\//);
      expect(body.access_token).toBe("meta-token");

      if (requestUrl.endsWith("/act_123/campaigns")) {
        expect(body.status).toBe("PAUSED");
        return Response.json({ id: "campaign-1" });
      }

      if (requestUrl.endsWith("/act_123/adsets")) {
        expect(body.campaign_id).toBe("campaign-1");
        expect(body.status).toBe("PAUSED");
        return Response.json({ id: "adset-1" });
      }

      if (requestUrl.endsWith("/act_123/adcreatives")) {
        expect(body.object_story_spec.page_id).toBe("page-123");
        return Response.json({ id: "creative-1" });
      }

      if (requestUrl.endsWith("/act_123/ads")) {
        expect(body.adset_id).toBe("adset-1");
        expect(body.creative).toEqual({ creative_id: "creative-1" });
        expect(body.status).toBe("PAUSED");
        return Response.json({ id: "ad-1" });
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

    const response = await POST(
      new Request("https://medinaclean.com/api/admin/ads", {
        method: "POST",
        headers: {
          cookie: `rosa_admin_session=${session.cookie}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          lang: "en",
          campaignName: "Woodstock house cleaning",
          dailyBudgetUsd: "15",
          zipCodes: "30188",
          platforms: ["facebook"],
          publishMode: "publish_paused"
        })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      mode: "publish_paused",
      liveConfigured: true,
      meta: {
        campaignId: "campaign-1",
        adSetId: "adset-1",
        creativeId: "creative-1",
        adId: "ad-1"
      }
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("rejects invalid plans before calling Meta", async () => {
    vi.stubEnv("ROSA_ADMIN_PASSWORD", "test-admin");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret");
    vi.stubEnv("META_ADS_LIVE_ENABLED", "true");
    vi.stubEnv("META_ACCESS_TOKEN", "meta-token");
    vi.stubEnv("META_AD_ACCOUNT_ID", "act_123");
    vi.stubEnv("META_PAGE_ID", "page-123");
    vi.stubEnv("META_PIXEL_ID", "pixel-123");
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
      new Request("https://medinaclean.com/api/admin/ads", {
        method: "POST",
        headers: {
          cookie: `rosa_admin_session=${session.cookie}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          campaignName: "",
          dailyBudgetUsd: "2",
          zipCodes: "bad",
          platforms: [],
          publishMode: "publish_paused"
        })
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: false,
      errors: [
        "Campaign name is required.",
        "Daily budget must be between $5 and $250.",
        "Add at least one 5-digit ZIP code.",
        "Choose Instagram, Facebook, or both."
      ]
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

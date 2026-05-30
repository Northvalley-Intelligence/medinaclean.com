import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminSession, isAdminConfigured, isAdminRequest, verifyAdminSession } from "./admin-auth";

const originalEnv = process.env;

afterEach(() => {
  process.env.ROSA_ADMIN_PASSWORD = originalEnv.ROSA_ADMIN_PASSWORD;
  process.env.ADMIN_SESSION_SECRET = originalEnv.ADMIN_SESSION_SECRET;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("admin-auth", () => {
  it("reports missing admin configuration", () => {
    delete process.env.ROSA_ADMIN_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;

    expect(isAdminConfigured()).toBe(false);
  });

  it("creates and verifies a signed session for the configured password", async () => {
    process.env.ROSA_ADMIN_PASSWORD = "correct-password";
    process.env.ADMIN_SESSION_SECRET = "test-secret";

    const session = await createAdminSession("correct-password", 1_700_000_000_000);

    expect(session.ok).toBe(true);
    if (session.ok) {
      await expect(verifyAdminSession(session.cookie, 1_700_000_001_000)).resolves.toBe(true);
    }
  });

  it("rejects wrong passwords and expired sessions", async () => {
    process.env.ROSA_ADMIN_PASSWORD = "correct-password";
    process.env.ADMIN_SESSION_SECRET = "test-secret";

    await expect(createAdminSession("wrong-password")).resolves.toMatchObject({ ok: false });

    const session = await createAdminSession("correct-password", 1_700_000_000_000);
    expect(session.ok).toBe(true);
    if (session.ok) {
      await expect(verifyAdminSession(session.cookie, 1_700_700_000_000)).resolves.toBe(false);
    }
  });

  it("authorizes requests with the admin session cookie", async () => {
    process.env.ROSA_ADMIN_PASSWORD = "correct-password";
    process.env.ADMIN_SESSION_SECRET = "test-secret";

    const session = await createAdminSession("correct-password", 1_700_000_000_000);
    expect(session.ok).toBe(true);
    if (!session.ok) {
      return;
    }

    vi.useFakeTimers();
    vi.setSystemTime(1_700_000_001_000);
    const request = new Request("https://medinaclean.com/api/admin/clients", {
      headers: {
        cookie: `other=1; rosa_admin_session=${session.cookie}`
      }
    });

    await expect(isAdminRequest(request)).resolves.toBe(true);
  });
});

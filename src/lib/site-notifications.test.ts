import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAppointmentNotificationText, sendSiteNotification, trySendSiteNotification } from "./site-notifications";

describe("site notifications", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses the Northvalley Resend recipient env names when Medina-specific names are absent", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "email-1" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendSiteNotification(
        { subject: "New event", text: "A customer submitted an event." },
        { RESEND_API_KEY: "resend-token", CHAT_NOTIFY_TO: "ferosh@northvalleyintel.com" } as unknown as NodeJS.ProcessEnv
      )
    ).resolves.toEqual({ sent: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer resend-token"
        })
      })
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      from: "Medina Clean <alerts@northvalleyintel.com>",
      to: ["ferosh@northvalleyintel.com"],
      subject: "New event"
    });
  });

  it("does not fail public submissions when Resend is unavailable", async () => {
    const fetchMock = vi.fn(async () => new Response("bad api key", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      trySendSiteNotification(
        { subject: "New event", text: "A customer submitted an event." },
        { RESEND_API_KEY: "bad-token", SITE_NOTIFY_TO: "ferosh@northvalleyintel.com" } as unknown as NodeJS.ProcessEnv
      )
    ).resolves.toEqual({ sent: false, reason: "send_failed" });
  });

  it("formats appointment notifications with customer details for follow-up", () => {
    expect(
      buildAppointmentNotificationText({
        language: "en",
        name: "Maria",
        phone: "+14705550123",
        address: "100 Main St",
        zipCode: "30188",
        serviceType: "House cleaning",
        bedrooms: 3,
        bathrooms: 2,
        preferredTimes: ["2026-06-10T09:00", "2026-06-11T10:00", "2026-06-12T11:00"],
        notes: "Has a dog",
        source: "website"
      })
    ).toContain("Phone: +14705550123");
  });
});

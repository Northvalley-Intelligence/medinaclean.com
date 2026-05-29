import { afterEach, describe, expect, it, vi } from "vitest";
import { createCalendarProviderFromEnv, createGoogleCalendarProvider, createNoopCalendarProvider } from "./calendar-provider";

describe("calendar-provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("keeps a no-cost mocked calendar contract for invite creation", async () => {
    const provider = createNoopCalendarProvider();
    const result = await provider.sendInvite({
      jobId: "job-1",
      clientName: "Maria Smith",
      clientEmail: "maria@example.com",
      startsAt: "2026-06-15T13:00:00.000Z",
      durationMinutes: 180,
      summary: "Medina Clean appointment"
    });

    expect(result).toEqual({
      ok: true,
      provider: "noop",
      externalEventId: null,
      inviteStatus: "not_sent"
    });
  });

  it("uses the no-op provider unless Google Calendar is explicitly enabled", async () => {
    vi.stubEnv("GOOGLE_CALENDAR_ENABLED", "false");
    vi.stubEnv("GOOGLE_CALENDAR_ID", "primary");
    vi.stubEnv("GOOGLE_CALENDAR_ACCESS_TOKEN", "token");

    const provider = createCalendarProviderFromEnv();
    const result = await provider.sendInvite({
      jobId: "job-1",
      clientName: "Maria Smith",
      clientEmail: "maria@example.com",
      startsAt: "2026-06-15T13:00:00.000Z",
      durationMinutes: 180,
      summary: "Medina Clean appointment"
    });

    expect(result).toEqual({
      ok: true,
      provider: "noop",
      externalEventId: null,
      inviteStatus: "not_sent"
    });
  });

  it("creates a Google Calendar event with an attendee invite", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json({ id: "google-event-123" }, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = createGoogleCalendarProvider({
      calendarId: "primary",
      accessToken: "google-token"
    });

    const result = await provider.sendInvite({
      jobId: "job-1",
      clientName: "Maria Smith",
      clientEmail: "maria@example.com",
      startsAt: "2026-06-15T13:00:00.000Z",
      durationMinutes: 180,
      summary: "Medina Clean appointment"
    });

    expect(result).toEqual({
      ok: true,
      provider: "google",
      externalEventId: "google-event-123",
      inviteStatus: "needs_action"
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      expect.objectContaining({
        method: "POST",
        headers: {
          authorization: "Bearer google-token",
          "content-type": "application/json"
        }
      })
    );
    const fetchOptions = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(fetchOptions.body))).toEqual({
      summary: "Medina Clean appointment",
      description: "Medina Clean job job-1",
      start: {
        dateTime: "2026-06-15T13:00:00.000Z",
        timeZone: "America/New_York"
      },
      end: {
        dateTime: "2026-06-15T16:00:00.000Z",
        timeZone: "America/New_York"
      },
      attendees: [{ email: "maria@example.com", displayName: "Maria Smith" }]
    });
  });

  it("returns a failed Google result when the Calendar API rejects the invite", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("invalid token", { status: 401 })));

    const provider = createGoogleCalendarProvider({
      calendarId: "primary",
      accessToken: "bad-token"
    });

    const result = await provider.sendInvite({
      jobId: "job-1",
      clientName: "Maria Smith",
      clientEmail: "maria@example.com",
      startsAt: "2026-06-15T13:00:00.000Z",
      durationMinutes: 180,
      summary: "Medina Clean appointment"
    });

    expect(result).toEqual({
      ok: false,
      provider: "google",
      externalEventId: null,
      inviteStatus: "not_sent",
      error: "Google Calendar invite failed: invalid token"
    });
  });

  it("uses refresh-token OAuth credentials from env for production invites", async () => {
    vi.stubEnv("GOOGLE_CALENDAR_ENABLED", "true");
    vi.stubEnv("GOOGLE_CALENDAR_ID", "primary");
    vi.stubEnv("GOOGLE_CALENDAR_CLIENT_ID", "client-id");
    vi.stubEnv("GOOGLE_CALENDAR_CLIENT_SECRET", "client-secret");
    vi.stubEnv("GOOGLE_CALENDAR_REFRESH_TOKEN", "refresh-token");
    vi.stubEnv("GOOGLE_CALENDAR_ACCESS_TOKEN", "");

    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url === "https://oauth2.googleapis.com/token") {
        return Response.json({ access_token: "fresh-access-token" }, { status: 200 });
      }

      return Response.json({ id: "google-event-456" }, { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = createCalendarProviderFromEnv();
    const result = await provider.sendInvite({
      jobId: "job-2",
      clientName: "Rosa Client",
      clientEmail: "client@example.com",
      startsAt: "2026-06-16T14:00:00.000Z",
      durationMinutes: 120,
      summary: "Deep cleaning - Rosa Client"
    });

    expect(result).toEqual({
      ok: true,
      provider: "google",
      externalEventId: "google-event-456",
      inviteStatus: "needs_action"
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded"
        },
        body: "client_id=client-id&client_secret=client-secret&refresh_token=refresh-token&grant_type=refresh_token"
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      expect.objectContaining({
        headers: {
          authorization: "Bearer fresh-access-token",
          "content-type": "application/json"
        }
      })
    );
  });
});

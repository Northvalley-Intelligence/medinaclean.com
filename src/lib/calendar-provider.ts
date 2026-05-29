export type CalendarInviteRequest = {
  jobId: string;
  clientName: string;
  clientEmail: string | null;
  startsAt: string;
  durationMinutes: number | null;
  summary: string;
};

export type CalendarInviteResult = {
  ok: boolean;
  provider: "noop" | "google";
  externalEventId: string | null;
  inviteStatus: "not_sent" | "needs_action" | "accepted" | "declined" | "tentative";
  error?: string;
};

export type CalendarProvider = {
  sendInvite(input: CalendarInviteRequest): Promise<CalendarInviteResult>;
};

export type GoogleCalendarProviderConfig = {
  calendarId: string;
  accessToken?: string;
  oauth?: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
};

export function createNoopCalendarProvider(): CalendarProvider {
  return {
    async sendInvite() {
      return {
        ok: true,
        provider: "noop",
        externalEventId: null,
        inviteStatus: "not_sent"
      };
    }
  };
}

export function createGoogleCalendarProvider(config: GoogleCalendarProviderConfig): CalendarProvider {
  return {
    async sendInvite(input) {
      if (!config.calendarId || (!config.accessToken && !hasOAuthCredentials(config))) {
        return {
          ok: false,
          provider: "google",
          externalEventId: null,
          inviteStatus: "not_sent",
          error: "Google Calendar is not configured."
        };
      }

      const accessToken = config.accessToken || (await getRefreshedAccessToken(config));
      if (!accessToken) {
        return {
          ok: false,
          provider: "google",
          externalEventId: null,
          inviteStatus: "not_sent",
          error: "Google Calendar access token could not be refreshed."
        };
      }

      const startsAt = new Date(input.startsAt);
      const durationMinutes = input.durationMinutes || 180;
      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
      const body = {
        summary: input.summary,
        description: `Medina Clean job ${input.jobId}`,
        start: {
          dateTime: startsAt.toISOString(),
          timeZone: "America/New_York"
        },
        end: {
          dateTime: endsAt.toISOString(),
          timeZone: "America/New_York"
        },
        attendees: input.clientEmail ? [{ email: input.clientEmail, displayName: input.clientName }] : []
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events?sendUpdates=all`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const text = await response.text();
        return {
          ok: false,
          provider: "google",
          externalEventId: null,
          inviteStatus: "not_sent",
          error: `Google Calendar invite failed: ${text || response.statusText}`
        };
      }

      const data = (await response.json()) as { id?: string };
      return {
        ok: true,
        provider: "google",
        externalEventId: data.id || null,
        inviteStatus: "needs_action"
      };
    }
  };
}

export function createCalendarProviderFromEnv(): CalendarProvider {
  if (process.env.GOOGLE_CALENDAR_ENABLED !== "true") {
    return createNoopCalendarProvider();
  }

  return createGoogleCalendarProvider({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "",
    accessToken: process.env.GOOGLE_CALENDAR_ACCESS_TOKEN || undefined,
    oauth: {
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || "",
      refreshToken: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN || ""
    }
  });
}

function hasOAuthCredentials(config: GoogleCalendarProviderConfig) {
  return Boolean(config.oauth?.clientId && config.oauth.clientSecret && config.oauth.refreshToken);
}

async function getRefreshedAccessToken(config: GoogleCalendarProviderConfig) {
  if (!hasOAuthCredentials(config)) {
    return "";
  }

  const body = new URLSearchParams({
    client_id: config.oauth?.clientId || "",
    client_secret: config.oauth?.clientSecret || "",
    refresh_token: config.oauth?.refreshToken || "",
    grant_type: "refresh_token"
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  if (!response.ok) {
    return "";
  }

  const data = (await response.json()) as { access_token?: string };
  return data.access_token || "";
}

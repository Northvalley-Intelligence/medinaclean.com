import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createCalendarProviderFromEnv } from "@/lib/calendar-provider";
import type { ClientRow } from "@/lib/client-records";
import type { JobRow } from "@/lib/operations-records";
import { isSupabaseServiceConfigured, selectServiceRows, updateServiceRows } from "@/lib/supabase-rest";

type InviteRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: InviteRouteProps) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";
  const fallbackClientId = String(payload.clientId || payload.client_id || "");

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm, fallbackClientId);
  }

  try {
    const [job] = await selectServiceRows<JobRow>("jobs", `select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
    if (!job) {
      return respond(request, { error: "Job not found.", lang }, 404, isForm, fallbackClientId);
    }

    const [client] = await selectServiceRows<ClientRow>(
      "clients",
      `select=*&id=eq.${encodeURIComponent(job.client_id)}&limit=1`
    );
    if (!client) {
      return respond(request, { error: "Client not found.", lang }, 404, isForm, job.client_id);
    }

    if (!client.email) {
      return respond(request, { error: "Client email is required before sending a calendar invite.", lang }, 400, isForm, client.id);
    }

    if (!job.scheduled_for) {
      return respond(request, { error: "Scheduled date is required before sending a calendar invite.", lang }, 400, isForm, client.id);
    }

    const provider = createCalendarProviderFromEnv();
    const result = await provider.sendInvite({
      jobId: job.id,
      clientName: client.name,
      clientEmail: client.email,
      startsAt: job.scheduled_for,
      durationMinutes: job.estimated_duration_minutes,
      summary: `${job.service_type} - ${client.name}`
    });

    if (!result.ok) {
      return respond(request, { error: result.error || "Calendar invite could not be sent.", lang }, 502, isForm, client.id);
    }

    await updateServiceRows("jobs", `id=eq.${encodeURIComponent(job.id)}`, {
      status: "invite_sent",
      google_calendar_event_id: result.externalEventId,
      calendar_invite_status: result.inviteStatus,
      last_invite_sent_at: new Date().toISOString()
    });

    return respond(request, { ok: true, lang }, 200, isForm, client.id);
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The calendar invite could not be sent.", lang },
      500,
      isForm,
      fallbackClientId
    );
  }
}

function respond(
  request: Request,
  body: Record<string, unknown>,
  status: number,
  isForm: boolean | undefined,
  clientId: string
) {
  if (!isForm) {
    return NextResponse.json(body, { status });
  }

  const params = new URLSearchParams();
  if (body.lang === "en") {
    params.set("lang", "en");
  }
  params.set(status >= 400 ? "error" : "inviteSent", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/clients/${encodeURIComponent(clientId)}?${params.toString()}`, request.url), {
    status: 303
  });
}

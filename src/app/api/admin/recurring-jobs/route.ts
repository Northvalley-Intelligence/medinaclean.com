import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import type { ClientRow } from "@/lib/client-records";
import type { CrewMemberRow, CrewUnavailabilityRow } from "@/lib/crew-records";
import { chooseCrewMemberForJob } from "@/lib/crew-scheduling";
import type { JobRow } from "@/lib/operations-records";
import { planNextRecurringJob } from "@/lib/scheduling";
import { insertServiceRow, isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";
  const clientId = String(payload.clientId || payload.client_id || "");

  if (!clientId) {
    return respond(request, { error: "Client id is required.", lang }, 400, isForm);
  }

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm);
  }

  try {
    const [client] = await selectServiceRows<ClientRow>("clients", `select=*&id=eq.${encodeURIComponent(clientId)}&limit=1`);
    const jobs = await selectServiceRows<JobRow>(
      "jobs",
      `select=*&client_id=eq.${encodeURIComponent(clientId)}&order=scheduled_for.desc.nullslast&limit=50`
    );
    const nextJob = client ? planNextRecurringJob(client, jobs) : null;

    if (!nextJob) {
      return respond(request, { error: "No recurring job could be planned.", lang }, 400, isForm);
    }

    const [crewMembers, allJobs, unavailability] = await Promise.all([
      selectServiceRows<CrewMemberRow>("crew_members", "select=*&status=eq.active&order=is_rosa.desc,name.asc"),
      selectServiceRows<JobRow>("jobs", "select=*&order=scheduled_for.asc.nullslast&limit=500"),
      selectServiceRows<CrewUnavailabilityRow>("crew_unavailability", "select=*&order=start_at.asc&limit=500")
    ]);
    const assigned = chooseCrewMemberForJob({
      crewMembers,
      jobs: allJobs,
      unavailability,
      scheduledFor: nextJob.scheduled_for,
      durationMinutes: nextJob.estimated_duration_minutes
    });

    if (!assigned) {
      return respond(request, { error: "No crew member is available for that time.", lang }, 409, isForm);
    }

    await insertServiceRow("jobs", { ...nextJob, crew_member_id: assigned.id });
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The next cleaning could not be created.", lang },
      500,
      isForm
    );
  }

  return respond(request, { ok: true, lang }, 200, isForm);
}

function respond(request: Request, body: Record<string, unknown>, status: number, isForm: boolean | undefined) {
  if (!isForm) {
    return NextResponse.json(body, { status });
  }

  const params = new URLSearchParams();
  if (body.lang === "en") {
    params.set("lang", "en");
  }
  params.set(status >= 400 ? "error" : "nextJobCreated", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/tasks?${params.toString()}`, request.url), { status: 303 });
}

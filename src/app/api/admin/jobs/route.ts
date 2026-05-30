import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { canCrewTakeJob, chooseCrewMemberForJob } from "@/lib/crew-scheduling";
import type { CrewMemberRow, CrewUnavailabilityRow } from "@/lib/crew-records";
import type { JobRow } from "@/lib/operations-records";
import { parseJobPayload } from "@/lib/operations-records";
import { insertServiceRow, isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";
  const parsed = parseJobPayload(payload);

  if (!parsed.ok) {
    return respond(request, { error: parsed.errors.join(" "), lang }, 400, isForm, String(payload.clientId || ""));
  }

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm, parsed.row.client_id);
  }

  try {
    let row = parsed.row;
    if (row.scheduled_for) {
      const [crewMembers, jobs, unavailability] = await Promise.all([
        selectServiceRows<CrewMemberRow>("crew_members", "select=*&status=eq.active&order=is_rosa.desc,name.asc"),
        selectServiceRows<JobRow>("jobs", "select=*&order=scheduled_for.asc.nullslast&limit=500"),
        selectServiceRows<CrewUnavailabilityRow>("crew_unavailability", "select=*&order=start_at.asc&limit=500")
      ]);

      const durationMinutes = typeof row.estimated_duration_minutes === "number" ? row.estimated_duration_minutes : null;
      if (row.crew_member_id) {
        const selectedCrew = crewMembers.find((member) => member.id === row.crew_member_id);
        if (
          !selectedCrew ||
          !canCrewTakeJob({
            crewMember: selectedCrew,
            jobs,
            unavailability,
            scheduledFor: row.scheduled_for,
            durationMinutes
          })
        ) {
          return respond(request, { error: "Selected crew member is not available for that time.", lang }, 409, isForm, row.client_id);
        }
      } else {
        const assigned = chooseCrewMemberForJob({
          crewMembers,
          jobs,
          unavailability,
          scheduledFor: row.scheduled_for,
          durationMinutes
        });

        if (!assigned) {
          return respond(request, { error: "No crew member is available for that time.", lang }, 409, isForm, row.client_id);
        }

        row = { ...row, crew_member_id: assigned.id };
      }
    }

    await insertServiceRow("jobs", row);
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The job could not be saved.", lang },
      500,
      isForm,
      parsed.row.client_id
    );
  }

  return respond(request, { ok: true, lang }, 200, isForm, parsed.row.client_id);
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
  params.set(status >= 400 ? "error" : "jobCreated", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/clients/${encodeURIComponent(clientId)}?${params.toString()}`, request.url), {
    status: 303
  });
}

import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { isSupabaseServiceConfigured, updateServiceRows } from "@/lib/supabase-rest";

const jobStatuses = [
  "scheduled",
  "needs_confirmation",
  "invite_sent",
  "confirmed",
  "completed",
  "cancelled",
  "reschedule_needed"
] as const;

type JobRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: JobRouteProps) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";
  const clientId = String(payload.clientId || payload.client_id || "");
  const status = String(payload.status || "");

  if (!jobStatuses.includes(status as (typeof jobStatuses)[number])) {
    return respond(request, { error: "Job status must be valid.", lang, clientId }, 400, isForm);
  }

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang, clientId }, 503, isForm);
  }

  const update: Record<string, string | null> = { status };
  if (status === "confirmed") {
    update.calendar_invite_status = "accepted";
  } else if (status === "reschedule_needed") {
    update.calendar_invite_status = "declined";
  }

  try {
    await updateServiceRows("jobs", `id=eq.${encodeURIComponent(id)}`, update);
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The job could not be updated.", lang, clientId },
      500,
      isForm
    );
  }

  return respond(request, { ok: true, lang, clientId }, 200, isForm);
}

function respond(request: Request, body: Record<string, unknown>, status: number, isForm: boolean | undefined) {
  if (!isForm) {
    return NextResponse.json(body, { status });
  }

  const params = new URLSearchParams();
  if (body.lang === "en") {
    params.set("lang", "en");
  }
  params.set(status >= 400 ? "error" : "statusUpdated", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/clients/${encodeURIComponent(String(body.clientId || ""))}?${params.toString()}`, request.url), {
    status: 303
  });
}

import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { parseTimeBlockPayload } from "@/lib/operations-records";
import { insertServiceRow, isSupabaseServiceConfigured } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";
  const view = payload.view === "week" || payload.view === "month" ? String(payload.view) : "day";
  const date = String(payload.date || "");
  const parsed = parseTimeBlockPayload(payload);

  if (!parsed.ok) {
    return respond(request, { error: parsed.errors.join(" "), lang, view, date }, 400, isForm);
  }

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang, view, date }, 503, isForm);
  }

  try {
    await insertServiceRow("time_blocks", parsed.row);
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The time block could not be saved.", lang, view, date },
      500,
      isForm
    );
  }

  return respond(request, { ok: true, lang, view, date }, 200, isForm);
}

function respond(request: Request, body: Record<string, unknown>, status: number, isForm: boolean | undefined) {
  if (!isForm) {
    return NextResponse.json(body, { status });
  }

  const params = new URLSearchParams();
  if (body.lang === "en") {
    params.set("lang", "en");
  }
  if (body.view) {
    params.set("view", String(body.view));
  }
  if (body.date) {
    params.set("date", String(body.date));
  }
  params.set(status >= 400 ? "error" : "blockCreated", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/calendar?${params.toString()}`, request.url), { status: 303 });
}

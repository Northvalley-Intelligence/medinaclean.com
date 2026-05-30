import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { parseCrewMemberPayload } from "@/lib/crew-records";
import { insertServiceRow, isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Supabase service access is not configured." }, { status: 503 });
  }

  const crew = await selectServiceRows("crew_members", "select=*&order=is_rosa.desc,name.asc");
  return NextResponse.json({ crew });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";
  const parsed = parseCrewMemberPayload(payload);

  if (!parsed.ok) {
    return respond(request, { error: parsed.errors.join(" "), lang }, 400, isForm);
  }

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm);
  }

  try {
    await insertServiceRow("crew_members", parsed.row);
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The crew member could not be saved.", lang },
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
  params.set(status >= 400 ? "error" : "crewCreated", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/crew?${params.toString()}`, request.url), { status: 303 });
}

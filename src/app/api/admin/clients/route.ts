import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { parseClientPayload } from "@/lib/client-records";
import { insertServiceRow, isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Supabase service access is not configured." }, { status: 503 });
  }

  const clients = await selectServiceRows("clients", "select=*&order=created_at.desc");
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";
  const parsed = parseClientPayload(payload);

  if (!parsed.ok) {
    return respond(request, { error: parsed.errors.join(" "), lang }, 400, isForm);
  }

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm);
  }

  try {
    await insertServiceRow("clients", parsed.row);
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The client could not be saved.", lang },
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
  const formLang = body.lang === "en" ? "en" : "";
  if (formLang) {
    params.set("lang", formLang);
  }
  params.set(status >= 400 ? "error" : "created", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin?${params.toString()}`, request.url), { status: 303 });
}

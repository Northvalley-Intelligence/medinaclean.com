import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { parseFollowUpPayload } from "@/lib/operations-records";
import { insertServiceRow, isSupabaseServiceConfigured } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";
  const parsed = parseFollowUpPayload(payload);

  if (!parsed.ok) {
    return respond(request, { error: parsed.errors.join(" "), lang }, 400, isForm, String(payload.clientId || ""));
  }

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm, parsed.row.client_id);
  }

  try {
    await insertServiceRow("follow_up_tasks", parsed.row);
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The follow-up could not be saved.", lang },
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
  clientId: string | null
) {
  if (!isForm) {
    return NextResponse.json(body, { status });
  }

  const params = new URLSearchParams();
  if (body.lang === "en") {
    params.set("lang", "en");
  }
  params.set(status >= 400 ? "error" : "followUpCreated", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/clients/${encodeURIComponent(clientId || "")}?${params.toString()}`, request.url), {
    status: 303
  });
}

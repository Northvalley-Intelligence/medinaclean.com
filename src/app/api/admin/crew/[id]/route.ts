import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { parseCrewMemberPayload } from "@/lib/crew-records";
import { deleteServiceRows, isSupabaseServiceConfigured, updateServiceRows } from "@/lib/supabase-rest";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm);
  }

  try {
    if (payload.action === "delete") {
      await deleteServiceRows("crew_members", `id=eq.${encodeURIComponent(id)}`);
      return respond(request, { ok: true, lang, deleted: true }, 200, isForm);
    }

    const parsed = parseCrewMemberPayload(payload);
    if (!parsed.ok) {
      return respond(request, { error: parsed.errors.join(" "), lang }, 400, isForm);
    }

    await updateServiceRows("crew_members", `id=eq.${encodeURIComponent(id)}`, {
      ...parsed.row,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The crew member could not be updated.", lang },
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
  params.set(status >= 400 ? "error" : body.deleted ? "crewDeleted" : "crewUpdated", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/crew?${params.toString()}`, request.url), { status: 303 });
}

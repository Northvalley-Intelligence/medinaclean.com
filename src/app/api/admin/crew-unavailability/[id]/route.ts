import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { deleteServiceRows, isSupabaseServiceConfigured } from "@/lib/supabase-rest";

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
    await deleteServiceRows("crew_unavailability", `id=eq.${encodeURIComponent(id)}`);
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "Unavailable time could not be deleted.", lang },
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
  params.set(status >= 400 ? "error" : "unavailabilityDeleted", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/crew?${params.toString()}`, request.url), { status: 303 });
}

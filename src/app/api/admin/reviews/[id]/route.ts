import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { isSupabaseServiceConfigured, updateServiceRows } from "@/lib/supabase-rest";

type ReviewActionProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: ReviewActionProps) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";
  const action = payload.action === "reject" ? "reject" : "approve";
  const status = action === "reject" ? "rejected" : "approved";

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm);
  }

  try {
    await updateServiceRows("reviews", `id=eq.${encodeURIComponent(id)}`, {
      status,
      reviewed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The review could not be updated.", lang },
      500,
      isForm
    );
  }

  return respond(request, { ok: true, lang, action }, 200, isForm);
}

function respond(request: Request, body: Record<string, unknown>, status: number, isForm: boolean | undefined) {
  if (!isForm) {
    return NextResponse.json(body, { status });
  }

  const params = new URLSearchParams();
  if (body.lang === "en") {
    params.set("lang", "en");
  }
  params.set(status >= 400 ? "error" : String(body.action) === "reject" ? "rejected" : "approved", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/reviews?${params.toString()}`, request.url), { status: 303 });
}

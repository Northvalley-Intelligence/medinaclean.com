import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../../lib/admin-auth";
import { deleteServiceRows, isSupabaseServiceConfigured, updateServiceRows } from "../../../../../lib/supabase-rest";

type VideoActionProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: VideoActionProps) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  const payload = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const lang = payload.lang === "en" ? "en" : "";
  const action = payload.action === "delete" ? "delete" : "visibility";
  const isVisible = payload.isVisible === "true";

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm);
  }

  try {
    if (action === "delete") {
      await deleteServiceRows("site_videos", `id=eq.${encodeURIComponent(id)}`);
    } else {
      await updateServiceRows("site_videos", `id=eq.${encodeURIComponent(id)}`, {
        is_visible: isVisible
      });
    }
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The video could not be updated.", lang },
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
  params.set(status >= 400 ? "error" : "updated", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/videos?${params.toString()}`, request.url), { status: 303 });
}

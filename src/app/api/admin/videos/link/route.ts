import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { buildExistingVideoRow } from "@/lib/existing-video";
import { insertServiceRow, isSupabaseServiceConfigured, isYouTubeVideoAvailable } from "@/lib/supabase-rest";

// GEN-002 follow-up — add an existing YouTube video to the public gallery by URL (no file upload).
// Thin route: authenticate, parse, build the row (shared lib), verify availability, persist, respond.

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const isForm = Boolean(request.headers.get("content-type")?.includes("form"));

  let payload: Record<string, FormDataEntryValue>;
  try {
    payload = Object.fromEntries(await request.formData()) as Record<string, FormDataEntryValue>;
  } catch (error) {
    console.error(error);
    return respond(request, { error: "The form could not be read.", lang: "" }, 400, isForm);
  }

  const lang = payload.lang === "en" ? "en" : "";
  const built = buildExistingVideoRow({
    url: String(payload.url || ""),
    titleEn: String(payload.titleEn || ""),
    titleEs: String(payload.titleEs || ""),
    description: String(payload.description || ""),
    privacyStatus: String(payload.privacyStatus || "public")
  });

  if (!built.ok) {
    return respond(request, { error: built.errors.join(" "), lang }, 400, isForm);
  }

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm);
  }

  const available = await isYouTubeVideoAvailable(built.row.youtube_url);
  if (!available) {
    return respond(
      request,
      { error: "That video is not publicly available on YouTube. Make it public or unlisted, then try again.", lang },
      400,
      isForm
    );
  }

  try {
    await insertServiceRow("site_videos", built.row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const duplicate = /duplicate|already exists|unique/i.test(message);
    return respond(
      request,
      { error: duplicate ? "That video is already in the gallery." : "The video could not be added.", lang },
      duplicate ? 409 : 500,
      isForm
    );
  }

  return respond(request, { ok: true, lang }, 200, isForm);
}

function respond(request: Request, body: Record<string, unknown>, status: number, isForm: boolean) {
  if (!isForm) {
    return NextResponse.json(body, { status });
  }

  const params = new URLSearchParams();
  if (body.lang === "en") {
    params.set("lang", "en");
  }
  params.set(status >= 400 ? "error" : "uploaded", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/videos?${params.toString()}`, request.url), { status: 303 });
}

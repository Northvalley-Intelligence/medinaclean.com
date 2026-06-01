import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/admin-auth";
import { insertServiceRow, isSupabaseServiceConfigured } from "../../../../lib/supabase-rest";
import { getYouTubeUploadConfig, parseVideoUploadPayload, uploadVideoToYouTube } from "../../../../lib/video-records";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const isForm = request.headers.get("content-type")?.includes("multipart/form-data");
  const payload = Object.fromEntries(await request.formData()) as Record<string, FormDataEntryValue>;
  const lang = payload.lang === "en" ? "en" : "";
  const parsed = parseVideoUploadPayload(payload);

  if (!parsed.ok) {
    return respond(request, { error: parsed.errors.join(" "), lang }, 400, isForm);
  }

  if (!isSupabaseServiceConfigured()) {
    return respond(request, { error: "Supabase service access is not configured.", lang }, 503, isForm);
  }

  const youtubeConfig = getYouTubeUploadConfig();
  if (!youtubeConfig) {
    return respond(request, { error: "YouTube upload access is not configured.", lang }, 503, isForm);
  }

  try {
    const upload = await uploadVideoToYouTube(parsed.value, youtubeConfig);
    await insertServiceRow("site_videos", {
      title_en: parsed.value.titleEn,
      title_es: parsed.value.titleEs,
      description: parsed.value.description || null,
      youtube_video_id: upload.youtubeVideoId,
      youtube_url: upload.youtubeUrl,
      embed_url: upload.embedUrl,
      privacy_status: parsed.value.privacyStatus,
      is_visible: true
    });
  } catch (error) {
    console.error(error);
    return respond(
      request,
      { error: error instanceof Error ? error.message : "The video could not be uploaded.", lang },
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
  params.set(status >= 400 ? "error" : "uploaded", String(body.error || "1"));
  return NextResponse.redirect(new URL(`/admin/videos?${params.toString()}`, request.url), { status: 303 });
}

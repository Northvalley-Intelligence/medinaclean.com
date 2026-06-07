import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { buildReviewNotificationText, trySendSiteNotification } from "@/lib/site-notifications";
import { insertRow, isSupabaseConfigured, uploadReviewPhoto } from "@/lib/supabase-rest";

const maxPhotoBytes = 250 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = clean(formData.get("name"), 120);
  const message = clean(formData.get("message"), 1200);
  const language = formData.get("language") === "es" ? "es" : "en";
  const rating = Number(formData.get("rating"));
  const consent = formData.get("consent") === "true";
  const photo = formData.get("photo");

  if (!name || !message || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Missing required review fields." }, { status: 400 });
  }

  if (!consent) {
    return NextResponse.json({ error: "Consent is required before a public review can be submitted." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet. Add environment variables before accepting live reviews." },
      { status: 503 }
    );
  }

  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Photo uploads require Supabase service role configuration. Submit the review without a photo for now." },
        { status: 503 }
      );
    }

    if (!["image/webp", "image/jpeg", "image/png"].includes(photo.type) || photo.size > maxPhotoBytes) {
      return NextResponse.json({ error: "Photo must be a low-resolution image under 250 KB." }, { status: 400 });
    }

    try {
      photoPath = await uploadReviewPhoto(photo, `${randomUUID()}.webp`);
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "The review photo could not be uploaded." },
        { status: 500 }
      );
    }
  }

  try {
    await insertRow("reviews", {
      language,
      name,
      rating,
      message,
      photo_path: photoPath,
      consent_to_publish: consent,
      status: "pending"
    });
    await trySendSiteNotification({
      subject: `New Medina Clean review pending: ${name}`,
      text: buildReviewNotificationText({
        language,
        name,
        rating,
        message,
        hasPhoto: Boolean(photoPath)
      })
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The review could not be saved." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

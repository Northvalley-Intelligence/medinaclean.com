import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
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
    if (!["image/webp", "image/jpeg", "image/png"].includes(photo.type) || photo.size > maxPhotoBytes) {
      return NextResponse.json({ error: "Photo must be a low-resolution image under 250 KB." }, { status: 400 });
    }

    photoPath = await uploadReviewPhoto(photo, `${randomUUID()}.webp`);
  }

  await insertRow("reviews", {
    language,
    name,
    rating,
    message,
    photo_path: photoPath,
    consent_to_publish: consent,
    status: "pending"
  });

  return NextResponse.json({ ok: true });
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

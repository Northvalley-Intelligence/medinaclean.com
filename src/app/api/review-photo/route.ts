import { NextResponse } from "next/server";
import { createReviewPhotoSignedUrl } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path || path.includes("..") || path.includes("/") || !path.endsWith(".webp")) {
    return NextResponse.json({ error: "Invalid review photo path." }, { status: 400 });
  }

  try {
    const signedUrl = await createReviewPhotoSignedUrl(path);
    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Review photo could not be loaded." }, { status: 404 });
  }
}

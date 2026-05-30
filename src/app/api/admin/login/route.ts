import { NextResponse } from "next/server";
import { adminSessionCookie, createAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const password = String(formData?.get("password") || "");
  const lang = formData?.get("lang") === "en" ? "en" : "es";
  const langQuery = lang === "en" ? "?lang=en" : "";
  const session = await createAdminSession(password);

  if (!session.ok) {
    const params = new URLSearchParams();
    if (lang === "en") {
      params.set("lang", "en");
    }
    params.set("error", session.reason);
    return NextResponse.redirect(new URL(`/admin?${params.toString()}`, request.url), {
      status: 303
    });
  }

  const response = NextResponse.redirect(new URL(`/admin${langQuery}`, request.url), { status: 303 });
  response.cookies.set(adminSessionCookie, session.cookie, {
    httpOnly: true,
    maxAge: session.maxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}

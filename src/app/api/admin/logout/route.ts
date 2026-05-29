import { NextResponse } from "next/server";
import { adminSessionCookie } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
  response.cookies.set(adminSessionCookie, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}

import { NextResponse, type NextRequest } from "next/server";
import { getSeoRedirect } from "./lib/seo-redirects";

export function middleware(request: NextRequest) {
  const redirect = getSeoRedirect(request.url);

  if (redirect) {
    return NextResponse.redirect(redirect.url, redirect.status);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

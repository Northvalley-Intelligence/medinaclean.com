import { NextResponse, type NextRequest } from "next/server";
import { getSeoRedirect } from "@/lib/local-seo";

export function proxy(request: NextRequest) {
  const redirect = getSeoRedirect(request.url);

  if (!redirect) {
    return NextResponse.next();
  }

  return NextResponse.redirect(redirect.url, redirect.status);
}

export const config = {
  matcher: ["/", "/our-services", "/pricing-plans", "/pricing-for-residential", "/contactus", "/:path*"]
};

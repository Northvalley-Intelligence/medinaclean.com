import { NextResponse, type NextRequest } from "next/server";
import { getSeoRedirect } from "./lib/seo-redirects";

// OpenAI Apps domain-verification challenge. Served from middleware so it works regardless of how
// Cloudflare/OpenNext handles dotfolder static assets. Public token (meant to be served publicly).
const OPENAI_APPS_CHALLENGE_PATH = "/.well-known/openai-apps-challenge";
const OPENAI_APPS_CHALLENGE_TOKEN = "rELKH6yMIsvWfgD3kK4AJL9mMOGRWTfMRtZh0tLtaSg";

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  if (pathname === OPENAI_APPS_CHALLENGE_PATH) {
    return new NextResponse(OPENAI_APPS_CHALLENGE_TOKEN, {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  const redirect = getSeoRedirect(request.url);

  if (redirect) {
    return NextResponse.redirect(redirect.url, redirect.status);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
